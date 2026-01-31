/**
 * Calculation utilities for CyberDash
 * Pure functions for status, trend, and adoption calculations
 */

import { getAdoptedCount } from '../components/Dashboard';

// Trend detection thresholds (normalized score difference)
// Teams need a larger change to be considered improving/declining
export const TREND_THRESHOLDS = {
  team: 0.05,  // 5% change in practice score
  bu: 0.03,    // 3% change in average score across teams
};

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
  const result = {};
  Object.entries(definitions).forEach(([practiceId, def]) => {
    let adopted = 0, partial = 0, notAdopted = 0, na = 0;
    const target = def.target || (def.type === 'boolean' ? true : 3);

    squads.forEach((squad) => {
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

    const total = squads.length - na;
    result[practiceId] = { adopted, partial, notAdopted, na, total };
  });
  return result;
}

// Calculate automatic RAG status for a team based on practice adoption
// Returns 'green', 'amber', or 'red' based on percentage of practices at target
// thresholds: { green: 75, amber: 40, rule: 'percentage' } - percentage values and rule type
// trend: optional trend for rule-based adjustments ('improving', 'stable', 'declining')
export function calculateAutoRagStatus(squad, practices, thresholds, trend = 'stable') {
  const { meetsTarget, total } = getAdoptedCount(squad.practices, practices);
  if (total === 0) return 'amber'; // No practices to measure

  const greenThreshold = (thresholds?.green ?? 75) / 100;
  const amberThreshold = (thresholds?.amber ?? 40) / 100;
  const rule = thresholds?.rule || 'percentage';

  const percentage = meetsTarget / total;

  // Calculate base status from percentage
  let baseStatus;
  if (percentage >= greenThreshold) baseStatus = 'green';
  else if (percentage >= amberThreshold) baseStatus = 'amber';
  else baseStatus = 'red';

  // Apply rule-based adjustments
  if (rule === 'percentage') {
    // Pure percentage-based: no trend adjustment
    return baseStatus;
  } else if (rule === 'trend') {
    // Percentage + Trend Penalty: declining trend downgrades by one level
    if (trend === 'declining') {
      if (baseStatus === 'green') return 'amber';
      if (baseStatus === 'amber') return 'red';
    }
    return baseStatus;
  } else if (rule === 'strictTrend') {
    // Trend Priority: declining = amber max, improving can upgrade
    if (trend === 'declining') {
      // Declining trend: can't be better than amber
      return baseStatus === 'red' ? 'red' : 'amber';
    } else if (trend === 'improving') {
      // Improving trend: can upgrade by one level
      if (baseStatus === 'red') return 'amber';
      if (baseStatus === 'amber') return 'green';
    }
    return baseStatus;
  }

  return baseStatus;
}

// Get effective status for a squad (considering auto-status and trend)
export function getEffectiveSquadStatus(squad, practices, thresholds, trend = 'stable') {
  if (squad.tracked === false) return 'none';
  if (squad.autoStatus !== false) {
    return calculateAutoRagStatus(squad, practices, thresholds, trend);
  }
  return squad.status || 'red';
}

// Calculate weighted BU RAG status from tracked squads
// Uses percentage-based thresholds (e.g., 75% of teams are green)
// practices and teamThresholds are needed to compute effective status for squads with auto-status
// buTrend: optional BU-level trend for rule-based adjustments
// previousMonthData and currentBU: used to compute team-level trends when team thresholds have trend rules
// maxMaturityLevel: the highest level in the maturity scale (default 4)
export function getWeightedBuStatus(squads, practices, teamThresholds, buThresholds = { green: 75, amber: 40 }, buTrend = 'stable', previousMonthData = null, currentBU = null, maxMaturityLevel = 4) {
  // Filter to only tracked squads
  const trackedSquads = squads.filter(s => s.tracked !== false);

  if (trackedSquads.length === 0) {
    return { status: 'none', details: { green: 0, amber: 0, red: 0, total: 0, greenPercent: 0 } };
  }

  let statusCounts = { green: 0, amber: 0, red: 0 };
  let totalWeight = 0;
  let greenWeight = 0;

  trackedSquads.forEach(squad => {
    const weight = squad.weight || 1;
    // Calculate team trend if we have previous data
    const teamTrend = previousMonthData && currentBU
      ? calculateAutoTrend(squad, previousMonthData, currentBU.id, practices, maxMaturityLevel)
      : 'stable';
    // Get effective status (considering auto-status and trend for team rule)
    const effectiveStatus = getEffectiveSquadStatus(squad, practices, teamThresholds, teamTrend);

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

  // Calculate percentage of green teams (weighted)
  const greenPercent = (greenWeight / totalWeight) * 100;
  const buRule = buThresholds?.rule || 'percentage';

  // Calculate base BU status from percentage
  let baseStatus;
  if (greenPercent >= (buThresholds?.green ?? 75)) baseStatus = 'green';
  else if (greenPercent >= (buThresholds?.amber ?? 40)) baseStatus = 'amber';
  else baseStatus = 'red';

  // Apply BU-level rule-based adjustments
  let status = baseStatus;
  if (buRule === 'trend') {
    // Percentage + Trend Penalty: declining trend downgrades by one level
    if (buTrend === 'declining') {
      if (baseStatus === 'green') status = 'amber';
      else if (baseStatus === 'amber') status = 'red';
    }
  } else if (buRule === 'strictTrend') {
    // Trend Priority: declining = amber max, improving can upgrade
    if (buTrend === 'declining') {
      status = baseStatus === 'red' ? 'red' : 'amber';
    } else if (buTrend === 'improving') {
      if (baseStatus === 'red') status = 'amber';
      else if (baseStatus === 'amber') status = 'green';
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
