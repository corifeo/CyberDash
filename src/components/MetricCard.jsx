import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Modern metric display card with glassmorphism
 */
export function MetricCard({
  label,
  value,
  target,
  icon: Icon,
  trend,
  className,
  delay = 0,
}) {
  const isOnTarget = target && value === target;
  const valueColor = isOnTarget ? 'text-emerald-400' : 'text-white';

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-slate-800/80 to-slate-900/80',
        'border border-slate-700/50 backdrop-blur-sm',
        'p-4',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        </div>

        <div className="flex items-baseline gap-2">
          <motion.span
            className={clsx('text-2xl font-bold', valueColor)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {value}
          </motion.span>
          {target && (
            <span className="text-sm text-slate-500">
              / {target}
            </span>
          )}
        </div>

        {trend && (
          <div className="mt-2 text-xs text-slate-400">
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MetricCard;
