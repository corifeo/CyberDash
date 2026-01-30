import { useState, useMemo, useCallback } from 'react';
import {
  calculateRAGStatus,
  calculatePracticeAdoption,
  calculateOverallScore,
  aggregateBusinessUnitStats,
} from '../utils/calculations';

/**
 * Custom hook for managing dashboard data and state
 * @param {Object} organizationData - Organization data from JSON
 * @param {Object} practiceDefinitions - Practice definitions from JSON
 */
export function useDashboardData(organizationData, practiceDefinitions) {
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);

  // Enrich business units with calculated stats
  const enrichedData = useMemo(() => {
    if (!organizationData?.businessUnits) return null;

    return {
      ...organizationData,
      businessUnits: organizationData.businessUnits.map((bu) => ({
        ...bu,
        stats: aggregateBusinessUnitStats(bu, practiceDefinitions),
        squads: bu.squads.map((squad) => ({
          ...squad,
          status: calculateRAGStatus(squad.practices, practiceDefinitions),
          adoption: calculatePracticeAdoption(squad.practices, practiceDefinitions),
          overallScore: calculateOverallScore(squad.practices, practiceDefinitions),
        })),
      })),
    };
  }, [organizationData, practiceDefinitions]);

  // Get current business unit data
  const currentBusinessUnit = useMemo(() => {
    if (!selectedBusinessUnit || !enrichedData) return null;
    return enrichedData.businessUnits.find((bu) => bu.id === selectedBusinessUnit);
  }, [selectedBusinessUnit, enrichedData]);

  // Get current squad data
  const currentSquad = useMemo(() => {
    if (!selectedSquad || !currentBusinessUnit) return null;
    return currentBusinessUnit.squads.find((s) => s.id === selectedSquad);
  }, [selectedSquad, currentBusinessUnit]);

  // Navigation helpers
  const selectBusinessUnit = useCallback((id) => {
    setSelectedBusinessUnit(id);
    setSelectedSquad(null);
  }, []);

  const selectSquad = useCallback((id) => {
    setSelectedSquad(id);
  }, []);

  const goBack = useCallback(() => {
    if (selectedSquad) {
      setSelectedSquad(null);
    } else {
      setSelectedBusinessUnit(null);
    }
  }, [selectedSquad]);

  const goHome = useCallback(() => {
    setSelectedBusinessUnit(null);
    setSelectedSquad(null);
  }, []);

  // Aggregate organization stats
  const organizationStats = useMemo(() => {
    if (!enrichedData) return null;

    const allSquads = enrichedData.businessUnits.flatMap((bu) => bu.squads);
    const statusCounts = { green: 0, amber: 0, red: 0 };
    const trendCounts = { improving: 0, stable: 0, declining: 0 };
    let totalScore = 0;

    allSquads.forEach((squad) => {
      statusCounts[squad.status]++;
      trendCounts[squad.monthlyUpdate?.trend || 'stable']++;
      totalScore += squad.overallScore;
    });

    return {
      totalSquads: allSquads.length,
      totalBusinessUnits: enrichedData.businessUnits.length,
      statusCounts,
      trendCounts,
      averageScore: allSquads.length > 0 ? Math.round(totalScore / allSquads.length) : 0,
    };
  }, [enrichedData]);

  return {
    enrichedData,
    currentBusinessUnit,
    currentSquad,
    organizationStats,
    selectedBusinessUnit,
    selectedSquad,
    selectBusinessUnit,
    selectSquad,
    goBack,
    goHome,
    practiceDefinitions,
  };
}

export default useDashboardData;
