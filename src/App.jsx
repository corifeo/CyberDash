import { useState, useRef, useMemo } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload,
  Calendar, Users, TrendingUp, TrendingDown, Minus,
  ChevronRight, RotateCcw, Eye, Pencil
} from 'lucide-react';
import { useStore } from './store/useStore';
import {
  EditableText,
  EditableTextarea,
  EditableSelect,
  EditableToggle,
  EditableMaturity,
} from './components/Editable';

// Calculate RAG status and score
function getStatusAndScore(practices, definitions) {
  let score = 0, max = 0;
  Object.entries(practices).forEach(([key, value]) => {
    const def = definitions[key];
    if (!def) return;
    if (def.type === 'boolean') {
      score += value ? 1 : 0;
      max += 1;
    } else {
      score += value / 4;
      max += 1;
    }
  });
  const pct = max > 0 ? (score / max) * 100 : 0;
  let status = 'red';
  if (pct >= 75) status = 'green';
  else if (pct >= 40) status = 'amber';
  return { status, score: Math.round(pct) };
}

// RAG background colors for cards
const statusBg = {
  green: 'bg-emerald-600/90',
  amber: 'bg-amber-600/90',
  red: 'bg-red-600/90',
};

const statusBgHover = {
  green: 'hover:bg-emerald-600',
  amber: 'hover:bg-amber-600',
  red: 'hover:bg-red-600',
};

const trendIcons = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendLabels = {
  improving: 'Improving',
  stable: 'Stable',
  declining: 'Needs Attention',
};

// Get next month suggestion based on current month or system date
function getNextMonthSuggestion(currentMonth) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12

  // Parse current month key (e.g., "2025-01")
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  // If current data month is in the past or current, suggest current system month
  // Otherwise suggest next month after data month
  let nextYear, nextMonth;

  if (year < currentYear || (year === currentYear && month < currentMonthNum)) {
    // Data is old, suggest current month
    nextYear = currentYear;
    nextMonth = currentMonthNum;
  } else {
    // Suggest next month after current data
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
  const { status, score } = getStatusAndScore(squad.practices, practices);

  const adoptedCount = Object.entries(squad.practices).filter(([key, value]) => {
    const def = practices[key];
    if (!def) return false;
    return def.type === 'boolean' ? value : value >= 3;
  }).length;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 p-4 bg-slate-900 border border-slate-600 rounded-lg shadow-xl text-sm">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Overall Score</span>
              <span className="font-bold text-white">{score}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Practices Adopted</span>
              <span className="text-white">{adoptedCount}/{Object.keys(practices).length}</span>
            </div>
            {squad.monthlyUpdate.keyMetric.label && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{squad.monthlyUpdate.keyMetric.label}</span>
                <span className="text-cyber-400">{squad.monthlyUpdate.keyMetric.value} / {squad.monthlyUpdate.keyMetric.target}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700">
              <p className="text-slate-400 text-xs mb-1">This Period:</p>
              <p className="text-white text-xs">{squad.monthlyUpdate.summary || 'No update'}</p>
            </div>
            {squad.monthlyUpdate.nextPeriod && (
              <div>
                <p className="text-slate-400 text-xs mb-1">Next Period:</p>
                <p className="text-white text-xs">{squad.monthlyUpdate.nextPeriod}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const store = useStore();
  const [selectedBU, setSelectedBU] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [viewOnly, setViewOnly] = useState(true); // Default to view-only
  const fileInputRef = useRef(null);

  // Auto-suggest next month
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">CyberDash</h1>
                <p className="text-xs text-slate-400">{monthData.reportingPeriod}</p>
              </div>
            </div>

            {/* View/Edit Toggle */}
            <button
              onClick={() => setViewOnly(!viewOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewOnly
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-cyber-500 text-white'
              }`}
            >
              {viewOnly ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              {viewOnly ? 'View Mode' : 'Edit Mode'}
            </button>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={store.currentMonth}
                onChange={(e) => store.setCurrentMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm"
              >
                {store.months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {!viewOnly && (
                <button
                  onClick={openNewMonthModal}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                  title="New Month"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={store.exportData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm"
                title="Export"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {!viewOnly && (
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm"
                    title="Import"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
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
                  placeholder="2025-02"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Display Label</label>
                <input
                  type="text"
                  value={newMonthLabel}
                  onChange={(e) => setNewMonthLabel(e.target.value)}
                  placeholder="February 2025"
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <button onClick={() => { setSelectedBU(null); setSelectedSquad(null); }} className="hover:text-white">
            Overview
          </button>
          {currentBU && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button onClick={() => setSelectedSquad(null)} className="hover:text-white">
                {currentBU.name}
              </button>
            </>
          )}
          {currentSquad && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{currentSquad.name}</span>
            </>
          )}
        </div>

        {/* Squad Detail View */}
        {currentSquad && currentBU ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {viewOnly ? currentSquad.name : (
                  <EditableText
                    value={currentSquad.name}
                    onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'name', v)}
                  />
                )}
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusBg[getStatusAndScore(currentSquad.practices, store.practices).status]}`}>
                {getStatusAndScore(currentSquad.practices, store.practices).score}%
              </div>
            </div>

            {/* Practices */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Security Practices</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(store.practices).map(([key, def]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    {viewOnly ? (
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
                  {viewOnly ? (
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
                  {viewOnly ? (
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
                    {viewOnly ? (
                      <div className="flex items-center gap-2">
                        {(() => { const TrendIcon = trendIcons[currentSquad.monthlyUpdate.trend]; return <TrendIcon className="w-4 h-4" />; })()}
                        <span className="text-sm">{trendLabels[currentSquad.monthlyUpdate.trend]}</span>
                      </div>
                    ) : (
                      <EditableSelect
                        value={currentSquad.monthlyUpdate.trend}
                        onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.trend', v)}
                        options={[
                          { value: 'improving', label: 'Improving' },
                          { value: 'stable', label: 'Stable' },
                          { value: 'declining', label: 'Declining' },
                        ]}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Key Metric</label>
                    {viewOnly ? (
                      <p className="text-sm">
                        <span className="text-slate-300">{currentSquad.monthlyUpdate.keyMetric.label}:</span>{' '}
                        <span className="text-cyber-400">{currentSquad.monthlyUpdate.keyMetric.value}</span>
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

            {!viewOnly && (
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
                {viewOnly ? currentBU.name : (
                  <EditableText
                    value={currentBU.name}
                    onChange={(v) => store.updateBusinessUnit(currentBU.id, v)}
                  />
                )}
              </h2>
              {!viewOnly && (
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
                const { status, score } = getStatusAndScore(squad.practices, store.practices);
                const TrendIcon = trendIcons[squad.monthlyUpdate.trend];
                return (
                  <Tooltip key={squad.id} squad={squad} practices={store.practices}>
                    <div
                      onClick={() => setSelectedSquad(squad.id)}
                      className={`${statusBg[status]} ${statusBgHover[status]} rounded-xl p-4 cursor-pointer transition-colors shadow-lg`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white">{squad.name}</h3>
                        <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full">{score}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-white/80">
                          <TrendIcon className="w-4 h-4" />
                          <span>{trendLabels[squad.monthlyUpdate.trend]}</span>
                        </div>
                        {squad.monthlyUpdate.keyMetric.value && (
                          <span className="text-white/90 font-medium">
                            {squad.monthlyUpdate.keyMetric.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {currentBU.squads.length === 0 && (
              <p className="text-center text-slate-500 py-8">No squads yet. {!viewOnly && 'Add one to get started.'}</p>
            )}

            {!viewOnly && (
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
              {!viewOnly && (
                <button
                  onClick={store.addBusinessUnit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyber-500 hover:bg-cyber-600 rounded text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Business Unit
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {monthData.businessUnits.map((bu) => {
                const squadStats = bu.squads.map((s) => getStatusAndScore(s.practices, store.practices));
                const hasRed = squadStats.some(s => s.status === 'red');
                const hasAmber = squadStats.some(s => s.status === 'amber');
                const dominantStatus = hasRed ? 'red' : hasAmber ? 'amber' : 'green';
                const avgScore = squadStats.length > 0
                  ? Math.round(squadStats.reduce((a, b) => a + b.score, 0) / squadStats.length)
                  : 0;

                return (
                  <div
                    key={bu.id}
                    onClick={() => setSelectedBU(bu.id)}
                    className={`${statusBg[dominantStatus]} ${statusBgHover[dominantStatus]} rounded-xl p-5 cursor-pointer transition-colors shadow-lg`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{bu.name}</h3>
                      <span className="text-sm bg-black/30 px-2 py-0.5 rounded-full">{avgScore}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {bu.squads.length} squads
                      </div>
                      <div className="flex gap-2">
                        {squadStats.filter((s) => s.status === 'green').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-300" />
                            {squadStats.filter((s) => s.status === 'green').length}
                          </span>
                        )}
                        {squadStats.filter((s) => s.status === 'amber').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-300" />
                            {squadStats.filter((s) => s.status === 'amber').length}
                          </span>
                        )}
                        {squadStats.filter((s) => s.status === 'red').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-300" />
                            {squadStats.filter((s) => s.status === 'red').length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {monthData.businessUnits.length === 0 && (
              <p className="text-center text-slate-500 py-8">No business units yet. {!viewOnly && 'Add one to get started.'}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
