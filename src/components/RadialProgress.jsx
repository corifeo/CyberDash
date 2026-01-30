import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Modern radial progress indicator with animation
 */
export function RadialProgress({
  value = 0,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  labelSize = 'lg',
  color = 'auto',
  animated = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (color !== 'auto') return color;
    if (value >= 75) return '#10B981';
    if (value >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const strokeColor = getColor();

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700/50"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColor}40)`,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={clsx(
              'font-bold',
              labelSize === 'sm' && 'text-lg',
              labelSize === 'md' && 'text-xl',
              labelSize === 'lg' && 'text-2xl',
              labelSize === 'xl' && 'text-3xl'
            )}
            style={{ color: strokeColor }}
            initial={animated ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}%
          </motion.span>
        </div>
      )}
    </div>
  );
}

export default RadialProgress;
