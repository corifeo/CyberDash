/**
 * CyberDash - Security Practices Dashboard Library
 *
 * A browser-based dashboard for tracking security practices
 * across business units and squads. Data is stored in localStorage.
 *
 * @example
 * import { useStore } from './store/useStore';
 *
 * function App() {
 *   const store = useStore();
 *   // All data is managed via the store
 *   return <Dashboard store={store} />;
 * }
 */

// Main Dashboard Component
export { Dashboard } from '../components/Dashboard';

// Individual Components
export {
  RadialProgress,
  TrendIndicator,
  StatusBadge,
  MetricCard,
  PracticeGrid,
  BusinessUnitCard,
  SquadCard,
  StatusDistributionChart,
  CategoryRadarChart,
} from '../components';

export { Header } from '../components/Header';

// Hooks
export { useDashboardData } from '../hooks/useDashboardData';

// Utilities
export {
  calculateRAGStatus,
  calculatePracticeAdoption,
  calculateOverallScore,
  getDominantTrend,
  getDominantStatus,
  aggregateBusinessUnitStats,
  generateCategoryChartData,
} from '../utils/calculations';
