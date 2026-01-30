import { motion } from 'framer-motion';
import { Target, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { RadialProgress } from './RadialProgress';
import { TrendIndicator } from './TrendIndicator';
import { StatusBadge } from './StatusBadge';
import { PracticeGrid } from './PracticeGrid';

const statusGradients = {
  green: 'from-emerald-600/10 to-transparent',
  amber: 'from-amber-600/10 to-transparent',
  red: 'from-red-600/10 to-transparent',
};

const statusBorders = {
  green: 'border-emerald-500/20 hover:border-emerald-500/40',
  amber: 'border-amber-500/20 hover:border-amber-500/40',
  red: 'border-red-500/20 hover:border-red-500/40',
};

/**
 * Squad card with detailed practice information
 */
export function SquadCard({
  squad,
  practiceDefinitions,
  onClick,
  index = 0,
  expanded = false,
  className,
}) {
  const { name, status, adoption, overallScore, monthlyUpdate, practices } = squad;

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-xl cursor-pointer group',
        'bg-slate-900/60 backdrop-blur-lg',
        'border transition-all duration-300',
        statusBorders[status],
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={expanded ? {} : { scale: 1.01 }}
      layout
    >
      {/* Background */}
      <div
        className={clsx(
          'absolute inset-0 bg-gradient-to-br pointer-events-none',
          statusGradients[status]
        )}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-white truncate mb-2">
              {name}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={status} size="sm" />
              <TrendIndicator
                trend={monthlyUpdate?.trend}
                size="sm"
                showLabel
                showBackground
              />
            </div>
          </div>
          <RadialProgress
            value={overallScore}
            size={60}
            strokeWidth={5}
            labelSize="sm"
          />
        </div>

        {/* Adoption stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="w-4 h-4" />
            <span>
              <span className="text-white font-medium">{adoption.adopted}</span>
              /{adoption.total} practices
            </span>
          </div>
        </div>

        {/* Compact practice indicators */}
        {!expanded && (
          <PracticeGrid
            practices={practices}
            definitions={practiceDefinitions}
            compact
            className="mb-4"
          />
        )}

        {/* Monthly update preview */}
        {monthlyUpdate && (
          <div className="pt-3 border-t border-slate-700/50">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-400 line-clamp-2">
                {monthlyUpdate.summary}
              </p>
            </div>
            {monthlyUpdate.keyMetric && (
              <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded text-xs">
                <span className="text-slate-400">{monthlyUpdate.keyMetric.label}:</span>
                <span className="text-cyber-400 font-medium">{monthlyUpdate.keyMetric.value}</span>
                {monthlyUpdate.keyMetric.target && (
                  <span className="text-slate-500">/ {monthlyUpdate.keyMetric.target}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expanded view - full practice grid */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <h5 className="text-sm font-medium text-slate-300 mb-3">Security Practices</h5>
            <PracticeGrid
              practices={practices}
              definitions={practiceDefinitions}
            />

            {monthlyUpdate && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <h6 className="text-xs font-medium text-slate-400 uppercase mb-1">Current Period</h6>
                  <p className="text-sm text-white">{monthlyUpdate.summary}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <h6 className="text-xs font-medium text-slate-400 uppercase mb-1">Next Period</h6>
                  <p className="text-sm text-white">{monthlyUpdate.nextPeriod}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default SquadCard;
