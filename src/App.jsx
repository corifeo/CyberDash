import { useState, useRef, useMemo } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload,
  Calendar, Users, ChevronRight, RotateCcw,
  Info, ArrowUpRight, ArrowDownRight, Minus,
  Settings, X, Target, Check
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

// RAG background colors for cards
const statusBg = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const statusBgHover = {
  green: 'hover:bg-emerald-600',
  amber: 'hover:bg-amber-600',
  red: 'hover:bg-red-600',
};

const statusLabels = {
  green: 'Strong',
  amber: 'Developing',
  red: 'Early Stage',
};

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
function Tooltip({ squad, practices, children }) {
  const [show, setShow] = useState(false);
  const { adopted, total } = getAdoptedCount(squad.practices, practices);
  const trend = trendConfig[squad.monthlyUpdate.trend];

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
              <span className={`font-semibold ${squad.status === 'green' ? 'text-emerald-400' : squad.status === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
                {statusLabels[squad.status || 'red']}
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
            {squad.monthlyUpdate.keyMetric.label && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{squad.monthlyUpdate.keyMetric.label}</span>
                <span className="text-cyber-400 font-medium">{squad.monthlyUpdate.keyMetric.value}</span>
              </div>
            )}
            {squad.monthlyUpdate.summary && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs mb-1">This Period:</p>
                <p className="text-white text-xs leading-relaxed">{squad.monthlyUpdate.summary}</p>
              </div>
            )}
            {squad.monthlyUpdate.nextPeriod && (
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
function ToggleSwitch({ checked, onChange, labelLeft, labelRight }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${!checked ? 'text-white font-medium' : 'text-slate-400'}`}>{labelLeft}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-cyber-500' : 'bg-slate-600'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'}`}
        />
      </button>
      <span className={`text-sm ${checked ? 'text-white font-medium' : 'text-slate-400'}`}>{labelRight}</span>
    </div>
  );
}

// Legend Component
function Legend() {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Legend</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-2">Card Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-xs text-slate-300">Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-slate-300">Developing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs text-slate-300">Early Stage</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Trend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">Improving</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">Attention</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Practice Pills</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-300">At target</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-300">Close</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-300">Behind</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Target Indicator</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-600 ring-2 ring-white/50" />
              <span className="text-xs text-slate-300">Target level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-300" />
              <span className="text-xs text-slate-300">Target met</span>
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
  maturityScale,
  onUpdatePractice,
  onAddPractice,
  onDeletePractice,
  onUpdateMaturityScale,
  onClose
}) {
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newPracticeType, setNewPracticeType] = useState('maturity');
  const [activeTab, setActiveTab] = useState('practices');

  const handleAddPractice = () => {
    if (newPracticeName.trim()) {
      onAddPractice(newPracticeName.trim(), newPracticeType);
      setNewPracticeName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('practices')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'practices'
                ? 'text-cyber-400 border-b-2 border-cyber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Practices
          </button>
          <button
            onClick={() => setActiveTab('scale')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'scale'
                ? 'text-cyber-400 border-b-2 border-cyber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Maturity Scale
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'practices' && (
            <div className="space-y-4">
              {/* Add new practice */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Add New Practice</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPracticeName}
                    onChange={(e) => setNewPracticeName(e.target.value)}
                    placeholder="Practice name..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-cyber-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPractice()}
                  />
                  <select
                    value={newPracticeType}
                    onChange={(e) => setNewPracticeType(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="maturity">Maturity</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                  <button
                    onClick={handleAddPractice}
                    disabled={!newPracticeName.trim()}
                    className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Practice list */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">
                  Practices ({Object.keys(practices).length})
                </h3>
                <div className="space-y-2">
                  {Object.entries(practices).map(([id, practice]) => (
                    <div key={id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        practice.type === 'boolean' ? 'bg-cyan-500' : 'bg-purple-500'
                      }`} />
                      <input
                        type="text"
                        value={practice.name}
                        onChange={(e) => onUpdatePractice(id, 'name', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm focus:border-cyber-500 outline-none"
                      />
                      {practice.type === 'maturity' ? (
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-slate-400" />
                          <select
                            value={practice.target || 3}
                            onChange={(e) => onUpdatePractice(id, 'target', parseInt(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm w-16"
                          >
                            {maturityScale.slice(1).map((level) => (
                              <option key={level.level} value={level.level}>
                                {level.level}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 px-2">Yes/No</span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${practice.name}"?`)) {
                            onDeletePractice(id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center gap-6 text-xs text-slate-400">
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
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scale' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Customize the labels for your maturity scale. Level 0 means "not started".
              </p>

              <div className="space-y-2">
                {maturityScale.map((level, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
                      {level.level}
                    </div>
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => onUpdateMaturityScale(idx, 'label', e.target.value)}
                      placeholder="Level label..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-cyber-500 outline-none"
                    />
                    <input
                      type="text"
                      value={level.short}
                      onChange={(e) => onUpdateMaturityScale(idx, 'short', e.target.value)}
                      placeholder="Short"
                      maxLength={2}
                      className="w-12 bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-center focus:border-cyber-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Pills Preview */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Preview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">At target (3/3):</span>
                    <MaturityPills current={3} target={3} scale={maturityScale} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Close to target (2/3):</span>
                    <MaturityPills current={2} target={3} scale={maturityScale} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Behind target (1/4):</span>
                    <MaturityPills current={1} target={4} scale={maturityScale} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyber-500 hover:bg-cyber-600 rounded text-sm font-medium"
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
        store.importData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header - Fixed alignment with flex sections */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Left section - Logo (fixed width) */}
            <button onClick={goHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyber-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left hidden sm:block">
                <h1 className="font-bold text-xl">CyberDash</h1>
                <p className="text-xs text-slate-400">{monthData.reportingPeriod}</p>
              </div>
            </button>

            {/* Center section - Toggle (grows to fill space, centered) */}
            <div className="flex-1 flex justify-center">
              <ToggleSwitch
                checked={editMode}
                onChange={setEditMode}
                labelLeft="View"
                labelRight="Edit"
              />
            </div>

            {/* Right section - Actions (fixed width) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Month Selector */}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={store.currentMonth}
                  onChange={(e) => store.setCurrentMonth(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm w-24"
                >
                  {store.months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={openNewMonthModal}
                  className={`p-1.5 bg-slate-800 hover:bg-slate-700 rounded ${!editMode ? 'invisible' : ''}`}
                  title="New Month"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-700 mx-1" />

              {/* Action buttons - always rendered, some invisible in view mode */}
              <button
                onClick={store.exportData}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
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
                className={`p-1.5 bg-slate-800 hover:bg-slate-700 rounded ${!editMode ? 'invisible' : ''}`}
                title="Import"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-1.5 bg-slate-800 hover:bg-slate-700 rounded ${!editMode ? 'invisible' : ''}`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset all data to defaults?')) store.resetData();
                }}
                className={`p-1.5 bg-slate-800 hover:bg-red-900 rounded ${!editMode ? 'invisible' : ''}`}
                title="Reset"
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
          maturityScale={store.maturityScale}
          onUpdatePractice={store.updatePractice}
          onAddPractice={store.addPractice}
          onDeletePractice={store.deletePractice}
          onUpdateMaturityScale={store.updateMaturityScale}
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
          <button onClick={goHome} className="text-slate-400 hover:text-white transition-colors">
            Overview
          </button>
          {currentBU && (
            <>
              <ChevronRight className="w-5 h-5 text-slate-600" />
              <button
                onClick={() => setSelectedSquad(null)}
                className={`transition-colors ${currentSquad ? 'text-slate-400 hover:text-white' : 'text-white font-semibold'}`}
              >
                {currentBU.name}
              </button>
            </>
          )}
          {currentSquad && (
            <>
              <ChevronRight className="w-5 h-5 text-slate-600" />
              <span className="text-white font-semibold">{currentSquad.name}</span>
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
              {editMode ? (
                <EditableSelect
                  value={currentSquad.status || 'red'}
                  onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'status', v)}
                  options={[
                    { value: 'green', label: '🟢 Green - Strong' },
                    { value: 'amber', label: '🟡 Amber - Developing' },
                    { value: 'red', label: '🔴 Red - Early Stage' },
                  ]}
                />
              ) : (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${statusBg[currentSquad.status || 'red']}`}>
                  {statusLabels[currentSquad.status || 'red']}
                </div>
              )}
            </div>

            {/* Practices */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Security Practices</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {getAdoptedCount(currentSquad.practices, store.practices).meetsTarget}/
                    {getAdoptedCount(currentSquad.practices, store.practices).total} at target
                  </span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(store.practices).map(([key, def]) => {
                  const value = currentSquad.practices[key];
                  const target = def.target || (def.type === 'boolean' ? true : 3);
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
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
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Monthly Update</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">This Period</label>
                  {!editMode ? (
                    <p className="text-sm">{currentSquad.monthlyUpdate.summary || <span className="text-slate-500 italic">No update</span>}</p>
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
                  <label className="block text-sm text-slate-400 mb-1">Next Period</label>
                  {!editMode ? (
                    <p className="text-sm">{currentSquad.monthlyUpdate.nextPeriod || <span className="text-slate-500 italic">No plans</span>}</p>
                  ) : (
                    <EditableTextarea
                      value={currentSquad.monthlyUpdate.nextPeriod}
                      onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.nextPeriod', v)}
                      placeholder="Plans for next month..."
                      className="text-sm"
                    />
                  )}
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Trend</label>
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
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Key Metric</label>
                    {!editMode ? (
                      <p className="text-sm">
                        <span className="text-slate-300">{currentSquad.monthlyUpdate.keyMetric.label}:</span>{' '}
                        <span className="text-cyber-400 font-medium">{currentSquad.monthlyUpdate.keyMetric.value}</span>
                        <span className="text-slate-500"> / {currentSquad.monthlyUpdate.keyMetric.target}</span>
                      </p>
                    ) : (
                      <div className="flex gap-2 items-center flex-wrap">
                        <EditableText
                          value={currentSquad.monthlyUpdate.keyMetric.label}
                          onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.keyMetric.label', v)}
                          placeholder="Label"
                          className="text-sm"
                        />
                        <span className="text-slate-500">:</span>
                        <EditableText
                          value={currentSquad.monthlyUpdate.keyMetric.value}
                          onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.keyMetric.value', v)}
                          placeholder="Value"
                          className="text-sm"
                        />
                        <span className="text-slate-500">/</span>
                        <EditableText
                          value={currentSquad.monthlyUpdate.keyMetric.target}
                          onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.keyMetric.target', v)}
                          placeholder="Target"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
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
                const { adopted, total, meetsTarget } = getAdoptedCount(squad.practices, store.practices);
                const trend = trendConfig[squad.monthlyUpdate.trend];
                return (
                  <Tooltip key={squad.id} squad={squad} practices={store.practices}>
                    <div
                      onClick={() => setSelectedSquad(squad.id)}
                      className={`${statusBg[status]} ${statusBgHover[status]} rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-lg leading-tight">{squad.name}</h3>
                        <div className={`p-1.5 rounded-full ${trend.bgColor}`}>
                          <trend.Icon className={`w-4 h-4 ${trend.color}`} />
                        </div>
                      </div>

                      {/* Pills Summary Row */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Object.entries(store.practices).map(([key, def]) => {
                          const value = squad.practices[key];
                          const target = def.target || (def.type === 'boolean' ? true : 3);
                          if (def.type === 'boolean') {
                            return (
                              <div
                                key={key}
                                className={`w-3 h-3 rounded-full ${
                                  value ? 'bg-emerald-300' : 'bg-white/20'
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
                                met ? 'bg-emerald-300' : close ? 'bg-amber-300' : 'bg-white/20'
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
                        {squad.monthlyUpdate.keyMetric.value && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white/90">{squad.monthlyUpdate.keyMetric.value}</div>
                            <div className="text-white/50 text-xs">{squad.monthlyUpdate.keyMetric.label}</div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/20">
                        <span className="text-white/70 text-sm">{trend.label}</span>
                        <span className="text-white/50 text-xs">{statusLabels[status]}</span>
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {currentBU.squads.length === 0 && (
              <p className="text-center text-slate-500 py-8">No squads yet. {editMode && 'Add one to get started.'}</p>
            )}

            <Legend />

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
                const hasRed = squadStatuses.includes('red');
                const hasAmber = squadStatuses.includes('amber');
                const dominantStatus = hasRed ? 'red' : hasAmber ? 'amber' : 'green';

                const totalAdopted = bu.squads.reduce((sum, s) => {
                  return sum + getAdoptedCount(s.practices, store.practices).adopted;
                }, 0);
                const totalPractices = bu.squads.reduce((sum, s) => {
                  return sum + getAdoptedCount(s.practices, store.practices).total;
                }, 0);

                const greenCount = squadStatuses.filter((s) => s === 'green').length;
                const amberCount = squadStatuses.filter((s) => s === 'amber').length;
                const redCount = squadStatuses.filter((s) => s === 'red').length;

                return (
                  <div
                    key={bu.id}
                    onClick={() => setSelectedBU(bu.id)}
                    className={`${statusBg[dominantStatus]} ${statusBgHover[dominantStatus]} rounded-xl p-6 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]`}
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
                        <div className="text-3xl font-bold text-white/90">{totalAdopted}<span className="text-lg text-white/50">/{totalPractices}</span></div>
                        <div className="text-white/50 text-sm">Practices</div>
                      </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="flex gap-4 pt-4 border-t border-white/20">
                      {greenCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-300" />
                          <span className="text-white font-bold">{greenCount}</span>
                          <span className="text-white/50 text-xs">strong</span>
                        </div>
                      )}
                      {amberCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-300" />
                          <span className="text-white font-bold">{amberCount}</span>
                          <span className="text-white/50 text-xs">developing</span>
                        </div>
                      )}
                      {redCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-300" />
                          <span className="text-white font-bold">{redCount}</span>
                          <span className="text-white/50 text-xs">early</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {monthData.businessUnits.length === 0 && (
              <p className="text-center text-slate-500 py-8">No business units yet. {editMode && 'Add one to get started.'}</p>
            )}

            <Legend />
          </div>
        )}
      </main>
    </div>
  );
}
