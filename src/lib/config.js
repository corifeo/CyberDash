/**
 * CyberDash Configuration and Theming
 */

// Default RAG status configuration
export const defaultStatusConfig = {
  green: {
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    label: 'Strong',
    threshold: 0.75,
  },
  amber: {
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    label: 'Developing',
    threshold: 0.4,
  },
  red: {
    color: '#EF4444',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    label: 'Early Stage',
    threshold: 0,
  },
};

// Default trend configuration
export const defaultTrendConfig = {
  improving: {
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    label: 'Improving',
  },
  stable: {
    color: '#6B7280',
    bgColor: 'bg-slate-500/20',
    label: 'Stable',
  },
  declining: {
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    label: 'Needs Attention',
  },
};

// Category colors for charts
export const categoryColors = {
  people: '#8B5CF6',
  process: '#0EA5E9',
  tooling: '#10B981',
  other: '#6B7280',
};

// Animation presets
export const animationPresets = {
  fast: {
    duration: 0.2,
    stagger: 0.03,
  },
  normal: {
    duration: 0.4,
    stagger: 0.08,
  },
  slow: {
    duration: 0.6,
    stagger: 0.12,
  },
};

/**
 * Create a custom theme configuration
 * @param {Object} overrides - Theme overrides
 * @returns {Object} Complete theme config
 */
export function createTheme(overrides = {}) {
  return {
    status: {
      ...defaultStatusConfig,
      ...overrides.status,
    },
    trend: {
      ...defaultTrendConfig,
      ...overrides.trend,
    },
    category: {
      ...categoryColors,
      ...overrides.category,
    },
    animation: {
      ...animationPresets.normal,
      ...overrides.animation,
    },
  };
}

export default {
  defaultStatusConfig,
  defaultTrendConfig,
  categoryColors,
  animationPresets,
  createTheme,
};
