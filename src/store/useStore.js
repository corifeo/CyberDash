import { useState, useEffect, useCallback } from 'react';

// Import default practices and test data
import DEFAULT_PRACTICES from '../defaults/practices.json';
import TEST_DATA from '../defaults/testData.json';

// Default maturity scale
const DEFAULT_MATURITY_SCALE = [
  { level: -1, label: "N/A", short: "N/A", description: "Not applicable to this team" },
  { level: 0, label: "Not Started", short: "0", description: "Practice not yet initiated" },
  { level: 1, label: "Initial", short: "1", description: "Ad-hoc, reactive approach with no formal process" },
  { level: 2, label: "Developing", short: "2", description: "Basic process defined but inconsistently applied" },
  { level: 3, label: "Defined", short: "3", description: "Standardized process consistently followed" },
  { level: 4, label: "Managed", short: "4", description: "Process measured and continuously improved" },
];

// Default RAG colors (includes grey for out-of-scope/insufficient data)
const DEFAULT_RAG_COLORS = {
  green: { hex: "#059669", label: "Strong" },
  amber: { hex: "#d97706", label: "Developing" },
  red: { hex: "#dc2626", label: "Early Stage" },
  grey: { hex: "#6b7280", label: "Insufficient Data" },
  none: { hex: "#64748b", label: "Not Tracked" },
};

// Default team types
const DEFAULT_TEAM_TYPES = [
  { id: "squad", label: "Squad" },
  { id: "tribe", label: "Tribe" },
  { id: "team", label: "Team" },
  { id: "platform", label: "Platform Team" },
];

// Toggleable status rules configuration
// Each rule can be enabled/disabled independently and has its own configuration
const DEFAULT_STATUS_RULES = {
  // Core thresholds (always active, defines green/amber/red boundaries)
  thresholds: {
    team: { green: 75, amber: 40 },
    bu: { green: 75, amber: 40 },
  },

  // Trend modifier - penalizes declining trends
  trend: {
    enabled: false,
    mode: 'penalty', // 'penalty' = downgrade by 1, 'strict' = declining caps at amber
    description: 'Penalize declining trends by downgrading status',
  },

  // Team weights - consider team weight in BU calculations
  teamWeights: {
    enabled: true, // On by default as it was before
    description: 'Weight teams differently in BU status calculation',
  },

  // Practice importance - important practices count more
  practiceImportance: {
    enabled: false,
    importantWeight: 1.5, // Important practices count 1.5x
    description: 'Important practices (starred) have more impact on status',
  },

  // Stagnation penalty - penalize teams stuck below target
  stagnation: {
    enabled: false,
    monthsThreshold: 3, // Number of months without progress
    penalty: 'downgrade', // 'downgrade' = drop 1 level, 'red' = force red
    description: 'Penalize teams under target for multiple months without improvement',
  },

  // Grey status triggers - conditions that result in grey (insufficient data) status
  grey: {
    enabled: false,
    trigger: 'scopeThreshold', // 'scopeThreshold' | 'allUntracked' | 'noPractices'
    scopeThreshold: 50, // % of teams out of scope to trigger grey
    description: 'Show grey status when data is insufficient or most teams are out of scope',
  },
};

// Default thresholds (kept for backward compatibility, now derived from statusRules)
// The statusRules structure is the source of truth
const DEFAULT_THRESHOLDS = {
  team: { green: 75, amber: 40 },
  bu: { green: 75, amber: 40 },
};

// Available color themes (includes grey for insufficient data status)
const COLOR_THEMES = {
  default: {
    green: { hex: '#059669' },
    amber: { hex: '#d97706' },
    red: { hex: '#dc2626' },
    grey: { hex: '#6b7280' },
    none: { hex: '#64748b' },
  },
  muted: {
    green: { hex: '#0f766e' },
    amber: { hex: '#a16207' },
    red: { hex: '#be123c' },
    grey: { hex: '#4b5563' },
    none: { hex: '#475569' },
  },
  vibrant: {
    green: { hex: '#22c55e' },
    amber: { hex: '#f97316' },
    red: { hex: '#ef4444' },
    grey: { hex: '#9ca3af' },
    none: { hex: '#94a3b8' },
  },
  corporate: {
    green: { hex: '#0891b2' },
    amber: { hex: '#64748b' },
    red: { hex: '#4f46e5' },
    grey: { hex: '#71717a' },
    none: { hex: '#334155' },
  },
};

// Default practice order
const DEFAULT_PRACTICE_ORDER = [
  "embeddedSecurityExperts",
  "threatModeling",
  "secureCodeReview",
  "automatedSecurityTesting",
  "dependencyScanning",
  "secretsManagement",
  "securityRequirements",
  "vulnerabilityManagement",
  "incidentResponse",
  "securityTesting",
];

// Default starter data
const DEFAULT_DATA = {
  currentMonth: "2025-01",
  maturityScale: DEFAULT_MATURITY_SCALE,
  practices: DEFAULT_PRACTICES,
  practiceOrder: DEFAULT_PRACTICE_ORDER,
  ragColors: DEFAULT_RAG_COLORS,
  teamTypes: DEFAULT_TEAM_TYPES,
  thresholds: DEFAULT_THRESHOLDS,
  statusRules: DEFAULT_STATUS_RULES,
  darkMode: true,
  colorTheme: 'default',
  months: {
    "2025-01": {
      reportingPeriod: "January 2025",
      businessUnits: [],
    },
  },
};

const STORAGE_KEY = "cyberdash-data";

// Generate a URL-friendly slug from a practice name
function generateSlug(name, existingIds = []) {
  let slug = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (_, c) => c.toLowerCase());

  if (!slug) {
    slug = 'practice';
  }

  let finalSlug = slug;
  let counter = 2;
  while (existingIds.includes(finalSlug)) {
    finalSlug = `${slug}${counter++}`;
  }

  return finalSlug;
}

// Check if an ID looks like a timestamp-based ID
function isTimestampId(id) {
  return /^practice-\d{13,}$/.test(id);
}

// Load from localStorage or use defaults
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old threshold format if needed
      if (parsed.buThresholds && !parsed.thresholds) {
        parsed.thresholds = {
          team: parsed.teamThresholds || DEFAULT_THRESHOLDS.team,
          bu: parsed.buThresholds || DEFAULT_THRESHOLDS.bu,
        };
        delete parsed.buThresholds;
        delete parsed.teamThresholds;
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return DEFAULT_DATA;
}

// Save to localStorage
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

/**
 * Simple store hook for CyberDash
 */
export function useStore() {
  const [data, setData] = useState(loadData);

  // Auto-save whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Get current month's data
  const currentMonthData = data.months[data.currentMonth] || null;

  // Switch to a different month
  const setCurrentMonth = useCallback((monthKey) => {
    setData((prev) => ({ ...prev, currentMonth: monthKey }));
  }, []);

  // Create a new month (copies full data from current month, only clears update text)
  const createNewMonth = useCallback((monthKey, label) => {
    setData((prev) => {
      const currentData = prev.months[prev.currentMonth];
      const newMonthData = JSON.parse(JSON.stringify(currentData));
      newMonthData.reportingPeriod = label;
      newMonthData.businessUnits.forEach((bu) => {
        bu.squads.forEach((squad) => {
          squad.monthlyUpdate.summary = "";
          squad.monthlyUpdate.nextPeriod = "";
        });
      });
      return {
        ...prev,
        currentMonth: monthKey,
        months: { ...prev.months, [monthKey]: newMonthData },
      };
    });
  }, []);

  // Update a squad's field
  const updateSquad = useCallback((buId, squadId, path, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const bu = newData.months[newData.currentMonth].businessUnits.find(
        (b) => b.id === buId
      );
      if (!bu) return prev;
      const squad = bu.squads.find((s) => s.id === squadId);
      if (!squad) return prev;

      const parts = path.split(".");
      let target = squad;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;

      return newData;
    });
  }, []);

  // Update business unit name
  const updateBusinessUnit = useCallback((buId, name) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const bu = newData.months[newData.currentMonth].businessUnits.find(
        (b) => b.id === buId
      );
      if (bu) bu.name = name;
      return newData;
    });
  }, []);

  // Add a new business unit
  const addBusinessUnit = useCallback(() => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const id = `bu-${Date.now()}`;
      newData.months[newData.currentMonth].businessUnits.push({
        id,
        name: "New Business Unit",
        squads: [],
      });
      return newData;
    });
  }, []);

  // Add a new team (squad/tribe) to a business unit
  const addSquad = useCallback((buId, teamType = 'squad') => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const bu = newData.months[newData.currentMonth].businessUnits.find(
        (b) => b.id === buId
      );
      if (!bu) return prev;

      const teamTypes = prev.teamTypes || DEFAULT_TEAM_TYPES;
      const typeInfo = teamTypes.find(t => t.id === teamType) || teamTypes[0];
      const id = `team-${Date.now()}`;
      bu.squads.push({
        id,
        name: `New ${typeInfo.label}`,
        teamType: teamType,
        status: "red",
        tracked: false,
        autoStatus: true, // Enable auto-status by default
        weight: 1,
        practices: Object.fromEntries(
          Object.entries(prev.practices).map(([key, p]) => [
            key,
            p.type === "boolean" ? false : 0,
          ])
        ),
        monthlyUpdate: {
          summary: "",
          nextPeriod: "",
          trend: "stable",
        },
      });
      return newData;
    });
  }, []);

  // Delete a squad
  const deleteSquad = useCallback((buId, squadId) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const bu = newData.months[newData.currentMonth].businessUnits.find(
        (b) => b.id === buId
      );
      if (!bu) return prev;
      bu.squads = bu.squads.filter((s) => s.id !== squadId);
      return newData;
    });
  }, []);

  // Delete a business unit
  const deleteBusinessUnit = useCallback((buId) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData.months[newData.currentMonth].businessUnits =
        newData.months[newData.currentMonth].businessUnits.filter((b) => b.id !== buId);
      return newData;
    });
  }, []);

  // Export current month data only
  const exportCurrentMonth = useCallback(() => {
    const monthData = data.months[data.currentMonth];
    const exportObj = {
      type: 'month',
      monthKey: data.currentMonth,
      data: monthData,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdash-month-${data.currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // Import current month data
  const importCurrentMonth = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.type === 'month' && imported.data) {
        setData((prev) => {
          const newData = JSON.parse(JSON.stringify(prev));
          const targetMonth = imported.monthKey || prev.currentMonth;
          newData.months[targetMonth] = imported.data;
          if (!newData.months[newData.currentMonth]) {
            newData.currentMonth = targetMonth;
          }
          return newData;
        });
        return true;
      }
      if (imported.months) {
        setData(imported);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import month:", e);
      return false;
    }
  }, []);

  // Export all archive
  const exportAllArchive = useCallback(() => {
    const exportObj = {
      type: 'archive',
      currentMonth: data.currentMonth,
      months: data.months,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdash-archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // Import all archive
  const importAllArchive = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.type === 'archive' && imported.months) {
        setData((prev) => ({
          ...prev,
          currentMonth: imported.currentMonth || Object.keys(imported.months).sort().reverse()[0],
          months: imported.months,
        }));
        return true;
      }
      if (imported.months && !imported.type) {
        setData((prev) => ({
          ...prev,
          currentMonth: imported.currentMonth || prev.currentMonth,
          months: imported.months,
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import archive:", e);
      return false;
    }
  }, []);

  // Export settings
  const exportSettings = useCallback(() => {
    const exportObj = {
      type: 'settings',
      maturityScale: data.maturityScale,
      practices: data.practices,
      practiceOrder: data.practiceOrder,
      ragColors: data.ragColors,
      thresholds: data.thresholds,
      statusRules: data.statusRules,
      colorTheme: data.colorTheme,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdash-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // Import settings
  const importSettings = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.type === 'settings') {
        setData((prev) => ({
          ...prev,
          maturityScale: imported.maturityScale || prev.maturityScale,
          practices: imported.practices || prev.practices,
          practiceOrder: imported.practiceOrder || prev.practiceOrder,
          ragColors: imported.ragColors || prev.ragColors,
          thresholds: imported.thresholds || prev.thresholds,
          statusRules: imported.statusRules || prev.statusRules,
          colorTheme: imported.colorTheme || prev.colorTheme,
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import settings:", e);
      return false;
    }
  }, []);

  // Legacy export all data
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdash-full-export-${data.currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // Legacy import data
  const importData = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.type === 'month') {
        return importCurrentMonth(jsonString);
      }
      if (imported.type === 'archive') {
        return importAllArchive(jsonString);
      }
      if (imported.type === 'settings') {
        return importSettings(jsonString);
      }
      setData(imported);
      return true;
    } catch (e) {
      console.error("Failed to import:", e);
      return false;
    }
  }, [importCurrentMonth, importAllArchive, importSettings]);

  // Reset to defaults
  const resetData = useCallback(() => {
    setData(DEFAULT_DATA);
  }, []);

  // Reset current month to previous period's data
  const resetToLastPeriod = useCallback(() => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sortedMonths = Object.keys(newData.months).sort().reverse();
      const currentIndex = sortedMonths.indexOf(newData.currentMonth);

      let resetBusinessUnits;
      if (currentIndex < 0 || currentIndex >= sortedMonths.length - 1) {
        resetBusinessUnits = [];
      } else {
        const previousMonth = sortedMonths[currentIndex + 1];
        const previousData = newData.months[previousMonth];
        resetBusinessUnits = JSON.parse(JSON.stringify(previousData.businessUnits));
      }

      newData.months[newData.currentMonth] = {
        ...newData.months[newData.currentMonth],
        businessUnits: resetBusinessUnits,
      };

      return newData;
    });
  }, []);

  // Update a practice definition
  const updatePractice = useCallback((practiceId, field, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (newData.practices[practiceId]) {
        newData.practices[practiceId][field] = value;
      }
      return newData;
    });
  }, []);

  // Generate a random color for new practices
  const generateRandomColor = () => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Add a new practice
  const addPractice = useCallback((name, type = 'maturity', color = null) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const existingIds = Object.keys(newData.practices);
      const id = generateSlug(name, existingIds);
      const defaultTarget = type === 'boolean' ? true : 3;
      const practiceColor = color || generateRandomColor();

      newData.practices[id] = { name, type, target: defaultTarget, color: practiceColor };

      if (!newData.practiceOrder) {
        newData.practiceOrder = Object.keys(newData.practices);
      }
      newData.practiceOrder.push(id);

      Object.values(newData.months).forEach((month) => {
        month.businessUnits.forEach((bu) => {
          bu.squads.forEach((squad) => {
            squad.practices[id] = type === 'boolean' ? false : 0;
          });
        });
      });

      return newData;
    });
  }, []);

  // Delete a practice
  const deletePractice = useCallback((practiceId) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));

      delete newData.practices[practiceId];

      if (newData.practiceOrder) {
        newData.practiceOrder = newData.practiceOrder.filter(id => id !== practiceId);
      }

      Object.values(newData.months).forEach((month) => {
        month.businessUnits.forEach((bu) => {
          bu.squads.forEach((squad) => {
            delete squad.practices[practiceId];
          });
        });
      });

      return newData;
    });
  }, []);

  // Update maturity scale
  const updateMaturityScale = useCallback((index, field, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.maturityScale) {
        newData.maturityScale = DEFAULT_MATURITY_SCALE;
      }
      if (newData.maturityScale[index]) {
        newData.maturityScale[index][field] = value;
      }
      return newData;
    });
  }, []);

  // Delete a month
  const deleteMonth = useCallback((monthKey) => {
    setData((prev) => {
      const monthKeys = Object.keys(prev.months);
      if (monthKeys.length <= 1) return prev;
      if (monthKey === prev.currentMonth) return prev;

      const newData = JSON.parse(JSON.stringify(prev));
      delete newData.months[monthKey];
      return newData;
    });
  }, []);

  // Toggle dark mode
  const setDarkMode = useCallback((enabled) => {
    setData((prev) => ({ ...prev, darkMode: enabled }));
  }, []);

  // Set color theme
  const setColorPreset = useCallback((themeName) => {
    setData((prev) => {
      const theme = COLOR_THEMES[themeName];
      if (!theme) return prev;
      return {
        ...prev,
        colorTheme: themeName,
        ragColors: {
          green: { hex: theme.green.hex, label: prev.ragColors?.green?.label || 'Strong' },
          amber: { hex: theme.amber.hex, label: prev.ragColors?.amber?.label || 'Developing' },
          red: { hex: theme.red.hex, label: prev.ragColors?.red?.label || 'Early Stage' },
          grey: { hex: theme.grey.hex, label: prev.ragColors?.grey?.label || 'Insufficient Data' },
          none: { hex: theme.none.hex, label: prev.ragColors?.none?.label || 'Not Tracked' },
        },
      };
    });
  }, []);

  // Update RAG color
  const updateRagColor = useCallback((status, field, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.ragColors) newData.ragColors = DEFAULT_RAG_COLORS;
      if (!newData.ragColors[status]) {
        newData.ragColors[status] = { hex: '#888888', label: status };
      }
      newData.ragColors[status][field] = value;
      newData.colorTheme = 'custom';
      return newData;
    });
  }, []);

  // Update RAG label
  const updateRagLabel = useCallback((status, label) => {
    updateRagColor(status, 'label', label);
  }, [updateRagColor]);

  // Reorder practices
  const reorderPractice = useCallback((fromIndex, toIndex) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const order = newData.practiceOrder || Object.keys(newData.practices);
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      newData.practiceOrder = order;
      return newData;
    });
  }, []);

  // Update team types
  const updateTeamType = useCallback((index, field, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.teamTypes) {
        newData.teamTypes = DEFAULT_TEAM_TYPES;
      }
      if (newData.teamTypes[index]) {
        newData.teamTypes[index][field] = value;
      }
      return newData;
    });
  }, []);

  // Update threshold (unified for both BU and team)
  const updateThreshold = useCallback((type, level, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      // Update both thresholds (for backward compatibility) and statusRules.thresholds
      if (!newData.thresholds) {
        newData.thresholds = DEFAULT_THRESHOLDS;
      }
      if (!newData.thresholds[type]) {
        newData.thresholds[type] = DEFAULT_THRESHOLDS[type];
      }
      if (!newData.statusRules) {
        newData.statusRules = DEFAULT_STATUS_RULES;
      }
      if (!newData.statusRules.thresholds) {
        newData.statusRules.thresholds = DEFAULT_STATUS_RULES.thresholds;
      }
      if (!newData.statusRules.thresholds[type]) {
        newData.statusRules.thresholds[type] = DEFAULT_STATUS_RULES.thresholds[type];
      }
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        newData.thresholds[type][level] = numValue;
        newData.statusRules.thresholds[type][level] = numValue;
      }
      return newData;
    });
  }, []);

  // Toggle a status rule on/off
  const toggleStatusRule = useCallback((ruleName, enabled) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.statusRules) {
        newData.statusRules = DEFAULT_STATUS_RULES;
      }
      if (newData.statusRules[ruleName] !== undefined && ruleName !== 'thresholds') {
        newData.statusRules[ruleName].enabled = enabled;
      }
      return newData;
    });
  }, []);

  // Update a status rule's configuration option
  const updateStatusRuleConfig = useCallback((ruleName, configKey, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.statusRules) {
        newData.statusRules = DEFAULT_STATUS_RULES;
      }
      if (newData.statusRules[ruleName] !== undefined && ruleName !== 'thresholds') {
        newData.statusRules[ruleName][configKey] = value;
      }
      return newData;
    });
  }, []);

  // Migrate practice IDs from timestamp-based to slug-based
  // Returns the number of practices that were migrated
  const migratePracticeIds = useCallback(() => {
    // First, count how many timestamp IDs exist in current data
    // This is done synchronously before setData to ensure accurate count
    const timestampIds = Object.keys(data.practices).filter(isTimestampId);
    const migratedCount = timestampIds.length;

    if (migratedCount === 0) {
      return 0;
    }

    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));

      const oldToNewMap = {};
      const existingIds = [];

      Object.entries(newData.practices).forEach(([id, practice]) => {
        if (isTimestampId(id)) {
          const newId = generateSlug(practice.name, existingIds);
          oldToNewMap[id] = newId;
          existingIds.push(newId);
        } else {
          existingIds.push(id);
        }
      });

      if (Object.keys(oldToNewMap).length === 0) {
        return prev;
      }

      const newPractices = {};
      Object.entries(newData.practices).forEach(([id, practice]) => {
        const newId = oldToNewMap[id] || id;
        newPractices[newId] = practice;
      });
      newData.practices = newPractices;

      if (newData.practiceOrder) {
        newData.practiceOrder = newData.practiceOrder.map(id => oldToNewMap[id] || id);
      }

      Object.values(newData.months).forEach((month) => {
        month.businessUnits.forEach((bu) => {
          bu.squads.forEach((squad) => {
            const newPracticeValues = {};
            Object.entries(squad.practices || {}).forEach(([id, value]) => {
              const newId = oldToNewMap[id] || id;
              newPracticeValues[newId] = value;
            });
            squad.practices = newPracticeValues;
          });
        });
      });

      return newData;
    });

    return migratedCount;
  }, [data.practices]);

  // Load test data (pre-populated with 4 BUs and teams)
  const loadTestData = useCallback(() => {
    setData((prev) => ({
      ...prev,
      currentMonth: TEST_DATA.currentMonth,
      months: TEST_DATA.months,
    }));
    return true;
  }, []);

  // Check if there are any timestamp-based practice IDs that need migration
  const hasTimestampIds = Object.keys(data.practices).some(isTimestampId);

  // Get ordered practices
  const practiceOrder = data.practiceOrder || Object.keys(data.practices);
  const orderedPractices = practiceOrder
    .filter(id => data.practices[id])
    .map(id => ({ id, ...data.practices[id] }));

  // Get thresholds with defaults
  const thresholds = data.thresholds || DEFAULT_THRESHOLDS;

  // Get status rules with defaults (merge to ensure all rules exist)
  const statusRules = {
    ...DEFAULT_STATUS_RULES,
    ...data.statusRules,
    thresholds: {
      ...DEFAULT_STATUS_RULES.thresholds,
      ...(data.statusRules?.thresholds || {}),
    },
  };

  return {
    data,
    currentMonth: data.currentMonth,
    currentMonthData,
    practices: data.practices,
    practiceOrder,
    orderedPractices,
    maturityScale: data.maturityScale || DEFAULT_MATURITY_SCALE,
    ragColors: data.ragColors || DEFAULT_RAG_COLORS,
    teamTypes: data.teamTypes || DEFAULT_TEAM_TYPES,
    thresholds,
    statusRules,
    darkMode: data.darkMode !== false,
    colorTheme: data.colorTheme || 'default',
    colorThemes: COLOR_THEMES,
    months: Object.keys(data.months).sort().reverse(),
    setCurrentMonth,
    createNewMonth,
    deleteMonth,
    updateSquad,
    updateBusinessUnit,
    addBusinessUnit,
    addSquad,
    deleteSquad,
    deleteBusinessUnit,
    exportCurrentMonth,
    importCurrentMonth,
    exportAllArchive,
    importAllArchive,
    exportSettings,
    importSettings,
    exportData,
    importData,
    resetData,
    resetToLastPeriod,
    updatePractice,
    addPractice,
    deletePractice,
    updateMaturityScale,
    updateTeamType,
    updateThreshold,
    toggleStatusRule,
    updateStatusRuleConfig,
    setDarkMode,
    setColorPreset,
    updateRagColor,
    updateRagLabel,
    reorderPractice,
    migratePracticeIds,
    hasTimestampIds,
    loadTestData,
  };
}

export default useStore;
