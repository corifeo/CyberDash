import { useState, useEffect, useCallback } from 'react';

// Default maturity scale (-1 = N/A, 0-4 for levels)
const DEFAULT_MATURITY_SCALE = [
  { level: -1, label: "N/A", short: "—", description: "Not applicable - this practice is not relevant for this squad" },
  { level: 0, label: "None", short: "0", description: "Not started - no formal process or capability exists" },
  { level: 1, label: "Initial", short: "1", description: "Ad-hoc - basic awareness, inconsistent implementation" },
  { level: 2, label: "Developing", short: "2", description: "Repeatable - documented process, partial adoption across team" },
  { level: 3, label: "Defined", short: "3", description: "Established - consistent process, measured and improving" },
  { level: 4, label: "Managed", short: "4", description: "Optimized - automated, continuously improved, industry-leading" },
];

// Default RAG color schemes with hex values
const DEFAULT_RAG_COLORS = {
  green: { hex: '#059669', label: 'Strong' },
  amber: { hex: '#d97706', label: 'Developing' },
  red: { hex: '#dc2626', label: 'Early Stage' },
  none: { hex: '#64748b', label: 'Not Tracked' },
};

// Available color presets with hex values
const COLOR_PRESETS = {
  default: {
    green: { hex: '#059669' },
    amber: { hex: '#d97706' },
    red: { hex: '#dc2626' },
    none: { hex: '#64748b' },
  },
  muted: {
    green: { hex: '#0f766e' },
    amber: { hex: '#a16207' },
    red: { hex: '#be123c' },
    none: { hex: '#475569' },
  },
  vibrant: {
    green: { hex: '#22c55e' },
    amber: { hex: '#f97316' },
    red: { hex: '#ef4444' },
    none: { hex: '#94a3b8' },
  },
  corporate: {
    green: { hex: '#0891b2' },
    amber: { hex: '#64748b' },
    red: { hex: '#4f46e5' },
    none: { hex: '#334155' },
  },
};

// Default practice definitions with targets and descriptions
const DEFAULT_PRACTICES = {
  embeddedSecurityExperts: {
    name: "Security Champions",
    type: "boolean",
    target: true,
    color: "#06b6d4",
    description: "Dedicated security champions or experts embedded within the team who advocate for security best practices, participate in code reviews, and serve as the first point of contact for security questions. They bridge the gap between development and security teams."
  },
  threatModeling: {
    name: "Threat Modeling",
    type: "maturity",
    target: 2,
    color: "#8b5cf6",
    description: "A systematic approach to identifying potential security threats and vulnerabilities in system architecture and design. Includes creating data flow diagrams, identifying trust boundaries, and documenting potential attack vectors using frameworks like STRIDE or PASTA."
  },
  secureCodeReview: {
    name: "Secure Code Review",
    type: "boolean",
    target: true,
    color: "#10b981",
    description: "Security-focused code reviews performed on all changes before merging to production. Reviews should check for common vulnerabilities (injection, XSS, authentication flaws), proper input validation, secure error handling, and adherence to secure coding standards."
  },
  automatedSecurityTesting: {
    name: "Automated Security Testing",
    type: "maturity",
    target: 2,
    color: "#f59e0b",
    description: "Integration of automated security scanning tools (SAST, DAST, IAST) into CI/CD pipelines to detect vulnerabilities early in the development cycle. Includes static analysis of source code, dynamic testing of running applications, and automated security regression testing."
  },
  dependencyScanning: {
    name: "Dependency Scanning",
    type: "maturity",
    target: 2,
    color: "#ef4444",
    description: "Automated scanning of third-party libraries and dependencies for known vulnerabilities (CVEs) and license compliance issues. Uses tools like Dependabot, Snyk, or OWASP Dependency-Check to identify and track vulnerable components with defined remediation timelines."
  },
  secretsManagement: {
    name: "Secrets Management",
    type: "maturity",
    target: 2,
    color: "#ec4899",
    description: "Secure storage, distribution, and rotation of sensitive credentials including API keys, database passwords, certificates, and encryption keys. Uses dedicated secrets management solutions (HashiCorp Vault, AWS Secrets Manager) with proper access controls and audit logging."
  },
  securityRequirements: {
    name: "Security Requirements",
    type: "maturity",
    target: 2,
    color: "#3b82f6",
    description: "Security requirements are defined, documented, and tracked alongside functional requirements from project inception. Includes compliance requirements, data protection needs, authentication/authorization specifications, and security acceptance criteria for user stories."
  },
  vulnerabilityManagement: {
    name: "Vulnerability Management",
    type: "maturity",
    target: 2,
    color: "#14b8a6",
    description: "A structured process for tracking, prioritizing, and remediating discovered vulnerabilities within defined SLAs based on severity. Includes vulnerability intake from multiple sources, risk-based prioritization, remediation tracking, and metrics reporting on mean time to remediate."
  },
  incidentResponse: {
    name: "Incident Response",
    type: "boolean",
    target: true,
    color: "#f97316",
    description: "A documented and tested incident response plan with clearly defined roles, responsibilities, communication channels, and escalation paths. Includes playbooks for common incident types, regular tabletop exercises, post-incident reviews, and integration with monitoring and alerting systems."
  },
  securityTesting: {
    name: "Penetration Testing",
    type: "maturity",
    target: 2,
    color: "#6366f1",
    description: "Regular penetration testing and security assessments performed by qualified internal teams or external specialists. Covers network, application, and infrastructure testing with documented scope, methodology, findings prioritization, and remediation verification."
  },
};

// Default practice order
const DEFAULT_PRACTICE_ORDER = Object.keys(DEFAULT_PRACTICES);

// Default starter data
const DEFAULT_DATA = {
  currentMonth: "2025-01",
  maturityScale: DEFAULT_MATURITY_SCALE,
  practices: DEFAULT_PRACTICES,
  practiceOrder: DEFAULT_PRACTICE_ORDER,
  ragColors: DEFAULT_RAG_COLORS,
  darkMode: true, // Default to dark mode
  colorPreset: 'default',
  months: {
    "2025-01": {
      reportingPeriod: "January 2025",
      businessUnits: [],
    },
  },
};

const STORAGE_KEY = "cyberdash-data";

// Load from localStorage or use defaults
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
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
      // Deep copy - keep all practice data, just clear monthly update summaries
      const newMonthData = JSON.parse(JSON.stringify(currentData));
      newMonthData.reportingPeriod = label;
      newMonthData.businessUnits.forEach((bu) => {
        bu.squads.forEach((squad) => {
          // Keep practices, trend, and metric structure - just clear text summaries
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

      // Navigate to nested path and set value
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

  // Add a new squad to a business unit
  const addSquad = useCallback((buId) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const bu = newData.months[newData.currentMonth].businessUnits.find(
        (b) => b.id === buId
      );
      if (!bu) return prev;

      const id = `squad-${Date.now()}`;
      bu.squads.push({
        id,
        name: "New Squad",
        status: "red", // Default to red for new squads
        tracked: false, // New squads are untracked by default
        weight: 1, // Default weight
        practices: Object.fromEntries(
          Object.entries(prev.practices).map(([key, p]) => [
            key,
            p.type === "boolean" ? false : 1,
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

  // Import current month data (replaces current month)
  const importCurrentMonth = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.type === 'month' && imported.data) {
        setData((prev) => {
          const newData = JSON.parse(JSON.stringify(prev));
          // Import to current month or to the month specified in the file
          const targetMonth = imported.monthKey || prev.currentMonth;
          newData.months[targetMonth] = imported.data;
          if (!newData.months[newData.currentMonth]) {
            newData.currentMonth = targetMonth;
          }
          return newData;
        });
        return true;
      }
      // Legacy full import support
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

  // Export all archive (all months)
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

  // Import all archive (all months)
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
      // Legacy full import support
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

  // Export settings (practices, scale, colors)
  const exportSettings = useCallback(() => {
    const exportObj = {
      type: 'settings',
      maturityScale: data.maturityScale,
      practices: data.practices,
      practiceOrder: data.practiceOrder,
      ragColors: data.ragColors,
      colorPreset: data.colorPreset,
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
          colorPreset: imported.colorPreset || prev.colorPreset,
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import settings:", e);
      return false;
    }
  }, []);

  // Legacy export all data as JSON (for backwards compatibility)
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

  // Legacy import data from JSON (for backwards compatibility)
  const importData = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      // Try to detect type and handle appropriately
      if (imported.type === 'month') {
        return importCurrentMonth(jsonString);
      }
      if (imported.type === 'archive') {
        return importAllArchive(jsonString);
      }
      if (imported.type === 'settings') {
        return importSettings(jsonString);
      }
      // Legacy full import
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

  // Reset current month to previous period's data (or blank if no previous)
  const resetToLastPeriod = useCallback(() => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const sortedMonths = Object.keys(newData.months).sort().reverse();
      const currentIndex = sortedMonths.indexOf(newData.currentMonth);

      let resetBusinessUnits;

      // If no previous month exists, reset to blank state
      if (currentIndex < 0 || currentIndex >= sortedMonths.length - 1) {
        resetBusinessUnits = [];
      } else {
        const previousMonth = sortedMonths[currentIndex + 1];
        const previousData = newData.months[previousMonth];
        // Deep clone the previous month's business units
        resetBusinessUnits = JSON.parse(JSON.stringify(previousData.businessUnits));
      }

      // Apply to current month, keeping the current reporting period label
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
      const id = `practice-${Date.now()}`;
      const defaultTarget = type === 'boolean' ? true : 3;
      const practiceColor = color || generateRandomColor();

      // Add to practice definitions
      newData.practices[id] = { name, type, target: defaultTarget, color: practiceColor };

      // Add to practice order
      if (!newData.practiceOrder) {
        newData.practiceOrder = Object.keys(newData.practices);
      }
      newData.practiceOrder.push(id);

      // Add default value to all squads in all months
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

      // Remove from practice definitions
      delete newData.practices[practiceId];

      // Remove from practice order
      if (newData.practiceOrder) {
        newData.practiceOrder = newData.practiceOrder.filter(id => id !== practiceId);
      }

      // Remove from all squads in all months
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
      // Don't delete if it's the only month or current month
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

  // Set color preset
  const setColorPreset = useCallback((presetName) => {
    setData((prev) => {
      const preset = COLOR_PRESETS[presetName];
      if (!preset) return prev;
      return {
        ...prev,
        colorPreset: presetName,
        ragColors: {
          green: { hex: preset.green.hex, label: prev.ragColors?.green?.label || 'Strong' },
          amber: { hex: preset.amber.hex, label: prev.ragColors?.amber?.label || 'Developing' },
          red: { hex: preset.red.hex, label: prev.ragColors?.red?.label || 'Early Stage' },
          none: { hex: preset.none.hex, label: prev.ragColors?.none?.label || 'Not Tracked' },
        },
      };
    });
  }, []);

  // Update RAG color (hex or label)
  const updateRagColor = useCallback((status, field, value) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (!newData.ragColors) newData.ragColors = DEFAULT_RAG_COLORS;
      if (!newData.ragColors[status]) {
        newData.ragColors[status] = { hex: '#888888', label: status };
      }
      newData.ragColors[status][field] = value;
      newData.colorPreset = 'custom'; // Mark as custom when user changes colors
      return newData;
    });
  }, []);

  // Update RAG label (convenience function)
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

  // Get ordered practices
  const practiceOrder = data.practiceOrder || Object.keys(data.practices);
  const orderedPractices = practiceOrder
    .filter(id => data.practices[id])
    .map(id => ({ id, ...data.practices[id] }));

  return {
    data,
    currentMonth: data.currentMonth,
    currentMonthData,
    practices: data.practices,
    practiceOrder,
    orderedPractices,
    maturityScale: data.maturityScale || DEFAULT_MATURITY_SCALE,
    ragColors: data.ragColors || DEFAULT_RAG_COLORS,
    darkMode: data.darkMode !== false, // Default to true
    colorPreset: data.colorPreset || 'default',
    colorPresets: COLOR_PRESETS,
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
    // Export/Import functions
    exportCurrentMonth,
    importCurrentMonth,
    exportAllArchive,
    importAllArchive,
    exportSettings,
    importSettings,
    exportData, // Legacy
    importData, // Legacy
    resetData,
    resetToLastPeriod,
    updatePractice,
    addPractice,
    deletePractice,
    updateMaturityScale,
    setDarkMode,
    setColorPreset,
    updateRagColor,
    updateRagLabel,
    reorderPractice,
  };
}

export default useStore;
