import { motion } from 'framer-motion';
import { Users, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { RadialProgress } from './RadialProgress';
import { TrendIndicator } from './TrendIndicator';
import { StatusBadge } from './StatusBadge';

const statusGradients = {
  green: 'from-emerald-600/20 via-emerald-500/10 to-transparent',
  amber: 'from-amber-600/20 via-amber-500/10 to-transparent',
  red: 'from-red-600/20 via-red-500/10 to-transparent',
};

const statusBorders = {
  green: 'border-emerald-500/30 hover:border-emerald-500/50',
  amber: 'border-amber-500/30 hover:border-amber-500/50',
  red: 'border-red-500/30 hover:border-red-500/50',
};

/**
 * Modern business unit card with glassmorphism and gradients
 */
export function BusinessUnitCard({
  businessUnit,
  onClick,
  index = 0,
  className,
}) {
  const { name, stats } = businessUnit;
  const { dominantStatus, dominantTrend, averageScore, squadCount, statusCounts } = stats;

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-2xl cursor-pointer group',
        'bg-slate-900/80 backdrop-blur-xl',
        'border transition-all duration-300',
        statusBorders[dominantStatus],
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient */}
      <div
        className={clsx(
          'absolute inset-0 bg-gradient-to-br pointer-events-none opacity-60',
          statusGradients[dominantStatus]
        )}
      />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-semibold text-white truncate mb-2">
              {name}
            </h3>
            <div className="flex items-center gap-3">
              <StatusBadge status={dominantStatus} size="sm" />
              <TrendIndicator trend={dominantTrend} size="sm" showBackground />
            </div>
          </div>
          <RadialProgress
            value={averageScore}
            size={72}
            strokeWidth={6}
            labelSize="md"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{squadCount} squads</span>
            </div>

            {/* Status distribution dots */}
            <div className="flex items-center gap-1.5">
              {statusCounts.green > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400">{statusCounts.green}</span>
                </div>
              )}
              {statusCounts.amber > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-400">{statusCounts.amber}</span>
                </div>
              )}
              {statusCounts.red > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-slate-400">{statusCounts.red}</span>
                </div>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}

export default BusinessUnitCard;
