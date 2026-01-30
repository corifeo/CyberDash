/**
 * CyberDash - Security Practices Calculation Utilities
 */

/**
 * Calculate RAG status based on practices scores
 * @param {Object} practices - Squad practices object
 * @param {Object} practiceDefinitions - Practice definitions
 * @returns {'green' | 'amber' | 'red'}
 */
export function calculateRAGStatus(practices, practiceDefinitions) {
  let score = 0;
  let maxScore = 0;

  Object.entries(practices).forEach(([key, value]) => {
    const practice = practiceDefinitions[key];
    if (!practice) return;

    if (practice.type === 'boolean') {
      score += value ? 1 : 0;
      maxScore += 1;
    } else if (practice.type === 'maturity') {
      score += value / 4;
      maxScore += 1;
    }
  });

  const percentage = maxScore > 0 ? score / maxScore : 0;

  if (percentage >= 0.75) return 'green';
  if (percentage >= 0.4) return 'amber';
  return 'red';
}

/**
 * Calculate practice adoption stats
 * @param {Object} practices - Squad practices object
 * @param {Object} practiceDefinitions - Practice definitions
 * @returns {{ adopted: number, total: number, percentage: number }}
 */
export function calculatePracticeAdoption(practices, practiceDefinitions) {
  let adopted = 0;
  let total = 0;

  Object.entries(practices).forEach(([key, value]) => {
    const practice = practiceDefinitions[key];
    if (!practice) return;

    total++;
    if (practice.type === 'boolean') {
      adopted += value ? 1 : 0;
    } else if (practice.type === 'maturity') {
      adopted += value >= 3 ? 1 : 0;
    }
  });

  return {
    adopted,
    total,
    percentage: total > 0 ? Math.round((adopted / total) * 100) : 0,
  };
}

/**
 * Calculate overall score for a squad (0-100)
 * @param {Object} practices - Squad practices object
 * @param {Object} practiceDefinitions - Practice definitions
 * @returns {number}
 */
export function calculateOverallScore(practices, practiceDefinitions) {
  let score = 0;
  let maxScore = 0;

  Object.entries(practices).forEach(([key, value]) => {
    const practice = practiceDefinitions[key];
    if (!practice) return;

    if (practice.type === 'boolean') {
      score += value ? 100 : 0;
      maxScore += 100;
    } else if (practice.type === 'maturity') {
      score += (value / 4) * 100;
      maxScore += 100;
    }
  });

  return maxScore > 0 ? Math.round(score / (maxScore / 100)) : 0;
}

/**
 * Get dominant trend from an array of trends
 * @param {string[]} trends - Array of trend values
 * @returns {'improving' | 'stable' | 'declining'}
 */
export function getDominantTrend(trends) {
  const counts = { improving: 0, stable: 0, declining: 0 };
  trends.forEach((trend) => {
    if (counts[trend] !== undefined) counts[trend]++;
  });

  if (counts.declining > 0 && counts.declining >= counts.improving) return 'declining';
  if (counts.improving > counts.stable) return 'improving';
  return 'stable';
}

/**
 * Get dominant RAG status from an array of statuses
 * @param {string[]} statuses - Array of RAG status values
 * @returns {'green' | 'amber' | 'red'}
 */
export function getDominantStatus(statuses) {
  const counts = { green: 0, amber: 0, red: 0 };
  statuses.forEach((status) => {
    if (counts[status] !== undefined) counts[status]++;
  });

  if (counts.red > 0) return 'red';
  if (counts.amber > counts.green) return 'amber';
  return 'green';
}

/**
 * Aggregate stats for a business unit
 * @param {Object} businessUnit - Business unit with squads
 * @param {Object} practiceDefinitions - Practice definitions
 * @returns {Object}
 */
export function aggregateBusinessUnitStats(businessUnit, practiceDefinitions) {
  const squads = businessUnit.squads || [];
  const statuses = [];
  const trends = [];
  let totalScore = 0;

  squads.forEach((squad) => {
    statuses.push(calculateRAGStatus(squad.practices, practiceDefinitions));
    trends.push(squad.monthlyUpdate?.trend || 'stable');
    totalScore += calculateOverallScore(squad.practices, practiceDefinitions);
  });

  return {
    squadCount: squads.length,
    dominantStatus: getDominantStatus(statuses),
    dominantTrend: getDominantTrend(trends),
    averageScore: squads.length > 0 ? Math.round(totalScore / squads.length) : 0,
    statusCounts: {
      green: statuses.filter((s) => s === 'green').length,
      amber: statuses.filter((s) => s === 'amber').length,
      red: statuses.filter((s) => s === 'red').length,
    },
  };
}

/**
 * Generate chart data for practices by category
 * @param {Object} practices - Squad practices object
 * @param {Object} practiceDefinitions - Practice definitions
 * @returns {Array}
 */
export function generateCategoryChartData(practices, practiceDefinitions) {
  const categories = {};

  Object.entries(practices).forEach(([key, value]) => {
    const practice = practiceDefinitions[key];
    if (!practice) return;

    const category = practice.category || 'other';
    if (!categories[category]) {
      categories[category] = { name: category, score: 0, max: 0 };
    }

    if (practice.type === 'boolean') {
      categories[category].score += value ? 100 : 0;
      categories[category].max += 100;
    } else {
      categories[category].score += (value / 4) * 100;
      categories[category].max += 100;
    }
  });

  return Object.values(categories).map((cat) => ({
    name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
    value: cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0,
    fullMark: 100,
  }));
}
