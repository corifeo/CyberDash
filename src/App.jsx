import { useState, useRef, useMemo } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload,
  Calendar, Users, ChevronRight, RotateCcw,
  Info, ArrowUpRight, ArrowDownRight, Minus,
  Settings, X, Target, Check, Sun, Moon,
  ChevronUp, ChevronDown, Eye, EyeOff, Scale, Star
} from 'lucide-react';
import { useStore } from './store/useStore';
import {
  EditableText,
  EditableTextarea,
  EditableSelect,
  EditableToggle,
  EditableMaturity,
} from './components/Editable';

// Count adopted practices (meeting target)
function getAdoptedCount(practices, definitions) {
  let adopted = 0;
  let total = 0;
  let meetsTarget = 0;
  Object.entries(practices).forEach(([key, value]) => {
    const def = definitions[key];
    if (!def) return;
    total++;
    if (def.type === 'boolean') {
      if (value) adopted++;
      if (value === def.target) meetsTarget++;
    } else {
      if (value >= 3) adopted++;
      if (value >= (def.target || 3)) meetsTarget++;
    }
  });
  return { adopted, total, meetsTarget };
}

// Get status color based on current vs target
function getMaturityStatus(current, target, type) {
  if (type === 'boolean') {
    return current === target ? 'met' : 'behind';
  }
  if (current >= target) return 'met';
  if (current >= target - 1) return 'close';
  return 'behind';
}

// Stacked Pills Component - Option E visualization
function MaturityPills({ current, target, scale, compact = false }) {
  const maxLevel = scale.length - 1; // 0 to 4 = 5 levels

  return (
    <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
      {scale.slice(1).map((level, idx) => {
        const levelNum = idx + 1;
        const isFilled = current >= levelNum;
        const isTarget = target === levelNum;
        const isPastTarget = levelNum > target;

        return (
          <div
            key={levelNum}
            className={`
              ${compact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full transition-all
              ${isFilled
                ? current >= target
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
                : isPastTarget
                  ? 'bg-slate-700'
                  : 'bg-slate-600'
              }
              ${isTarget && !isFilled ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-slate-900' : ''}
              ${isTarget && isFilled ? 'ring-2 ring-emerald-300' : ''}
            `}
            title={`${level.label}${isTarget ? ' (Target)' : ''}`}
          />
        );
      })}
      {!compact && (
        <span className="text-xs text-slate-400 ml-1">
          {current}/{target}
        </span>
      )}
    </div>
  );
}

// Boolean Pill - for yes/no practices
function BooleanPill({ value, target, compact = false }) {
  const met = value === target;
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <div
        className={`
          ${compact ? 'w-4 h-4' : 'w-5 h-5'} rounded-full flex items-center justify-center
          ${value
            ? met ? 'bg-emerald-400' : 'bg-amber-400'
            : 'bg-slate-600 ring-2 ring-white/30'
          }
        `}
      >
        {value && <Check className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />}
      </div>
      {!compact && (
        <span className={`text-xs ${value ? 'text-emerald-400' : 'text-slate-400'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      )}
    </div>
  );
}

// Default hex colors for status
const DEFAULT_HEX_COLORS = {
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  none: '#64748b',
};

// Helper to get status info from ragColors
function getStatusInfo(ragColors, status) {
  const colors = ragColors?.[status];
  const hex = colors?.hex || DEFAULT_HEX_COLORS[status] || DEFAULT_HEX_COLORS.none;
  return {
    hex,
    hoverHex: adjustColor(hex, -15), // Darken for hover
    label: colors?.label || (
      status === 'green' ? 'Strong' :
      status === 'amber' ? 'Developing' :
      status === 'red' ? 'Early Stage' :
      'Not Tracked'
    ),
  };
}

// Darken/lighten a hex color
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Calculate weighted BU RAG status from tracked squads only
function getWeightedBuStatus(squads) {
  // Filter to only tracked squads with valid status
  const trackedSquads = squads.filter(s => s.tracked !== false && s.status && s.status !== 'none');

  if (trackedSquads.length === 0) {
    return 'none'; // No tracked squads = grey
  }

  // Calculate weighted score: green=3, amber=2, red=1
  const statusValue = { green: 3, amber: 2, red: 1 };
  let totalWeight = 0;
  let weightedSum = 0;

  trackedSquads.forEach(squad => {
    const weight = squad.weight || 1;
    const value = statusValue[squad.status] || 1;
    totalWeight += weight;
    weightedSum += value * weight;
  });

  if (totalWeight === 0) return 'none';

  const avgScore = weightedSum / totalWeight;

  // Convert back to status: 2.5+ = green, 1.5+ = amber, else red
  if (avgScore >= 2.5) return 'green';
  if (avgScore >= 1.5) return 'amber';
  return 'red';
}

// Better trend config with colors and icons
const trendConfig = {
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
};

// Get next month suggestion
function getNextMonthSuggestion(currentMonth) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  let nextYear, nextMonth;
  if (year < currentYear || (year === currentYear && month < currentMonthNum)) {
    nextYear = currentYear;
    nextMonth = currentMonthNum;
  } else {
    nextMonth = month + 1;
    nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    key: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
    label: `${monthNames[nextMonth - 1]} ${nextYear}`,
  };
}

// Tooltip component for hover metadata
function Tooltip({ squad, practices, ragColors, children }) {
  const [show, setShow] = useState(false);
  const { adopted, total } = getAdoptedCount(squad.practices || {}, practices);
  const trend = trendConfig[squad.monthlyUpdate?.trend] || trendConfig.stable;
  const statusInfo = getStatusInfo(ragColors, squad.status || 'red');

  // Get important practices and their values
  const importantPractices = Object.entries(practices)
    .filter(([_, def]) => def.important)
    .map(([id, def]) => {
      const value = squad.practices[id];
      const target = def.target || 3;
      const adopted = def.type === 'boolean' ? value === true : (value || 0) >= target;
      return { id, name: def.name, type: def.type, value, target, adopted };
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
                <div className="space-y-1">
                  {importantPractices.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{p.name}</span>
                      <span className={p.adopted ? 'text-green-400' : 'text-red-400'}>
                        {p.type === 'boolean'
                          ? (p.value ? 'Yes' : 'No')
                          : `${p.value || 0}/${p.target}`}
                      </span>
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

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, labelLeft, labelRight, darkMode = true }) {
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

// Legend Component
function Legend({ darkMode = true, ragColors }) {
  const theme = darkMode ? {
    bg: 'bg-slate-800/50 border-slate-700',
    muted: 'text-slate-400',
    text: 'text-slate-300',
  } : {
    bg: 'bg-slate-50 border-slate-200',
    muted: 'text-slate-500',
    text: 'text-slate-600',
  };

  return (
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
  );
}

// Settings Modal Component
function SettingsModal({
  practices,
  orderedPractices,
  maturityScale,
  months,
  currentMonth,
  colorPreset,
  colorPresets,
  ragColors,
  darkMode = true,
  onUpdatePractice,
  onAddPractice,
  onDeletePractice,
  onReorderPractice,
  onUpdateMaturityScale,
  onDeleteMonth,
  onSetColorPreset,
  onUpdateRagColor,
  onExportAllArchive,
  onImportAllArchive,
  onExportSettings,
  onImportSettings,
  onResetData,
  onClose
}) {
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newPracticeType, setNewPracticeType] = useState('maturity');
  const [activeTab, setActiveTab] = useState('practices');
  const archiveInputRef = useRef(null);
  const settingsInputRef = useRef(null);

  // Theme for light/dark mode
  const st = darkMode ? {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    cardBg: 'bg-slate-800/50',
    cardBgAlt: 'bg-slate-800/30',
    input: 'bg-slate-800 border-slate-700 text-white',
    text: 'text-white',
    textMuted: 'text-slate-300',
    textHint: 'text-slate-400',
    textDim: 'text-slate-500',
    hover: 'hover:bg-slate-700',
    hoverDanger: 'hover:bg-red-900/50 hover:text-red-400',
    btnDisabled: 'text-slate-600',
  } : {
    bg: 'bg-white',
    border: 'border-slate-200',
    cardBg: 'bg-slate-100',
    cardBgAlt: 'bg-slate-50',
    input: 'bg-white border-slate-300 text-slate-900',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textHint: 'text-slate-500',
    textDim: 'text-slate-400',
    hover: 'hover:bg-slate-200',
    hoverDanger: 'hover:bg-red-100 hover:text-red-600',
    btnDisabled: 'text-slate-300',
  };

  const handleAddPractice = () => {
    if (newPracticeName.trim()) {
      onAddPractice(newPracticeName.trim(), newPracticeType);
      setNewPracticeName('');
    }
  };

  const handleArchiveImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onImportAllArchive(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleSettingsImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onImportSettings(e.target.result);
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'practices', label: 'Practices' },
    { id: 'scale', label: 'Scale' },
    { id: 'colors', label: 'Colors' },
    { id: 'months', label: 'Data' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`${st.bg} border ${st.border} rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col ${st.text}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${st.border}`}>
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className={`p-1 ${st.hover} rounded`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${st.border}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyber-400 border-b-2 border-cyber-400'
                  : `${st.textHint} ${st.hover}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hidden file inputs */}
        <input ref={archiveInputRef} type="file" accept=".json" onChange={handleArchiveImport} className="hidden" />
        <input ref={settingsInputRef} type="file" accept=".json" onChange={handleSettingsImport} className="hidden" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'practices' && (
            <div className="space-y-4">
              {/* Add new practice */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-3`}>Add New Practice</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPracticeName}
                    onChange={(e) => setNewPracticeName(e.target.value)}
                    placeholder="Practice name..."
                    className={`flex-1 ${st.input} border rounded px-3 py-2 text-sm focus:border-cyber-500 outline-none`}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPractice()}
                  />
                  <select
                    value={newPracticeType}
                    onChange={(e) => setNewPracticeType(e.target.value)}
                    className={`${st.input} border rounded px-3 py-2 text-sm`}
                  >
                    <option value="maturity">Maturity</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                  <button
                    onClick={handleAddPractice}
                    disabled={!newPracticeName.trim()}
                    className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Practice list */}
              <div>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-3`}>
                  Practices ({orderedPractices.length})
                </h3>
                <div className="space-y-2">
                  {orderedPractices.map((practice, index) => (
                    <div key={practice.id} className={`flex items-center gap-2 ${st.cardBgAlt} rounded-lg p-3`}>
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => index > 0 && onReorderPractice(index, index - 1)}
                          disabled={index === 0}
                          className={`p-0.5 rounded ${index === 0 ? st.btnDisabled + ' cursor-not-allowed' : st.textHint + ' ' + st.hover}`}
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => index < orderedPractices.length - 1 && onReorderPractice(index, index + 1)}
                          disabled={index === orderedPractices.length - 1}
                          className={`p-0.5 rounded ${index === orderedPractices.length - 1 ? st.btnDisabled + ' cursor-not-allowed' : st.textHint + ' ' + st.hover}`}
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        practice.type === 'boolean' ? 'bg-cyan-500' : 'bg-purple-500'
                      }`} />
                      <input
                        type="text"
                        value={practice.name}
                        onChange={(e) => onUpdatePractice(practice.id, 'name', e.target.value)}
                        className={`flex-1 ${st.input} border rounded px-3 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                      />
                      {/* Important toggle - shows in mouseover */}
                      <button
                        onClick={() => onUpdatePractice(practice.id, 'important', !practice.important)}
                        className={`p-1.5 rounded transition-colors ${
                          practice.important
                            ? 'text-amber-400'
                            : `${st.textDim} hover:text-amber-400`
                        }`}
                        title={practice.important ? 'Remove from summary' : 'Show in summary'}
                      >
                        <Star className={`w-4 h-4 ${practice.important ? 'fill-amber-400' : ''}`} />
                      </button>
                      {practice.type === 'maturity' ? (
                        <div className="flex items-center gap-2">
                          <Target className={`w-4 h-4 ${st.textHint}`} />
                          <select
                            value={practice.target || 3}
                            onChange={(e) => onUpdatePractice(practice.id, 'target', parseInt(e.target.value))}
                            className={`${st.input} border rounded px-2 py-1 text-sm w-16`}
                          >
                            {maturityScale.slice(1).map((level) => (
                              <option key={level.level} value={level.level}>
                                {level.level}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className={`text-xs ${st.textDim} px-2`}>Yes/No</span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${practice.name}"?`)) {
                            onDeletePractice(practice.id);
                          }
                        }}
                        className={`p-1.5 ${st.textHint} ${st.hoverDanger} rounded`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className={`pt-4 border-t ${st.border}`}>
                <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${st.textHint}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Boolean (Yes/No)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Maturity (scale levels)
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Target level
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Shows in summary
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="space-y-4">
              <p className={`text-sm ${st.textHint}`}>
                Customize the labels for your maturity scale. Level 0 means "not started".
              </p>

              <div className="space-y-2">
                {maturityScale.map((level, idx) => (
                  <div key={idx} className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                    <div className={`w-8 h-8 rounded-full ${st.cardBg} flex items-center justify-center font-bold text-sm`}>
                      {level.level}
                    </div>
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => onUpdateMaturityScale(idx, 'label', e.target.value)}
                      placeholder="Level label..."
                      className={`flex-1 ${st.input} border rounded px-3 py-2 text-sm focus:border-cyber-500 outline-none`}
                    />
                    <input
                      type="text"
                      value={level.short}
                      onChange={(e) => onUpdateMaturityScale(idx, 'short', e.target.value)}
                      placeholder="Short"
                      maxLength={2}
                      className={`w-12 ${st.input} border rounded px-2 py-2 text-sm text-center focus:border-cyber-500 outline-none`}
                    />
                  </div>
                ))}
              </div>

              {/* Pills Preview */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h4 className={`text-sm font-medium ${st.textMuted} mb-3`}>Preview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${st.textHint}`}>At target (3/3):</span>
                    <MaturityPills current={3} target={3} scale={maturityScale} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${st.textHint}`}>Close to target (2/3):</span>
                    <MaturityPills current={2} target={3} scale={maturityScale} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${st.textHint}`}>Behind target (1/4):</span>
                    <MaturityPills current={1} target={4} scale={maturityScale} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-4">
              <p className={`text-sm ${st.textHint}`}>
                Choose a color theme for status cards, or customize each color with HEX values.
              </p>

              {/* Color Presets */}
              <div>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-3`}>Color Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(colorPresets).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => onSetColorPreset(name)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        colorPreset === name
                          ? `border-cyber-500 ${st.cardBg}`
                          : `${st.border} ${st.hover}`
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.green.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.amber.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.red.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.none.hex }} />
                      </div>
                      <span className={`text-xs ${st.textHint} capitalize`}>{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status Colors */}
              <div>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-3`}>
                  Status Colors & Labels
                  {colorPreset === 'custom' && <span className="ml-2 text-xs text-cyber-400">(Custom)</span>}
                </h3>
                <div className="space-y-2">
                  {['green', 'amber', 'red', 'none'].map((status) => (
                    <div key={status} className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      {/* Color picker */}
                      <input
                        type="color"
                        value={ragColors[status]?.hex || DEFAULT_HEX_COLORS[status]}
                        onChange={(e) => onUpdateRagColor(status, 'hex', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        title={`Pick ${status} color`}
                      />
                      {/* HEX input */}
                      <input
                        type="text"
                        value={ragColors[status]?.hex || DEFAULT_HEX_COLORS[status]}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            onUpdateRagColor(status, 'hex', val);
                          }
                        }}
                        placeholder="#000000"
                        className={`w-24 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                      />
                      {/* Label input */}
                      <input
                        type="text"
                        value={ragColors[status]?.label || ''}
                        onChange={(e) => onUpdateRagColor(status, 'label', e.target.value)}
                        placeholder={status === 'none' ? 'Not Tracked' : `${status} label...`}
                        className={`flex-1 ${st.input} border rounded px-3 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                      />
                      {/* Status name hint */}
                      <span className={`text-xs ${st.textDim} w-12`}>{status}</span>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${st.textDim} mt-2`}>
                  The "none" status is for squads not being actively measured.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'months' && (
            <div className="space-y-6">
              {/* Month Management */}
              <div>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-2`}>Reporting Periods</h3>
                <p className={`text-xs ${st.textDim} mb-3`}>
                  Manage months. Cannot delete current or last month.
                </p>
                <div className="space-y-2">
                  {months.map((month) => {
                    const isCurrent = month === currentMonth;
                    const isLast = months.length === 1;
                    const canDelete = !isCurrent && !isLast;

                    return (
                      <div key={month} className={`flex items-center justify-between ${st.cardBgAlt} rounded-lg p-3`}>
                        <div className="flex items-center gap-3">
                          <Calendar className={`w-4 h-4 ${st.textHint}`} />
                          <span className="text-sm">{month}</span>
                          {isCurrent && (
                            <span className="text-xs bg-cyber-500/20 text-cyber-400 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (canDelete && confirm(`Delete ${month}? This cannot be undone.`)) {
                              onDeleteMonth(month);
                            }
                          }}
                          disabled={!canDelete}
                          className={`p-1.5 rounded ${
                            canDelete
                              ? `${st.textHint} ${st.hoverDanger}`
                              : `${st.btnDisabled} cursor-not-allowed`
                          }`}
                          title={isCurrent ? "Can't delete current month" : isLast ? "Can't delete last month" : 'Delete month'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Archive Export/Import */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-2`}>Archive (All Months)</h3>
                <p className={`text-xs ${st.textDim} mb-3`}>
                  Export or import all month data at once.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onExportAllArchive}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${st.cardBgAlt} ${st.hover} rounded text-sm`}
                  >
                    <Download className="w-4 h-4" />
                    Export Archive
                  </button>
                  <button
                    onClick={() => archiveInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${st.cardBgAlt} ${st.hover} rounded text-sm`}
                  >
                    <Upload className="w-4 h-4" />
                    Import Archive
                  </button>
                </div>
              </div>

              {/* Settings Export/Import */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-2`}>Settings</h3>
                <p className={`text-xs ${st.textDim} mb-3`}>
                  Export or import practices, scale, and color settings independently.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onExportSettings}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${st.cardBgAlt} ${st.hover} rounded text-sm`}
                  >
                    <Download className="w-4 h-4" />
                    Export Settings
                  </button>
                  <button
                    onClick={() => settingsInputRef.current?.click()}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${st.cardBgAlt} ${st.hover} rounded text-sm`}
                  >
                    <Upload className="w-4 h-4" />
                    Import Settings
                  </button>
                </div>
              </div>

              {/* Hard Reset */}
              <div className={`border border-red-500/30 rounded-lg p-4`}>
                <h3 className={`text-sm font-medium text-red-400 mb-2`}>Factory Reset</h3>
                <p className={`text-xs ${st.textDim} mb-3`}>
                  Reset all data and settings to factory defaults. This will delete all your data and cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset everything to factory defaults?\n\nThis will DELETE ALL your data including:\n- All business units and squads\n- All months of history\n- All practice configurations\n- All color customizations\n\nThis action CANNOT be undone!')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-sm w-full"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Factory Defaults
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${st.border}`}>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyber-500 hover:bg-cyber-600 rounded text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Stat Display Component - Big number with label
function StatNumber({ value, label, size = 'lg' }) {
  const sizeClasses = size === 'xl' ? 'text-4xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  return (
    <div className="text-center">
      <div className={`${sizeClasses} font-bold text-white leading-none`}>{value}</div>
      <div className="text-xs text-white/60 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function App() {
  const store = useStore();
  const [selectedBU, setSelectedBU] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef(null);

  const nextMonthSuggestion = useMemo(() => {
    return getNextMonthSuggestion(store.currentMonth);
  }, [store.currentMonth]);

  const [newMonthKey, setNewMonthKey] = useState('');
  const [newMonthLabel, setNewMonthLabel] = useState('');

  const monthData = store.currentMonthData;
  if (!monthData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <button onClick={store.resetData} className="px-4 py-2 bg-cyber-500 rounded">
          Initialize Data
        </button>
      </div>
    );
  }

  const currentBU = selectedBU
    ? monthData.businessUnits.find((b) => b.id === selectedBU)
    : null;

  const currentSquad = selectedSquad && currentBU
    ? currentBU.squads.find((s) => s.id === selectedSquad)
    : null;

  const goHome = () => {
    setSelectedBU(null);
    setSelectedSquad(null);
  };

  const openNewMonthModal = () => {
    setNewMonthKey(nextMonthSuggestion.key);
    setNewMonthLabel(nextMonthSuggestion.label);
    setShowNewMonth(true);
  };

  const handleCreateMonth = () => {
    if (newMonthKey && newMonthLabel) {
      store.createNewMonth(newMonthKey, newMonthLabel);
      setShowNewMonth(false);
      setNewMonthKey('');
      setNewMonthLabel('');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        store.importCurrentMonth(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Theme classes
  const theme = store.darkMode ? {
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    text: 'text-white',
    header: 'bg-slate-950/90 border-slate-800',
    card: 'bg-slate-900/50 border-slate-800',
    cardAlt: 'bg-slate-800/50 border-slate-700',
    input: 'bg-slate-800 border-slate-700',
    muted: 'text-slate-400',
    mutedBg: 'bg-slate-800',
    hover: 'hover:bg-slate-700',
    divider: 'border-slate-700',
  } : {
    bg: 'bg-gradient-to-br from-slate-100 via-white to-slate-100',
    text: 'text-slate-900',
    header: 'bg-white/90 border-slate-200',
    card: 'bg-white border-slate-200',
    cardAlt: 'bg-slate-50 border-slate-200',
    input: 'bg-white border-slate-300',
    muted: 'text-slate-500',
    mutedBg: 'bg-slate-100',
    hover: 'hover:bg-slate-200',
    divider: 'border-slate-200',
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Header - Fixed alignment with flex sections */}
      <header className={`sticky top-0 z-40 ${theme.header} backdrop-blur border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Left section - Logo (fixed width) */}
            <button onClick={goHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyber-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left hidden sm:block">
                <h1 className="font-bold text-xl">CyberDash</h1>
                <p className={`text-xs ${theme.muted}`}>{monthData.reportingPeriod}</p>
              </div>
            </button>

            {/* Center section - Toggles (grows to fill space, centered) */}
            <div className="flex-1 flex justify-center items-center gap-4">
              <ToggleSwitch
                checked={editMode}
                onChange={setEditMode}
                labelLeft="View"
                labelRight="Edit"
                darkMode={store.darkMode}
              />
              <div className={`w-px h-5 ${theme.divider} border-l`} />
              <button
                onClick={() => store.setDarkMode(!store.darkMode)}
                className={`p-1.5 ${theme.mutedBg} ${theme.hover} rounded transition-colors`}
                title={store.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {store.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Right section - Actions (fixed width) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Month Selector */}
              <div className="flex items-center gap-1">
                <Calendar className={`w-4 h-4 ${theme.muted} hidden sm:block`} />
                <select
                  value={store.currentMonth}
                  onChange={(e) => store.setCurrentMonth(e.target.value)}
                  className={`${theme.input} rounded px-2 py-1.5 text-sm w-24`}
                >
                  {store.months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={openNewMonthModal}
                  className={`p-1.5 ${theme.mutedBg} ${theme.hover} rounded ${!editMode ? 'invisible' : ''}`}
                  title="New Month"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className={`w-px h-6 ${theme.divider} border-l mx-1`} />

              {/* Action buttons - always rendered, some invisible in view mode */}
              <button
                onClick={store.exportCurrentMonth}
                className={`p-1.5 ${theme.mutedBg} ${theme.hover} rounded`}
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 ${theme.mutedBg} ${theme.hover} rounded ${!editMode ? 'invisible' : ''}`}
                title="Import"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-1.5 ${theme.mutedBg} ${theme.hover} rounded ${!editMode ? 'invisible' : ''}`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset current month to previous period data?')) store.resetToLastPeriod();
                }}
                className={`p-1.5 ${theme.mutedBg} hover:bg-red-900 rounded ${!editMode ? 'invisible' : ''}`}
                title="Reset to previous period"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          practices={store.practices}
          orderedPractices={store.orderedPractices}
          maturityScale={store.maturityScale}
          months={store.months}
          currentMonth={store.currentMonth}
          colorPreset={store.colorPreset}
          colorPresets={store.colorPresets}
          ragColors={store.ragColors}
          darkMode={store.darkMode}
          onUpdatePractice={store.updatePractice}
          onAddPractice={store.addPractice}
          onDeletePractice={store.deletePractice}
          onReorderPractice={store.reorderPractice}
          onUpdateMaturityScale={store.updateMaturityScale}
          onDeleteMonth={store.deleteMonth}
          onSetColorPreset={store.setColorPreset}
          onUpdateRagColor={store.updateRagColor}
          onExportAllArchive={store.exportAllArchive}
          onImportAllArchive={store.importAllArchive}
          onExportSettings={store.exportSettings}
          onImportSettings={store.importSettings}
          onResetData={store.resetData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* New Month Modal */}
      {showNewMonth && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Month</h2>
            <p className="text-sm text-slate-400 mb-4">
              Creates a copy of current month's data with cleared update summaries.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Month Key</label>
                <input
                  type="text"
                  value={newMonthKey}
                  onChange={(e) => setNewMonthKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Display Label</label>
                <input
                  type="text"
                  value={newMonthLabel}
                  onChange={(e) => setNewMonthLabel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewMonth(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMonth}
                  className="flex-1 px-4 py-2 bg-cyber-500 hover:bg-cyber-600 rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb - Larger */}
        <nav className="flex items-center gap-3 text-lg mb-6">
          <button onClick={goHome} className={`${theme.muted} hover:opacity-70 transition-colors`}>
            Overview
          </button>
          {currentBU && (
            <>
              <ChevronRight className={`w-5 h-5 ${theme.muted}`} />
              <button
                onClick={() => setSelectedSquad(null)}
                className={`transition-colors ${currentSquad ? `${theme.muted} hover:opacity-70` : 'font-semibold'}`}
              >
                {currentBU.name}
              </button>
            </>
          )}
          {currentSquad && (
            <>
              <ChevronRight className={`w-5 h-5 ${theme.muted}`} />
              <span className="font-semibold">{currentSquad.name}</span>
            </>
          )}
        </nav>

        {/* Squad Detail View */}
        {currentSquad && currentBU ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold">
                {!editMode ? currentSquad.name : (
                  <EditableText
                    value={currentSquad.name}
                    onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'name', v)}
                  />
                )}
              </h2>
              {(() => {
                const squadStatus = currentSquad.status || 'red';
                const sc = getStatusInfo(store.ragColors, squadStatus);
                return editMode ? (
                  <EditableSelect
                    value={squadStatus}
                    onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'status', v)}
                    options={[
                      { value: 'green', label: `🟢 ${store.ragColors?.green?.label || 'Strong'}` },
                      { value: 'amber', label: `🟡 ${store.ragColors?.amber?.label || 'Developing'}` },
                      { value: 'red', label: `🔴 ${store.ragColors?.red?.label || 'Early Stage'}` },
                      { value: 'none', label: `⚪ ${store.ragColors?.none?.label || 'Not Tracked'}` },
                    ]}
                  />
                ) : (
                  <div
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: sc.hex }}
                  >
                    {sc.label}
                  </div>
                );
              })()}
            </div>

            {/* Squad Settings - Tracked & Weight (Edit mode only) */}
            {editMode && (
              <div className={`${theme.cardAlt} rounded-lg p-4`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Tracked Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => store.updateSquad(currentBU.id, currentSquad.id, 'tracked', currentSquad.tracked === false)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80 ${
                        currentSquad.tracked !== false
                          ? 'bg-cyber-500/20 text-cyber-400'
                          : `${theme.card} ${theme.muted}`
                      }`}
                    >
                      {currentSquad.tracked !== false ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {currentSquad.tracked !== false ? 'Tracked' : 'Untracked'}
                      </span>
                    </button>
                    <span className={`text-xs ${theme.muted}`}>
                      {currentSquad.tracked !== false
                        ? 'Counts toward BU status'
                        : "Doesn't impact BU status"}
                    </span>
                  </div>

                  {/* Weight */}
                  <div className="flex items-center gap-3">
                    <Scale className={`w-4 h-4 ${theme.muted}`} />
                    <span className={`text-sm ${theme.muted}`}>Weight:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={currentSquad.weight || 1}
                      onChange={(e) => store.updateSquad(currentBU.id, currentSquad.id, 'weight', parseFloat(e.target.value) || 1)}
                      className={`w-16 ${theme.input} border rounded px-2 py-1 text-sm text-center`}
                    />
                    <span className={`text-xs ${theme.muted}`}>
                      (relative importance)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Practices */}
            <div className={`${theme.card} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Security Practices</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${theme.muted}`}>
                    {getAdoptedCount(currentSquad.practices, store.practices).meetsTarget}/
                    {getAdoptedCount(currentSquad.practices, store.practices).total} at target
                  </span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {store.orderedPractices.map((def) => {
                  const key = def.id;
                  const value = currentSquad.practices[key];
                  const target = def.target || (def.type === 'boolean' ? true : 3);
                  return (
                    <div key={key} className={`flex items-center justify-between p-3 ${theme.cardAlt} rounded-lg`}>
                      {!editMode ? (
                        <>
                          <span className="text-sm font-medium">{def.name}</span>
                          {def.type === 'boolean' ? (
                            <BooleanPill value={value} target={target} />
                          ) : (
                            <MaturityPills
                              current={value}
                              target={target}
                              scale={store.maturityScale}
                            />
                          )}
                        </>
                      ) : def.type === 'boolean' ? (
                        <EditableToggle
                          value={value}
                          onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, `practices.${key}`, v)}
                          label={def.name}
                        />
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{def.name}</span>
                          <div className="flex items-center gap-3">
                            <MaturityPills
                              current={value}
                              target={target}
                              scale={store.maturityScale}
                              compact
                            />
                            <EditableMaturity
                              value={value}
                              onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, `practices.${key}`, v)}
                              label=""
                              max={store.maturityScale.length - 1}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Update */}
            <div className={`${theme.card} border rounded-xl p-5`}>
              <h3 className="font-semibold mb-4">Monthly Update</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm ${theme.muted} mb-1`}>This Period</label>
                  {!editMode ? (
                    <p className="text-sm">{currentSquad.monthlyUpdate.summary || <span className={`${theme.muted} italic`}>No update</span>}</p>
                  ) : (
                    <EditableTextarea
                      value={currentSquad.monthlyUpdate.summary}
                      onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.summary', v)}
                      placeholder="What was accomplished this month..."
                      className="text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${theme.muted} mb-1`}>Next Period</label>
                  {!editMode ? (
                    <p className="text-sm">{currentSquad.monthlyUpdate.nextPeriod || <span className={`${theme.muted} italic`}>No plans</span>}</p>
                  ) : (
                    <EditableTextarea
                      value={currentSquad.monthlyUpdate.nextPeriod}
                      onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.nextPeriod', v)}
                      placeholder="Plans for next month..."
                      className="text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className={`block text-sm ${theme.muted} mb-1`}>Trend</label>
                  {!editMode ? (
                    <div className={`flex items-center gap-2 ${trendConfig[currentSquad.monthlyUpdate.trend].color}`}>
                      {(() => { const T = trendConfig[currentSquad.monthlyUpdate.trend]; return <T.Icon className="w-5 h-5" />; })()}
                      <span className="text-sm font-medium">{trendConfig[currentSquad.monthlyUpdate.trend].label}</span>
                    </div>
                  ) : (
                    <EditableSelect
                      value={currentSquad.monthlyUpdate.trend}
                      onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.trend', v)}
                      options={[
                        { value: 'improving', label: '↗ Improving' },
                        { value: 'stable', label: '→ Stable' },
                        { value: 'declining', label: '↘ Needs Attention' },
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>

            {editMode && (
              <button
                onClick={() => {
                  if (confirm('Delete this squad?')) {
                    store.deleteSquad(currentBU.id, currentSquad.id);
                    setSelectedSquad(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded"
              >
                <Trash2 className="w-4 h-4" />
                Delete Squad
              </button>
            )}
          </div>
        ) : currentBU ? (
          /* Business Unit View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {!editMode ? currentBU.name : (
                  <EditableText
                    value={currentBU.name}
                    onChange={(v) => store.updateBusinessUnit(currentBU.id, v)}
                  />
                )}
              </h2>
              {editMode && (
                <button
                  onClick={() => store.addSquad(currentBU.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-500 hover:bg-cyber-600 rounded text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Squad
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBU.squads.map((squad) => {
                const status = squad.status || 'red';
                const statusInfo = getStatusInfo(store.ragColors, status);
                const { adopted, total, meetsTarget } = getAdoptedCount(squad.practices, store.practices);
                const trend = trendConfig[squad.monthlyUpdate.trend];
                return (
                  <Tooltip key={squad.id} squad={squad} practices={store.practices} ragColors={store.ragColors}>
                    <div
                      onClick={() => setSelectedSquad(squad.id)}
                      className="rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      style={{ backgroundColor: statusInfo.hex }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-lg leading-tight">{squad.name}</h3>
                        <div className="p-1.5 rounded-full bg-white/20">
                          <trend.Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Pills Summary Row - white-based for contrast */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Object.entries(store.practices).map(([key, def]) => {
                          const value = squad.practices[key];
                          const target = def.target || (def.type === 'boolean' ? true : 3);
                          if (def.type === 'boolean') {
                            return (
                              <div
                                key={key}
                                className={`w-3 h-3 rounded-full ${
                                  value ? 'bg-white/90' : 'bg-white/25'
                                }`}
                                title={`${def.name}: ${value ? 'Yes' : 'No'}`}
                              />
                            );
                          }
                          const met = value >= target;
                          const close = value >= target - 1;
                          return (
                            <div
                              key={key}
                              className={`w-3 h-3 rounded-full ${
                                met ? 'bg-white/90' : close ? 'bg-white/50' : 'bg-white/25'
                              }`}
                              title={`${def.name}: ${value}/${target}`}
                            />
                          );
                        })}
                      </div>

                      {/* Big Stats */}
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <div className="text-4xl font-black text-white leading-none">{meetsTarget}</div>
                          <div className="text-white/50 text-xs mt-1">of {total} at target</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/20">
                        <span className="text-white/70 text-sm">{trend.label}</span>
                        <span className="text-white/50 text-xs">{statusInfo.label}</span>
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {currentBU.squads.length === 0 && (
              <p className={`text-center ${theme.muted} py-8`}>No squads yet. {editMode && 'Add one to get started.'}</p>
            )}

            <Legend darkMode={store.darkMode} ragColors={store.ragColors} />

            {editMode && (
              <button
                onClick={() => {
                  if (confirm('Delete this business unit and all its squads?')) {
                    store.deleteBusinessUnit(currentBU.id);
                    setSelectedBU(null);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded"
              >
                <Trash2 className="w-4 h-4" />
                Delete Business Unit
              </button>
            )}
          </div>
        ) : (
          /* Overview */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Business Units</h2>
              {editMode && (
                <button
                  onClick={store.addBusinessUnit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-500 hover:bg-cyber-600 rounded text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Business Unit
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {monthData.businessUnits.map((bu) => {
                const squadStatuses = bu.squads.map((s) => s.status || 'red');
                // Use weighted calculation based on tracked squads and their weights
                const dominantStatus = getWeightedBuStatus(bu.squads);
                const statusInfo = getStatusInfo(store.ragColors, dominantStatus);

                // Calculate weighted average of adopted practices
                const totalPracticesCount = Object.keys(store.practices).length;
                let weightedAdoptedSum = 0;
                let totalWeight = 0;
                bu.squads.forEach((s) => {
                  const weight = s.weight || 1;
                  const { adopted } = getAdoptedCount(s.practices, store.practices);
                  weightedAdoptedSum += adopted * weight;
                  totalWeight += weight;
                });
                const weightedAdopted = totalWeight > 0
                  ? (weightedAdoptedSum / totalWeight).toFixed(1).replace(/\.0$/, '')
                  : 0;

                const greenCount = squadStatuses.filter((s) => s === 'green').length;
                const amberCount = squadStatuses.filter((s) => s === 'amber').length;
                const redCount = squadStatuses.filter((s) => s === 'red').length;
                const noneCount = squadStatuses.filter((s) => s === 'none').length;

                const greenLabel = store.ragColors?.green?.label || 'strong';
                const amberLabel = store.ragColors?.amber?.label || 'developing';
                const redLabel = store.ragColors?.red?.label || 'early';
                const noneLabel = store.ragColors?.none?.label || 'not tracked';

                return (
                  <div
                    key={bu.id}
                    onClick={() => setSelectedBU(bu.id)}
                    className="rounded-xl p-6 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    style={{ backgroundColor: statusInfo.hex }}
                  >
                    {/* Card Header */}
                    <h3 className="text-xl font-bold text-white mb-4">{bu.name}</h3>

                    {/* Big Stats Row */}
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <div className="text-5xl font-black text-white leading-none">{bu.squads.length}</div>
                        <div className="text-white/50 text-sm mt-1">Squads</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white/90">{weightedAdopted}<span className="text-lg text-white/50">/{totalPracticesCount}</span></div>
                        <div className="text-white/50 text-sm">Practices</div>
                      </div>
                    </div>

                    {/* Status Distribution - white-based dots for contrast */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/20">
                      {greenCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-white/90" />
                          <span className="text-white font-bold">{greenCount}</span>
                          <span className="text-white/50 text-xs">{greenLabel.toLowerCase()}</span>
                        </div>
                      )}
                      {amberCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-white/60" />
                          <span className="text-white font-bold">{amberCount}</span>
                          <span className="text-white/50 text-xs">{amberLabel.toLowerCase()}</span>
                        </div>
                      )}
                      {redCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-white/30" />
                          <span className="text-white font-bold">{redCount}</span>
                          <span className="text-white/50 text-xs">{redLabel.toLowerCase()}</span>
                        </div>
                      )}
                      {noneCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-white/20 border border-white/40" />
                          <span className="text-white font-bold">{noneCount}</span>
                          <span className="text-white/50 text-xs">{noneLabel.toLowerCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {monthData.businessUnits.length === 0 && (
              <p className={`text-center ${theme.muted} py-8`}>No business units yet. {editMode && 'Add one to get started.'}</p>
            )}

            <Legend darkMode={store.darkMode} ragColors={store.ragColors} />
          </div>
        )}
      </main>
    </div>
  );
}
