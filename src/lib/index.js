/**
 * CyberDash - Security Practices Dashboard Library
 *
 * A tiny library for providing quick monthly security updates
 * with modern visualizations.
 *
 * @example
 * import { Dashboard, useDashboardData } from 'cyberdash';
 * import organizationData from './data/organization.json';
 * import practiceDefinitions from './data/practices.json';
 *
 * function App() {
 *   return (
 *     <Dashboard
 *       organizationData={organizationData}
 *       practiceDefinitions={practiceDefinitions}
 *     />
 *   );
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
