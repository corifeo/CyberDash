import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

// Trend configuration
export const trendConfig = {
  improving: { Icon: TrendingUp, label: 'Improving', color: 'text-green-400' },
  stable: { Icon: Minus, label: 'Stable', color: 'text-slate-400' },
  declining: { Icon: TrendingDown, label: 'Needs Attention', color: 'text-red-400' },
  'needs-attention': { Icon: AlertTriangle, label: 'Needs Attention', color: 'text-amber-400' },
};

// Get status info from RAG colors
export function getStatusInfo(ragColors, status) {
  const defaults = {
    green: { hex: '#059669', label: 'Strong' },
    amber: { hex: '#d97706', label: 'Developing' },
    red: { hex: '#dc2626', label: 'Early Stage' },
    none: { hex: '#64748b', label: 'Not Tracked' },
  };
  const colors = ragColors || defaults;
  return {
    hex: colors[status]?.hex || defaults[status]?.hex || '#64748b',
    label: colors[status]?.label || defaults[status]?.label || status,
  };
}

// Calculate weighted BU status from squads
export function getWeightedBuStatus(squads, thresholds = { green: 2.5, amber: 1.5 }) {
  const trackedSquads = squads.filter(s => s.tracked !== false);
  if (trackedSquads.length === 0) return 'none';

  const statusValues = { green: 3, amber: 2, red: 1, none: 0 };
  let weightedSum = 0;
  let totalWeight = 0;

  trackedSquads.forEach(s => {
    const weight = s.weight || 1;
    const value = statusValues[s.status] || 1;
    weightedSum += value * weight;
    totalWeight += weight;
  });

  const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  if (avg >= thresholds.green) return 'green';
  if (avg >= thresholds.amber) return 'amber';
  return 'red';
}

// Count adopted practices (meeting target)
export function getAdoptedCount(practices, definitions) {
  let adopted = 0, total = 0, meetsTarget = 0;
  Object.entries(practices).forEach(([key, value]) => {
    const def = definitions[key];
    if (!def) return;
    if (def.type === 'boolean') {
      if (value === 'na') return;
      total++;
      if (value) adopted++;
      if (value === def.target) meetsTarget++;
    } else {
      if (value === -1) return;
      total++;
      if (value >= 3) adopted++;
      if (value >= (def.target || 3)) meetsTarget++;
    }
  });
  return { adopted, total, meetsTarget };
}

// Calculate practice adoption across all squads in a BU
export function getPracticeAdoption(squads, definitions) {
  const trackedSquads = squads.filter(s => s.tracked !== false);
  const result = {};
  Object.entries(definitions).forEach(([practiceId, def]) => {
    let adopted = 0, partial = 0, notAdopted = 0, na = 0;
    const target = def.target || (def.type === 'boolean' ? true : 3);

    trackedSquads.forEach((squad) => {
      const value = squad.practices?.[practiceId];
      if (def.type === 'boolean') {
        if (value === 'na') na++;
        else if (value === target) adopted++;
        else notAdopted++;
      } else {
        if (value === -1) na++;
        else if (value >= target) adopted++;
        else if (value >= target - 1) partial++;
        else notAdopted++;
      }
    });

    const total = trackedSquads.length - na;
    result[practiceId] = { adopted, partial, notAdopted, na, total };
  });
  return result;
}

// RAG Card - colored background card with status
export function RagCard({ status, ragColors, onClick, children, className = '' }) {
  const statusInfo = getStatusInfo(ragColors, status);
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] ${className}`}
      style={{ backgroundColor: statusInfo.hex }}
    >
      {children}
    </div>
  );
}

// Status Pill - small circular indicator
export function StatusPill({ color, size = 'md', border = false, className = '', title }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  return (
    <div
      className={`rounded-full ${sizes[size]} ${border ? 'border' : ''} ${className}`}
      style={{ backgroundColor: color }}
      title={title}
    />
  );
}

// Tooltip wrapper - shows tooltip on hover
export function TooltipWrapper({ children, content, className = '' }) {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
        {content}
      </div>
    </div>
  );
}

// Trend Indicator
export function TrendIndicator({ trend, showLabel = false }) {
  const config = trendConfig[trend] || trendConfig.stable;
  const Icon = config.Icon;
  return (
    <div className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="w-4 h-4" />
      {showLabel && <span className="text-xs">{config.label}</span>}
    </div>
  );
}

// Card Header with title and optional status badge
export function CardHeader({ title, subtitle, statusLabel, statusColor, trend, children }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        {subtitle && <p className="text-white/60 text-xs mb-0.5">{subtitle}</p>}
        <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <div className="p-1.5 rounded-full bg-white/20">
            <TrendIndicator trend={trend} />
          </div>
        )}
        {statusLabel && (
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Pills Row - displays a row of small status indicators
export function PillsRow({ items, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((item, idx) => (
        <TooltipWrapper key={idx} content={item.tooltip}>
          <StatusPill
            color={item.color}
            className={item.className}
            border={item.border}
          />
        </TooltipWrapper>
      ))}
    </div>
  );
}

// Section with label
export function CardSection({ label, count, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs text-white/50 mb-2">
        {label}{count !== undefined && ` (${count})`}
      </p>
      {children}
    </div>
  );
}

// Maturity Pills - shows current level vs target
export function MaturityPills({ current, target, scale, compact = false }) {
  if (current === -1) {
    return (
      <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 italic`}>N/A</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
      {scale.filter(l => l.level > 0).map((level) => {
        const levelNum = level.level;
        const isFilled = current >= levelNum;
        const isTarget = levelNum === target;
        const isBelowTarget = current < target && levelNum <= target;

        let pillClass = '';
        if (isFilled) {
          pillClass = current >= target
            ? 'bg-emerald-500'
            : 'bg-amber-500';
        } else if (isBelowTarget) {
          pillClass = 'bg-slate-600';
        } else {
          pillClass = 'bg-slate-700';
        }

        return (
          <div
            key={levelNum}
            className={`${compact ? 'w-4 h-1.5' : 'w-6 h-2'} rounded-full ${pillClass} ${
              isTarget ? 'ring-1 ring-white/50' : ''
            }`}
            title={`${level.label}: ${level.description || ''}`}
          />
        );
      })}
    </div>
  );
}

// Boolean Pill - Yes/No/N/A indicator
export function BooleanPill({ value, target, compact = false }) {
  if (value === 'na') {
    return <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 italic`}>N/A</span>;
  }

  const meetsTarget = value === target;
  return (
    <div
      className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} rounded-full flex items-center justify-center ${
        meetsTarget ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span className="text-white text-xs font-bold">
        {value ? '✓' : '✗'}
      </span>
    </div>
  );
}
