import { useState, useRef, useMemo } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload,
  Calendar, Users, ChevronRight, RotateCcw,
  Info, ArrowUpRight, ArrowDownRight, Minus,
  Settings, X
} from 'lucide-react';
import { useStore } from './store/useStore';
import {
  EditableText,
  EditableTextarea,
  EditableSelect,
  EditableToggle,
  EditableMaturity,
} from './components/Editable';

// Count adopted practices
function getAdoptedCount(practices, definitions) {
  let adopted = 0;
  let total = 0;
  Object.entries(practices).forEach(([key, value]) => {
    const def = definitions[key];
    if (!def) return;
    total++;
    if (def.type === 'boolean') {
      if (value) adopted++;
    } else {
      if (value >= 3) adopted++;
    }
  });
  return { adopted, total };
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-2">Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-xs text-slate-300">Green - Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-slate-300">Amber - Developing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs text-slate-300">Red - Early Stage</span>
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
              <span className="text-xs text-slate-300">Needs Attention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Modal Component
function SettingsModal({ practices, onUpdatePractice, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Practice Names</h3>
            <p className="text-xs text-slate-500 mb-4">Customize the display names for security practices</p>
            <div className="space-y-2">
              {Object.entries(practices).map(([id, practice]) => (
                <div key={id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${practice.type === 'boolean' ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                  <input
                    type="text"
                    value={practice.name}
                    onChange={(e) => onUpdatePractice(id, 'name', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm focus:border-cyber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 w-16">
                    {practice.type === 'boolean' ? 'Yes/No' : 'Level 1-4'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Practice Types</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Boolean (Yes/No)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Maturity (1-4 scale)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
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
                {editMode && (
                  <button
                    onClick={openNewMonthModal}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                    title="New Month"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-slate-700 mx-1" />

              {/* Action buttons */}
              <button
                onClick={store.exportData}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>

              {editMode && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                    title="Import"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset all data to defaults?')) store.resetData();
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-red-900 rounded"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          practices={store.practices}
          onUpdatePractice={store.updatePractice}
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
                <span className="text-sm text-slate-400">
                  {getAdoptedCount(currentSquad.practices, store.practices).adopted}/
                  {getAdoptedCount(currentSquad.practices, store.practices).total} adopted
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(store.practices).map(([key, def]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    {!editMode ? (
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          def.type === 'boolean'
                            ? (currentSquad.practices[key] ? 'bg-emerald-500' : 'bg-red-500')
                            : (currentSquad.practices[key] >= 3 ? 'bg-emerald-500' : currentSquad.practices[key] >= 2 ? 'bg-amber-500' : 'bg-red-500')
                        }`} />
                        <span className="text-sm">{def.name}</span>
                        {def.type === 'maturity' && (
                          <span className="text-xs text-slate-400">({currentSquad.practices[key]}/4)</span>
                        )}
                      </div>
                    ) : def.type === 'boolean' ? (
                      <EditableToggle
                        value={currentSquad.practices[key]}
                        onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, `practices.${key}`, v)}
                        label={def.name}
                      />
                    ) : (
                      <EditableMaturity
                        value={currentSquad.practices[key]}
                        onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, `practices.${key}`, v)}
                        label={def.name}
                      />
                    )}
                  </div>
                ))}
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
                const { adopted, total } = getAdoptedCount(squad.practices, store.practices);
                const trend = trendConfig[squad.monthlyUpdate.trend];
                return (
                  <Tooltip key={squad.id} squad={squad} practices={store.practices}>
                    <div
                      onClick={() => setSelectedSquad(squad.id)}
                      className={`${statusBg[status]} ${statusBgHover[status]} rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-white text-lg leading-tight">{squad.name}</h3>
                        <div className={`p-1.5 rounded-full ${trend.bgColor}`}>
                          <trend.Icon className={`w-4 h-4 ${trend.color}`} />
                        </div>
                      </div>

                      {/* Big Stats */}
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className="text-4xl font-black text-white leading-none">{adopted}</div>
                          <div className="text-white/50 text-xs mt-1">of {total} practices</div>
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
