import { useState, useEffect, useCallback } from 'react';

// Default practice definitions
const DEFAULT_PRACTICES = {
  embeddedSecurityExperts: { name: "Security Experts", type: "boolean" },
  threatModeling: { name: "Threat Modeling", type: "maturity" },
  secureCodeReview: { name: "Code Review", type: "boolean" },
  automatedSecurityTesting: { name: "Auto Testing", type: "maturity" },
  dependencyScanning: { name: "Dep Scanning", type: "maturity" },
  secretsManagement: { name: "Secrets Mgmt", type: "maturity" },
  securityRequirements: { name: "Requirements", type: "maturity" },
  vulnerabilityManagement: { name: "Vuln Mgmt", type: "maturity" },
  incidentResponse: { name: "Incident Resp", type: "boolean" },
  securityTesting: { name: "Testing", type: "maturity" },
};

// Default starter data
const DEFAULT_DATA = {
  currentMonth: "2025-01",
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

  // Create a new month (copies structure from current month)
  const createNewMonth = useCallback((monthKey, label) => {
    setData((prev) => {
      const currentData = prev.months[prev.currentMonth];
      // Deep copy and clear monthly updates
      const newMonthData = JSON.parse(JSON.stringify(currentData));
      newMonthData.reportingPeriod = label;
      newMonthData.businessUnits.forEach((bu) => {
        bu.squads.forEach((squad) => {
          squad.monthlyUpdate = {
            summary: "",
            nextPeriod: "",
            trend: "stable",
            keyMetric: { ...squad.monthlyUpdate.keyMetric, value: "" },
          };
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

  return {
    data,
    currentMonth: data.currentMonth,
    currentMonthData,
    practices: data.practices,
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
  };
}

export default useStore;
