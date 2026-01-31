import { useState, useEffect, useCallback } from 'react';

// Default maturity scale (0-4, where 0 = not started)
const DEFAULT_MATURITY_SCALE = [
  { level: 0, label: "None", short: "N" },
  { level: 1, label: "Initial", short: "1" },
  { level: 2, label: "Developing", short: "2" },
  { level: 3, label: "Defined", short: "3" },
  { level: 4, label: "Managed", short: "4" },
];

// Default practice definitions with targets
const DEFAULT_PRACTICES = {
  embeddedSecurityExperts: { name: "Security Experts", type: "boolean", target: true },
  threatModeling: { name: "Threat Modeling", type: "maturity", target: 3 },
  secureCodeReview: { name: "Code Review", type: "boolean", target: true },
  automatedSecurityTesting: { name: "Auto Testing", type: "maturity", target: 3 },
  dependencyScanning: { name: "Dep Scanning", type: "maturity", target: 4 },
  secretsManagement: { name: "Secrets Mgmt", type: "maturity", target: 3 },
  securityRequirements: { name: "Requirements", type: "maturity", target: 3 },
  vulnerabilityManagement: { name: "Vuln Mgmt", type: "maturity", target: 4 },
  incidentResponse: { name: "Incident Resp", type: "boolean", target: true },
  securityTesting: { name: "Testing", type: "maturity", target: 3 },
};

// Default starter data
const DEFAULT_DATA = {
  currentMonth: "2025-01",
  maturityScale: DEFAULT_MATURITY_SCALE,
  practices: DEFAULT_PRACTICES,
  months: {
    "2025-01": {
      reportingPeriod: "January 2025",
      businessUnits: [
        {
          id: "bu-1",
          name: "Business Unit 1",
          squads: [
            {
              id: "squad-1",
              name: "Squad 1",
              status: "amber", // Manual RAG status: green, amber, red
              practices: {
                embeddedSecurityExperts: false,
                threatModeling: 1,
                secureCodeReview: false,
                automatedSecurityTesting: 1,
                dependencyScanning: 1,
                secretsManagement: 1,
                securityRequirements: 1,
                vulnerabilityManagement: 1,
                incidentResponse: false,
                securityTesting: 1,
              },
              monthlyUpdate: {
                summary: "Click to edit this month's update",
                nextPeriod: "Click to edit next period plans",
                trend: "stable",
                keyMetric: { label: "Metric", value: "0%", target: "100%" },
              },
            },
          ],
        },
      ],
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
          keyMetric: { label: "Metric", value: "", target: "" },
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

  // Export all data as JSON
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberdash-export-${data.currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // Import data from JSON
  const importData = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      setData(imported);
      return true;
    } catch (e) {
      console.error("Failed to import:", e);
      return false;
    }
  }, []);

  // Reset to defaults
  const resetData = useCallback(() => {
    setData(DEFAULT_DATA);
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

  // Add a new practice
  const addPractice = useCallback((name, type = 'maturity') => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const id = `practice-${Date.now()}`;
      const defaultTarget = type === 'boolean' ? true : 3;

      // Add to practice definitions
      newData.practices[id] = { name, type, target: defaultTarget };

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

  return {
    data,
    currentMonth: data.currentMonth,
    currentMonthData,
    practices: data.practices,
    maturityScale: data.maturityScale || DEFAULT_MATURITY_SCALE,
    months: Object.keys(data.months).sort().reverse(),
    setCurrentMonth,
    createNewMonth,
    updateSquad,
    updateBusinessUnit,
    addBusinessUnit,
    addSquad,
    deleteSquad,
    deleteBusinessUnit,
    exportData,
    importData,
    resetData,
    updatePractice,
    addPractice,
    deletePractice,
    updateMaturityScale,
  };
}

export default useStore;
