import { motion } from 'framer-motion';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * Visual grid showing practice adoption status
 */
export function PracticeGrid({ practices, definitions, compact = false, className }) {
  const practiceEntries = Object.entries(practices).map(([key, value]) => ({
    key,
    value,
    definition: definitions[key],
  })).filter(p => p.definition);

  const renderValue = (practice) => {
    const { definition, value } = practice;

    if (definition.type === 'boolean') {
      return value ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      );
    }

    // Maturity level (1-4)
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((level) => (
          <Circle
            key={level}
            className={clsx(
              'w-3 h-3 transition-colors',
              level <= value
                ? 'fill-cyber-400 text-cyber-400'
                : 'text-slate-600'
            )}
          />
        ))}
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  if (compact) {
    return (
      <motion.div
        className={clsx('flex flex-wrap gap-1', className)}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {practiceEntries.map((practice) => (
          <motion.div
            key={practice.key}
            variants={itemVariants}
            className={clsx(
              'w-6 h-6 rounded flex items-center justify-center',
              practice.definition.type === 'boolean'
                ? practice.value
                  ? 'bg-emerald-500/20'
                  : 'bg-red-500/20'
                : practice.value >= 3
                  ? 'bg-cyber-500/20'
                  : practice.value >= 2
                    ? 'bg-amber-500/20'
                    : 'bg-red-500/20'
            )}
            title={`${practice.definition.name}: ${practice.value}`}
          >
            <span className="text-xs font-mono">
              {practice.definition.type === 'boolean'
                ? practice.value ? '✓' : '✗'
                : practice.value}
            </span>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={clsx('grid gap-2', className)}
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {practiceEntries.map((practice) => (
        <motion.div
          key={practice.key}
          variants={itemVariants}
          className={clsx(
            'flex items-center justify-between gap-3 p-3 rounded-lg',
            'bg-slate-800/50 border border-slate-700/50',
            'hover:bg-slate-800/80 transition-colors'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {practice.definition.shortName || practice.definition.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {practice.definition.category}
            </p>
          </div>
          {renderValue(practice)}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default PracticeGrid;
