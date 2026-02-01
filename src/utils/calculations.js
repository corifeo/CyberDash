/**
 * Calculation utilities for CyberDash
 * Pure functions for status, trend, and adoption calculations
 * Supports toggleable rules for customizable status calculation
 */

import { getAdoptedCount } from '../components/Dashboard';

// Trend detection thresholds (normalized score difference)
// Teams need a larger change to be considered improving/declining
export const TREND_THRESHOLDS = {
  team: 0.05,  // 5% change in practice score
  bu: 0.03,    // 3% change in average score across teams
};

// Helper to downgrade a status by one level
function downgradeStatus(status) {
  if (status === 'green') return 'amber';
  if (status === 'amber') return 'red';
  return 'red';
}

// Helper to upgrade a status by one level
function upgradeStatus(status) {
  if (status === 'red') return 'amber';
  if (status === 'amber') return 'green';
  return 'green';
}

// Get the maximum maturity level from a scale (excludes N/A which is -1)
export function getMaxMaturityLevel(maturityScale) {
  if (!maturityScale || maturityScale.length === 0) return 4;
  return Math.max(...maturityScale.map(l => l.level).filter(l => l > 0));
}

// Get status color based on current vs target
export function getMaturityStatus(current, target, type) {
  if (type === 'boolean') {
    return current === target ? 'met' : 'behind';
  }
  if (current >= target) return 'met';
  if (current >= target - 1) return 'close';
  return 'behind';
}

// Calculate a team's practice adoption score for trend comparison
// Returns a normalized score based on practices only (not RAG status)
// maxMaturityLevel: the highest level in the maturity scale (default 4)
export function calculateTeamPracticeScore(squad, practices, maxMaturityLevel = 4) {
  if (!squad.practices) return 0;
  let score = 0;
  let total = 0;

  Object.entries(squad.practices).forEach(([practiceId, value]) => {
    const def = practices[practiceId];
    if (!def) return;

    if (def.type === 'boolean') {
      if (value === 'na') return; // Skip N/A
      total += 1;
      if (value === true) score += 1;
    } else {
      if (value === -1) return; // Skip N/A
      total += maxMaturityLevel;
      score += Math.max(0, value);
    }
  });

  return total > 0 ? score / total : 0;
}

// Calculate automatic trend for a team by comparing with previous month
// Based purely on practice adoption, not RAG status
// maxMaturityLevel: the highest level in the maturity scale (default 4)
export function calculateAutoTrend(currentSquad, previousMonthData, buId, practices, maxMaturityLevel = 4) {
  if (!previousMonthData) return 'stable';

  // Find the same BU in previous month
  const previousBU = previousMonthData.businessUnits?.find(b => b.id === buId);
  if (!previousBU) return 'stable';

  // Find the same squad in previous month
  const previousSquad = previousBU.squads?.find(s => s.id === currentSquad.id);
  if (!previousSquad) return 'stable'; // New team = stable

  const currentScore = calculateTeamPracticeScore(currentSquad, practices, maxMaturityLevel);
  const previousScore = calculateTeamPracticeScore(previousSquad, practices, maxMaturityLevel);

  const diff = currentScore - previousScore;

  // Use threshold to determine significant change
  if (diff > TREND_THRESHOLDS.team) return 'improving';
  if (diff < -TREND_THRESHOLDS.team) return 'declining';
  return 'stable';
}

// Calculate automatic trend for a BU by comparing practice adoption
// Based purely on practice adoption across all teams, not RAG status
// maxMaturityLevel: the highest level in the maturity scale (default 4)
export function calculateBUAutoTrend(currentBU, previousMonthData, practices, maxMaturityLevel = 4) {
  if (!previousMonthData) return 'stable';

  const previousBU = previousMonthData.businessUnits?.find(b => b.id === currentBU.id);
  if (!previousBU) return 'stable';

  // Calculate average practice score for current BU
  const currentSquads = currentBU.squads.filter(s => s.tracked !== false);
  const previousSquads = previousBU.squads?.filter(s => s.tracked !== false) || [];

  if (currentSquads.length === 0) return 'stable';

  const currentAvg = currentSquads.reduce((sum, s) => sum + calculateTeamPracticeScore(s, practices, maxMaturityLevel), 0) / currentSquads.length;
  const previousAvg = previousSquads.length > 0
    ? previousSquads.reduce((sum, s) => sum + calculateTeamPracticeScore(s, practices, maxMaturityLevel), 0) / previousSquads.length
    : currentAvg;

  const diff = currentAvg - previousAvg;

  if (diff > TREND_THRESHOLDS.bu) return 'improving';
  if (diff < -TREND_THRESHOLDS.bu) return 'declining';
  return 'stable';
}

// Calculate practice adoption across all squads in a BU
// Returns: { practiceId: { adopted: number, partial: number, notAdopted: number, na: number, total: number } }
export function getPracticeAdoption(squads, definitions) {
  const trackedSquads = squads.filter(s => s.tracked !== false);
  const result = {};
  Object.entries(definitions).forEach(([practiceId, def]) => {
    let adopted = 0, partial = 0, notAdopted = 0, na = 0;
    const target = def.target || (def.type === 'boolean' ? true : 3);

    trackedSquads.forEach((squad) => {
      const value = squad.practices?.[practiceId];
      if (def.type === 'boolean') {
        if (value === 'na') na++;
        else if (value === target) adopted++;
        else notAdopted++;
      } else {
        if (value === -1) na++;
        else if (value >= target) adopted++;
        else if (value >= target - 1) partial++;
        else notAdopted++;
      }
    });

    const total = trackedSquads.length - na;
    result[practiceId] = { adopted, partial, notAdopted, na, total };
  });
  return result;
}

// Get weighted adopted count considering practice importance
// Returns { meetsTarget, total } with importance-weighted values
export function getWeightedAdoptedCount(squadPractices, practices, statusRules) {
  const practiceImportanceEnabled = statusRules?.practiceImportance?.enabled;
  const importantWeight = statusRules?.practiceImportance?.importantWeight ?? 1.5;

  let weightedMet = 0;
  let weightedTotal = 0;

  Object.entries(practices).forEach(([practiceId, def]) => {
    const value = squadPractices?.[practiceId];
    const target = def.target || (def.type === 'boolean' ? true : 3);

    // Skip N/A values
    if (def.type === 'boolean' && value === 'na') return;
    if (def.type !== 'boolean' && value === -1) return;

    // Determine weight based on importance
    const weight = (practiceImportanceEnabled && def.important) ? importantWeight : 1;

    // Check if practice meets target
    let meetsTarget = false;
    if (def.type === 'boolean') {
      meetsTarget = value === target;
    } else {
      meetsTarget = value >= target;
    }

    weightedTotal += weight;
    if (meetsTarget) {
      weightedMet += weight;
    }
  });

  return { meetsTarget: weightedMet, total: weightedTotal };
}

// Calculate automatic RAG status for a team based on practice adoption
// Supports toggleable rules from statusRules configuration
// Returns 'green', 'amber', 'red', or 'grey' based on rules
// statusRules: the full status rules configuration object
// trend: optional trend for trend-based adjustments ('improving', 'stable', 'declining')
// options: { stagnationMonths } - additional context for stagnation rule
export function calculateAutoRagStatus(squad, practices, statusRules, trend = 'stable', options = {}) {
  // Handle legacy thresholds format (backward compatibility)
  const thresholds = statusRules?.thresholds?.team || statusRules || { green: 75, amber: 40 };

  // Get adopted count (weighted if practice importance is enabled)
  const { meetsTarget, total } = statusRules?.practiceImportance?.enabled
    ? getWeightedAdoptedCount(squad.practices, practices, statusRules)
    : getAdoptedCount(squad.practices, practices);

  // Check grey status triggers first
  if (statusRules?.grey?.enabled) {
    const greyTrigger = statusRules.grey.trigger;
    if (greyTrigger === 'noPractices' && total === 0) {
      return 'grey';
    }
  }

  if (total === 0) return 'amber'; // No practices to measure

  const greenThreshold = (thresholds?.green ?? 75) / 100;
  const amberThreshold = (thresholds?.amber ?? 40) / 100;

  const percentage = meetsTarget / total;

  // Calculate base status from percentage
  let status;
  if (percentage >= greenThreshold) status = 'green';
  else if (percentage >= amberThreshold) status = 'amber';
  else status = 'red';

  // Apply trend rule if enabled
  if (statusRules?.trend?.enabled && trend) {
    const trendMode = statusRules.trend.mode || 'penalty';

    if (trend === 'declining') {
      if (trendMode === 'strict') {
        // Strict: declining teams capped at amber
        if (status === 'green') status = 'amber';
      } else {
        // Penalty: downgrade by one level
        status = downgradeStatus(status);
      }
    } else if (trend === 'improving' && trendMode === 'strict') {
      // In strict mode, improving can upgrade
      status = upgradeStatus(status);
    }
  }

  // Apply stagnation penalty if enabled
  if (statusRules?.stagnation?.enabled && options.stagnationMonths !== undefined) {
    const monthsThreshold = statusRules.stagnation.monthsThreshold || 3;
    const penalty = statusRules.stagnation.penalty || 'downgrade';

    if (options.stagnationMonths >= monthsThreshold) {
      if (penalty === 'red') {
        status = 'red';
      } else {
        status = downgradeStatus(status);
      }
    }
  }

  return status;
}

// Get effective status for a squad (considering auto-status and trend)
// statusRules: the full status rules configuration (or legacy thresholds for backward compatibility)
export function getEffectiveSquadStatus(squad, practices, statusRules, trend = 'stable', options = {}) {
  if (squad.tracked === false) return 'none';
  if (squad.autoStatus !== false) {
    return calculateAutoRagStatus(squad, practices, statusRules, trend, options);
  }
  return squad.status || 'red';
}

// Calculate weighted BU RAG status from tracked squads
// Uses percentage-based thresholds (e.g., 75% of teams are green)
// statusRules: the full status rules configuration (supports both new and legacy format)
// buTrend: optional BU-level trend for rule-based adjustments
// previousMonthData and currentBU: used to compute team-level trends when trend rules are enabled
// maxMaturityLevel: the highest level in the maturity scale (default 4)
export function getWeightedBuStatus(squads, practices, statusRules, buTrend = 'stable', previousMonthData = null, currentBU = null, maxMaturityLevel = 4) {
  // Handle legacy format (separate teamThresholds and buThresholds)
  // New format: statusRules contains everything
  const teamThresholds = statusRules?.thresholds?.team || statusRules;
  const buThresholds = statusRules?.thresholds?.bu || { green: 75, amber: 40 };
  const useTeamWeights = statusRules?.teamWeights?.enabled !== false; // Default true for backward compatibility

  // Filter to only tracked squads
  const trackedSquads = squads.filter(s => s.tracked !== false);
  const totalSquads = squads.length;
  const untrackedCount = totalSquads - trackedSquads.length;

  // Check grey status triggers
  if (statusRules?.grey?.enabled) {
    const greyTrigger = statusRules.grey.trigger;
    const scopeThreshold = statusRules.grey.scopeThreshold ?? 50;

    if (greyTrigger === 'allUntracked' && trackedSquads.length === 0) {
      return { status: 'grey', details: { green: 0, amber: 0, red: 0, grey: 0, total: 0, greenPercent: 0 } };
    }

    if (greyTrigger === 'scopeThreshold' && totalSquads > 0) {
      const untrackedPercent = (untrackedCount / totalSquads) * 100;
      if (untrackedPercent >= scopeThreshold) {
        return { status: 'grey', details: { green: 0, amber: 0, red: 0, grey: 0, total: trackedSquads.length, greenPercent: 0, untrackedPercent: Math.round(untrackedPercent) } };
      }
    }
  }

  if (trackedSquads.length === 0) {
    return { status: 'none', details: { green: 0, amber: 0, red: 0, grey: 0, total: 0, greenPercent: 0 } };
  }

  let statusCounts = { green: 0, amber: 0, red: 0, grey: 0 };
  let totalWeight = 0;
  let greenWeight = 0;

  trackedSquads.forEach(squad => {
    // Only apply weight if team weights rule is enabled
    const weight = useTeamWeights ? (squad.weight || 1) : 1;

    // Calculate team trend if we have previous data
    const teamTrend = previousMonthData && currentBU
      ? calculateAutoTrend(squad, previousMonthData, currentBU.id, practices, maxMaturityLevel)
      : 'stable';

    // Get effective status (considering auto-status and trend for team rule)
    const effectiveStatus = getEffectiveSquadStatus(squad, practices, statusRules, teamTrend);

    if (effectiveStatus && effectiveStatus !== 'none') {
      totalWeight += weight;
      if (statusCounts[effectiveStatus] !== undefined) {
        statusCounts[effectiveStatus]++;
      }
      if (effectiveStatus === 'green') {
        greenWeight += weight;
      }
    }
  });

  if (totalWeight === 0) {
    return { status: 'none', details: { ...statusCounts, total: trackedSquads.length, greenPercent: 0 } };
  }

  // Calculate percentage of green teams (weighted if enabled)
  const greenPercent = (greenWeight / totalWeight) * 100;

  // Calculate base BU status from percentage
  let status;
  if (greenPercent >= (buThresholds?.green ?? 75)) status = 'green';
  else if (greenPercent >= (buThresholds?.amber ?? 40)) status = 'amber';
  else status = 'red';

  // Apply BU-level trend rule if enabled
  if (statusRules?.trend?.enabled && buTrend) {
    const trendMode = statusRules.trend.mode || 'penalty';

    if (buTrend === 'declining') {
      if (trendMode === 'strict') {
        // Strict: declining BUs capped at amber
        if (status === 'green') status = 'amber';
      } else {
        // Penalty: downgrade by one level
        status = downgradeStatus(status);
      }
    } else if (buTrend === 'improving' && trendMode === 'strict') {
      // In strict mode, improving can upgrade
      status = upgradeStatus(status);
    }
  }

  return {
    status,
    details: { ...statusCounts, total: trackedSquads.length, greenPercent: Math.round(greenPercent) }
  };
}

// Get next month suggestion
export function getNextMonthSuggestion(currentMonth) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  let nextYear, nextMonth;
  if (year < currentYear || (year === currentYear && month < currentMonthNum)) {
    nextYear = currentYear;
    nextMonth = currentMonthNum;
  } else {
    nextMonth = month + 1;
    nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    key: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
    label: `${monthNames[nextMonth - 1]} ${nextYear}`,
  };
}
