import { useState, useRef } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload, ChevronDown,
  Calendar, Users, TrendingUp, TrendingDown, Minus,
  CheckCircle2, XCircle, ChevronRight, RotateCcw
} from 'lucide-react';
import { useStore } from './store/useStore';
import {
  EditableText,
  EditableTextarea,
  EditableSelect,
  EditableToggle,
  EditableMaturity,
} from './components/Editable';

// Calculate RAG status
function getStatus(practices, definitions) {
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
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return 'green';
  if (pct >= 0.4) return 'amber';
  return 'red';
}

const statusColors = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const trendIcons = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendColors = {
  improving: 'text-emerald-400',
  stable: 'text-slate-400',
  declining: 'text-amber-400',
};

export default function App() {
  const store = useStore();
  const [selectedBU, setSelectedBU] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [showNewMonth, setShowNewMonth] = useState(false);
  const [newMonthKey, setNewMonthKey] = useState('');
  const [newMonthLabel, setNewMonthLabel] = useState('');
  const fileInputRef = useRef(null);

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
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
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
              <button
                onClick={() => setShowNewMonth(true)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded"
                title="New Month"
              >
                <Plus className="w-4 h-4" />
              </button>
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
            </div>
          </div>
        </div>
      </header>

      {/* New Month Modal */}
      {showNewMonth && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Month</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Month Key (e.g., 2025-02)</label>
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
                <EditableText
                  value={currentSquad.name}
                  onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'name', v)}
                />
              </h2>
              <div className={`w-4 h-4 rounded-full ${statusColors[getStatus(currentSquad.practices, store.practices)]}`} />
            </div>

            {/* Practices */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Security Practices</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(store.practices).map(([key, def]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    {def.type === 'boolean' ? (
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
                  <EditableTextarea
                    value={currentSquad.monthlyUpdate.summary}
                    onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.summary', v)}
                    placeholder="What was accomplished this month..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Next Period</label>
                  <EditableTextarea
                    value={currentSquad.monthlyUpdate.nextPeriod}
                    onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.nextPeriod', v)}
                    placeholder="Plans for next month..."
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Trend</label>
                    <EditableSelect
                      value={currentSquad.monthlyUpdate.trend}
                      onChange={(v) => store.updateSquad(currentBU.id, currentSquad.id, 'monthlyUpdate.trend', v)}
                      options={[
                        { value: 'improving', label: 'Improving' },
                        { value: 'stable', label: 'Stable' },
                        { value: 'declining', label: 'Declining' },
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Key Metric</label>
                    <div className="flex gap-2">
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
                  </div>
                </div>
              </div>
            </div>

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
          </div>
        ) : currentBU ? (
          /* Business Unit View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                <EditableText
                  value={currentBU.name}
                  onChange={(v) => store.updateBusinessUnit(currentBU.id, v)}
                />
              </h2>
              <button
                onClick={() => store.addSquad(currentBU.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyber-500 hover:bg-cyber-600 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Squad
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBU.squads.map((squad) => {
                const status = getStatus(squad.practices, store.practices);
                const TrendIcon = trendIcons[squad.monthlyUpdate.trend];
                return (
                  <div
                    key={squad.id}
                    onClick={() => setSelectedSquad(squad.id)}
                    className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">{squad.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {squad.monthlyUpdate.summary || 'No update yet'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className={`flex items-center gap-1 ${trendColors[squad.monthlyUpdate.trend]}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="capitalize">{squad.monthlyUpdate.trend}</span>
                      </div>
                      {squad.monthlyUpdate.keyMetric.value && (
                        <span className="text-cyber-400">
                          {squad.monthlyUpdate.keyMetric.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {currentBU.squads.length === 0 && (
              <p className="text-center text-slate-500 py-8">No squads yet. Add one to get started.</p>
            )}

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
          </div>
        ) : (
          /* Overview */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Business Units</h2>
              <button
                onClick={store.addBusinessUnit}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyber-500 hover:bg-cyber-600 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Business Unit
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {monthData.businessUnits.map((bu) => {
                const statuses = bu.squads.map((s) => getStatus(s.practices, store.practices));
                const hasRed = statuses.includes('red');
                const hasAmber = statuses.includes('amber');
                const dominantStatus = hasRed ? 'red' : hasAmber ? 'amber' : 'green';

                return (
                  <div
                    key={bu.id}
                    onClick={() => setSelectedBU(bu.id)}
                    className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-xl p-5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold">{bu.name}</h3>
                      <div className={`w-4 h-4 rounded-full ${statusColors[dominantStatus]}`} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {bu.squads.length} squads
                      </div>
                      <div className="flex gap-1">
                        {statuses.filter((s) => s === 'green').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {statuses.filter((s) => s === 'green').length}
                          </span>
                        )}
                        {statuses.filter((s) => s === 'amber').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {statuses.filter((s) => s === 'amber').length}
                          </span>
                        )}
                        {statuses.filter((s) => s === 'red').length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            {statuses.filter((s) => s === 'red').length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {monthData.businessUnits.length === 0 && (
              <p className="text-center text-slate-500 py-8">No business units yet. Add one to get started.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
