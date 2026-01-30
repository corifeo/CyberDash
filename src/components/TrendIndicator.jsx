import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const trendConfig = {
  improving: {
    icon: TrendingUp,
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    label: 'Improving',
  },
  stable: {
    icon: Minus,
    color: '#6B7280',
    bgColor: 'bg-slate-500/20',
    label: 'Stable',
  },
  declining: {
    icon: TrendingDown,
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    label: 'Needs Attention',
  },
};

/**
 * Animated trend indicator with icon and optional label
 */
export function TrendIndicator({
  trend = 'stable',
  size = 'md',
  showLabel = false,
  showBackground = true,
  className,
}) {
  const config = trendConfig[trend] || trendConfig.stable;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const paddingClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <motion.div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full',
        showBackground && config.bgColor,
        showBackground && paddingClasses[size],
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Icon className={sizeClasses[size]} style={{ color: config.color }} />
      {showLabel && (
        <span className="text-xs font-medium pr-1" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </motion.div>
  );
}

export default TrendIndicator;
