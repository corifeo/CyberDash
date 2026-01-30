import { motion } from 'framer-motion';
import clsx from 'clsx';

const statusConfig = {
  green: {
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    label: 'Strong',
  },
  amber: {
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    label: 'Developing',
  },
  red: {
    color: '#EF4444',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    label: 'Early Stage',
  },
};

/**
 * Status badge with RAG coloring
 */
export function StatusBadge({ status = 'amber', size = 'md', showLabel = true, className }) {
  const config = statusConfig[status] || statusConfig.amber;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <motion.span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{ color: config.color }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}60` }}
      />
      {showLabel && config.label}
    </motion.span>
  );
}

export default StatusBadge;
