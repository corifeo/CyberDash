import { useState } from 'react';
import {
  Info, ArrowUpRight, ArrowDownRight, Minus,
  Shield, Star, Check, X, ChevronDown
} from 'lucide-react';

// Default hex colors for status
const DEFAULT_HEX_COLORS = {
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  none: '#64748b',
};

// Darken/lighten a hex color
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Get status info from RAG colors
export function getStatusInfo(ragColors, status) {
  const colors = ragColors?.[status];
  const hex = colors?.hex || DEFAULT_HEX_COLORS[status] || DEFAULT_HEX_COLORS.none;
  return {
    hex,
    hoverHex: adjustColor(hex, -15),
    label: colors?.label || (
      status === 'green' ? 'Strong' :
      status === 'amber' ? 'Developing' :
      status === 'red' ? 'Early Stage' :
      'Not Tracked'
    ),
  };
}

// Trend configuration with colors and icons
export const trendConfig = {
  improving: {
    label: 'Improving',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    Icon: ArrowUpRight,
  },
  stable: {
    label: 'Stable',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    Icon: Minus,
  },
  declining: {
    label: 'Needs Attention',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    Icon: ArrowDownRight,
  },
  'needs-attention': {
    label: 'Needs Attention',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    Icon: ArrowDownRight,
  },
};

// Count adopted practices (meeting target)
// N/A values (-1 for maturity, 'na' for boolean) are excluded from counts
export function getAdoptedCount(practices, definitions) {
  let adopted = 0;
  let total = 0;
  let meetsTarget = 0;
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

// Toggle Switch Component
export function ToggleSwitch({ checked, onChange, labelLeft, labelRight, darkMode = true }) {
  const activeClass = darkMode ? 'font-medium' : 'font-medium text-slate-900';
  const inactiveClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const trackClass = checked ? 'bg-cyber-500' : (darkMode ? 'bg-slate-600' : 'bg-slate-300');

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${!checked ? activeClass : inactiveClass}`}>{labelLeft}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${trackClass}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${checked ? 'left-7' : 'left-1'}`}
        />
      </button>
      <span className={`text-sm ${checked ? activeClass : inactiveClass}`}>{labelRight}</span>
    </div>
  );
}

// Team Card Tooltip - shows metadata on hover
export function TeamTooltip({ squad, practices, ragColors, children }) {
  const [show, setShow] = useState(false);
  const { adopted, total } = getAdoptedCount(squad.practices || {}, practices);
  const trend = trendConfig[squad.monthlyUpdate?.trend] || trendConfig.stable;
  const displayStatus = squad.tracked === false ? 'none' : (squad.status || 'red');
  const statusInfo = getStatusInfo(ragColors, displayStatus);

  // Get important practices and their values
  const importantPractices = Object.entries(practices)
    .filter(([_, def]) => def.important)
    .map(([id, def]) => {
      const value = (squad.practices || {})[id];
      const target = def.target || 3;
      const practiceAdopted = def.type === 'boolean' ? value === true : (value || 0) >= target;
      return { id, name: def.name, type: def.type, value, target, adopted: practiceAdopted };
    });

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 p-4 bg-slate-900/95 backdrop-blur border border-slate-600 rounded-lg shadow-2xl text-sm min-w-[280px]">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <span className="font-semibold" style={{ color: statusInfo.hex }}>
                {statusInfo.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Practices Adopted</span>
              <span className="text-white font-mono">{adopted}/{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Trend</span>
              <span className={`flex items-center gap-1 ${trend.color}`}>
                <trend.Icon className="w-4 h-4" />
                {trend.label}
              </span>
            </div>
            {importantPractices.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Key Practices:
                </p>
                <div className="space-y-1.5">
                  {importantPractices.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{p.name}</span>
                      {p.type === 'boolean' ? (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          p.value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {p.value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </span>
                      ) : (
                        <div className="flex gap-0.5">
                          {Array.from({ length: p.target }, (_, i) => {
                            const level = i + 1;
                            const isFilled = (p.value || 0) >= level;
                            const isTarget = level === p.target;
                            return (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${
                                  isFilled
                                    ? 'bg-green-500/80 text-white'
                                    : isTarget
                                      ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/50'
                                      : 'bg-slate-700 text-slate-500'
                                }`}
                              >
                                {level}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {squad.monthlyUpdate?.summary && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs mb-1">This Period:</p>
                <p className="text-white text-xs leading-relaxed">{squad.monthlyUpdate.summary}</p>
              </div>
            )}
            {squad.monthlyUpdate?.nextPeriod && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs mb-1">Next Period:</p>
                <p className="text-white text-xs leading-relaxed">{squad.monthlyUpdate.nextPeriod}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Legend Component with Practice Guide
export function Legend({ darkMode = true, ragColors, orderedPractices = [], maturityScale = [] }) {
  const [showGuide, setShowGuide] = useState(false);

  const theme = darkMode ? {
    bg: 'bg-slate-800/50 border-slate-700',
    bgAlt: 'bg-slate-800',
    muted: 'text-slate-400',
    text: 'text-slate-300',
    dim: 'text-slate-500',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-700/50',
  } : {
    bg: 'bg-slate-50 border-slate-200',
    bgAlt: 'bg-white',
    muted: 'text-slate-500',
    text: 'text-slate-600',
    dim: 'text-slate-400',
    border: 'border-slate-200',
    hover: 'hover:bg-slate-100',
  };

  return (
    <div className="space-y-3">
      <div className={`${theme.bg} rounded-lg p-4 border`}>
        <div className="flex items-center gap-2 mb-3">
          <Info className={`w-4 h-4 ${theme.muted}`} />
          <span className={`text-sm font-medium ${theme.text}`}>Legend</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className={`text-xs ${theme.muted} mb-2`}>Card Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: ragColors?.green?.hex || '#059669' }} />
                <span className={`text-xs ${theme.text}`}>{ragColors?.green?.label || 'Strong'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: ragColors?.amber?.hex || '#d97706' }} />
                <span className={`text-xs ${theme.text}`}>{ragColors?.amber?.label || 'Developing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                <span className={`text-xs ${theme.text}`}>{ragColors?.red?.label || 'Early Stage'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: ragColors?.none?.hex || '#64748b' }} />
                <span className={`text-xs ${theme.text}`}>{ragColors?.none?.label || 'Not Tracked'}</span>
              </div>
            </div>
          </div>
          <div>
            <p className={`text-xs ${theme.muted} mb-2`}>Trend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs ${theme.text}`}>Improving</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className={`w-4 h-4 ${theme.muted}`} />
                <span className={`text-xs ${theme.text}`}>Stable</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-amber-400" />
                <span className={`text-xs ${theme.text}`}>Attention</span>
              </div>
            </div>
          </div>
          <div>
            <p className={`text-xs ${theme.muted} mb-2`}>Card Pills</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/90 border border-slate-300" />
                <span className={`text-xs ${theme.text}`}>At target</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/50 border border-slate-300" />
                <span className={`text-xs ${theme.text}`}>Close</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/25 border border-slate-300" />
                <span className={`text-xs ${theme.text}`}>Behind</span>
              </div>
            </div>
          </div>
          <div>
            <p className={`text-xs ${theme.muted} mb-2`}>Detail Pills</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-300" />
                <span className={`text-xs ${theme.text}`}>At target</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className={`text-xs ${theme.text}`}>Close</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-600 ring-2 ring-white/50" />
                <span className={`text-xs ${theme.text}`}>Target level</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Practice Guide */}
      <div className={`${theme.bg} rounded-lg border overflow-hidden`}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`w-full flex items-center justify-between p-3 ${theme.hover} text-left`}
        >
          <span className={`text-sm font-medium ${theme.text} flex items-center gap-2`}>
            <Shield className="w-4 h-4" />
            Practice Guide & Maturity Scale
          </span>
          <ChevronDown className={`w-4 h-4 ${theme.muted} transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
        {showGuide && (
          <div className={`p-4 border-t ${theme.border} space-y-4`}>
            {/* Maturity Scale */}
            <div>
              <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Maturity Scale</h4>
              <div className="flex flex-wrap gap-2">
                {maturityScale.map((level) => (
                  <div
                    key={level.level}
                    className={`${theme.bgAlt} rounded px-3 py-1.5 text-xs flex items-center gap-2 cursor-help`}
                    title={level.description}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-white ${
                      level.level === -1 ? 'bg-slate-500' :
                      level.level === 0 ? 'bg-slate-600' :
                      level.level === 4 ? 'bg-emerald-500' :
                      'bg-cyber-500'
                    }`}>
                      {level.short}
                    </span>
                    <span className={`font-medium ${theme.text}`}>{level.label}</span>
                  </div>
                ))}
              </div>
              <p className={`text-xs ${theme.dim} mt-2`}>Hover over levels for descriptions</p>
            </div>

            {/* Practices */}
            {orderedPractices.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Security Practices</h4>
                <div className="flex flex-wrap gap-2">
                  {orderedPractices.map((practice) => (
                    <div
                      key={practice.id}
                      className={`${theme.bgAlt} rounded px-3 py-1.5 text-xs flex items-center gap-2 cursor-help`}
                      title={practice.description || 'No description'}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: practice.color || (practice.type === 'boolean' ? '#06b6d4' : '#a855f7') }}
                      />
                      <span className={`font-medium ${theme.text}`}>{practice.name}</span>
                      {practice.important && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                      <span className={`${theme.dim}`}>
                        ({practice.type === 'boolean' ? 'Yes/No' : `Target: ${practice.target}`})
                      </span>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${theme.dim} mt-2`}>Hover over practices for descriptions</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
