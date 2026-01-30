import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import clsx from 'clsx';

import { Header } from './Header';
import { MetricCard } from './MetricCard';
import { BusinessUnitCard } from './BusinessUnitCard';
import { SquadCard } from './SquadCard';
import { StatusDistributionChart, CategoryRadarChart } from './OverviewChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { generateCategoryChartData } from '../utils/calculations';

/**
 * Main CyberDash Dashboard Component
 */
export function Dashboard({ organizationData, practiceDefinitions }) {
  const {
    enrichedData,
    currentBusinessUnit,
    organizationStats,
    selectedBusinessUnit,
    selectedSquad,
    selectBusinessUnit,
    selectSquad,
    goBack,
    goHome,
    practiceDefinitions: practices,
  } = useDashboardData(organizationData, practiceDefinitions);

  if (!enrichedData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const getTitle = () => {
    if (currentBusinessUnit) return currentBusinessUnit.name;
    return 'Security Practices Overview';
  };

  const getSubtitle = () => {
    if (currentBusinessUnit) {
      return `${currentBusinessUnit.squads.length} squads`;
    }
    return `${organizationStats?.totalBusinessUnits || 0} business units`;
  };

  // Calculate category data for radar chart when viewing a squad
  const categoryData = selectedSquad && currentBusinessUnit
    ? generateCategoryChartData(
        currentBusinessUnit.squads.find(s => s.id === selectedSquad)?.practices || {},
        practices
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <Header
        title={getTitle()}
        subtitle={getSubtitle()}
        period={enrichedData.reportingPeriod}
        showBack={!!selectedBusinessUnit}
        onBack={goBack}
        onHome={goHome}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!selectedBusinessUnit ? (
            // Organization Overview
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Stats Row */}
              {organizationStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <MetricCard
                    label="Total Squads"
                    value={organizationStats.totalSquads}
                    icon={Users}
                    delay={0}
                  />
                  <MetricCard
                    label="Avg. Score"
                    value={`${organizationStats.averageScore}%`}
                    icon={Shield}
                    delay={0.1}
                  />
                  <MetricCard
                    label="Improving"
                    value={organizationStats.trendCounts.improving}
                    icon={TrendingUp}
                    delay={0.2}
                  />
                  <MetricCard
                    label="Need Attention"
                    value={organizationStats.statusCounts.red}
                    icon={AlertTriangle}
                    delay={0.3}
                  />
                </div>
              )}

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  className="bg-slate-900/50 backdrop-blur-lg rounded-xl border border-slate-800/50 p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Squad Status Distribution
                  </h3>
                  <StatusDistributionChart data={organizationStats?.statusCounts || {}} />
                </motion.div>

                <motion.div
                  className="bg-slate-900/50 backdrop-blur-lg rounded-xl border border-slate-800/50 p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">Quick Actions</h3>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400 font-medium">
                        {organizationStats?.statusCounts.red || 0} squads need immediate attention
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Review squads with declining trends
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-sm text-emerald-400 font-medium">
                        {organizationStats?.trendCounts.improving || 0} squads showing improvement
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Celebrate and share best practices
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Business Units Grid */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Business Units</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Click a business unit to view squad details and monthly updates
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {enrichedData.businessUnits.map((bu, index) => (
                  <BusinessUnitCard
                    key={bu.id}
                    businessUnit={bu}
                    onClick={() => selectBusinessUnit(bu.id)}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            // Business Unit Detail View
            <motion.div
              key={`bu-${selectedBusinessUnit}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* BU Stats */}
              {currentBusinessUnit && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <MetricCard
                    label="Squads"
                    value={currentBusinessUnit.stats.squadCount}
                    icon={Users}
                    delay={0}
                  />
                  <MetricCard
                    label="Avg. Score"
                    value={`${currentBusinessUnit.stats.averageScore}%`}
                    icon={Shield}
                    delay={0.1}
                  />
                  <MetricCard
                    label="Strong"
                    value={currentBusinessUnit.stats.statusCounts.green}
                    icon={TrendingUp}
                    delay={0.2}
                  />
                  <MetricCard
                    label="Need Support"
                    value={currentBusinessUnit.stats.statusCounts.red}
                    icon={AlertTriangle}
                    delay={0.3}
                  />
                </div>
              )}

              {/* Squads Grid */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">Squads</h2>
                <p className="text-sm text-slate-400">
                  Click a squad to view detailed practice assessment and monthly updates
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentBusinessUnit?.squads.map((squad, index) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    practiceDefinitions={practices}
                    onClick={() => selectSquad(selectedSquad === squad.id ? null : squad.id)}
                    index={index}
                    expanded={selectedSquad === squad.id}
                  />
                ))}
              </div>

              {/* Category Radar (shown when squad selected) */}
              {selectedSquad && categoryData && (
                <motion.div
                  className="mt-8 bg-slate-900/50 backdrop-blur-lg rounded-xl border border-slate-800/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Practice Category Breakdown
                  </h3>
                  <CategoryRadarChart data={categoryData} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>CyberDash - Security Practices Dashboard</span>
            <span>{enrichedData.reportingPeriod}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
