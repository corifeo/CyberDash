import { useState, useRef, useMemo } from 'react';
import {
  Shield, Plus, Trash2, Download, Upload,
  Calendar, Users, ChevronRight, RotateCcw,
  Info, ArrowUpRight, ArrowDownRight, Minus,
  Settings, X, Target, Check, Sun, Moon,
  ChevronUp, ChevronDown, Eye, EyeOff, Scale, Star, Database
} from 'lucide-react';
import { useStore } from './store/useStore';
import {
  EditableText,
  EditableTextarea,
  EditableSelect,
  EditableToggle,
  EditableMaturity,
} from './components/Editable';
import {
  trendConfig,
  getStatusInfo,
  getAdoptedCount,
  ToggleSwitch,
  TeamTooltip as Tooltip,
  Legend,
} from './components/Dashboard';
import {
  getMaxMaturityLevel,
  getMaturityStatus,
  calculateAutoTrend,
  calculateBUAutoTrend,
  getPracticeAdoption,
  calculateAutoRagStatus,
  getEffectiveSquadStatus,
  getWeightedBuStatus,
  getNextMonthSuggestion,
} from './utils/calculations';

// Default hex colors for status (used in settings modal)
const DEFAULT_HEX_COLORS = {
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
  none: '#64748b',
};

// Stacked Pills Component - Option E visualization
function MaturityPills({ current, target, scale, compact = false }) {
  // Handle N/A value (-1)
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
  // Handle N/A value
  if (value === 'na') {
    return (
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 italic`}>N/A</span>
      </div>
    );
  }

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

// Settings Modal Component
function SettingsModal({
  practices,
  orderedPractices,
  maturityScale,
  months,
  currentMonth,
  colorTheme,
  colorThemes,
  ragColors,
  thresholds,
  statusRules,
  darkMode = true,
  onUpdatePractice,
  onAddPractice,
  onDeletePractice,
  onReorderPractice,
  onUpdateMaturityScale,
  onDeleteMonth,
  onSetColorPreset,
  onUpdateRagColor,
  onUpdateThreshold,
  onUpdateStatusRule,
  onExportAllArchive,
  onImportAllArchive,
  onExportSettings,
  onImportSettings,
  onResetData,
  onMigratePracticeIds,
  hasTimestampIds,
  onLoadTestData,
  onClose
}) {
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newPracticeType, setNewPracticeType] = useState('maturity');
  const [activeTab, setActiveTab] = useState('practices');
  const [showPracticeGuide, setShowPracticeGuide] = useState(false);
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
                    <div key={practice.id} className={`${st.cardBgAlt} rounded-lg p-3 space-y-2`}>
                      {/* Main row: reorder, name, key controls */}
                      <div className="flex items-center gap-2">
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
                        {/* Color picker */}
                        <input
                          type="color"
                          value={practice.color || (practice.type === 'boolean' ? '#06b6d4' : '#a855f7')}
                          onChange={(e) => onUpdatePractice(practice.id, 'color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent flex-shrink-0"
                          title="Practice color"
                        />
                        <input
                          type="text"
                          value={practice.name}
                          onChange={(e) => onUpdatePractice(practice.id, 'name', e.target.value)}
                          className={`flex-1 ${st.input} border rounded px-3 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                        />
                        {/* Important toggle */}
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
                        {/* Type selector */}
                        <select
                          value={practice.type}
                          onChange={(e) => onUpdatePractice(practice.id, 'type', e.target.value)}
                          className={`${st.input} border rounded px-2 py-1 text-xs w-20`}
                        >
                          <option value="maturity">Maturity</option>
                          <option value="boolean">Yes/No</option>
                        </select>
                        {/* Target */}
                        <div className="flex items-center gap-1">
                          <Target className={`w-3 h-3 ${st.textHint}`} />
                          {practice.type === 'maturity' ? (
                            <select
                              value={practice.target || 3}
                              onChange={(e) => onUpdatePractice(practice.id, 'target', parseInt(e.target.value))}
                              className={`${st.input} border rounded px-1 py-1 text-xs w-12`}
                            >
                              {maturityScale.filter(l => l.level > 0).map((level) => (
                                <option key={level.level} value={level.level}>
                                  {level.level}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={practice.target === false ? 'false' : 'true'}
                              onChange={(e) => onUpdatePractice(practice.id, 'target', e.target.value === 'true')}
                              className={`${st.input} border rounded px-1 py-1 text-xs w-14`}
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          )}
                        </div>
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
                      {/* Description row */}
                      <div className="pl-8">
                        <textarea
                          value={practice.description || ''}
                          onChange={(e) => onUpdatePractice(practice.id, 'description', e.target.value)}
                          placeholder="Add description..."
                          rows={2}
                          className={`w-full ${st.input} border rounded px-2 py-1.5 text-xs focus:border-cyber-500 outline-none resize-none`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className={`pt-4 border-t ${st.border}`}>
                <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${st.textHint}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-500 bg-gradient-to-br from-cyan-500 to-purple-500" />
                    Click to set color
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
                Customize the labels and descriptions for your maturity scale. Level 0 means "not started".
              </p>

              <div className="space-y-2">
                {maturityScale.map((level, idx) => (
                  <div key={idx} className={`${st.cardBgAlt} rounded-lg p-3 space-y-2`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${st.cardBg} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
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
                    <textarea
                      value={level.description || ''}
                      onChange={(e) => onUpdateMaturityScale(idx, 'description', e.target.value)}
                      placeholder="Description (shown on hover)..."
                      rows={2}
                      className={`w-full ${st.input} border rounded px-3 py-1.5 text-xs focus:border-cyber-500 outline-none resize-none`}
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

              {/* RAG Status Thresholds */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h4 className={`text-sm font-medium ${st.textMuted} mb-3`}>Status Thresholds</h4>
                <p className={`text-xs ${st.textDim} mb-4`}>
                  Configure the percentage thresholds and calculation rules for automatic status.
                  Choose different rules to factor in trends when calculating status.
                </p>

                {/* Team Thresholds */}
                <div className="mb-6">
                  <h5 className={`text-xs font-medium ${st.textMuted} mb-2`}>Team Status (% of practices at target)</h5>

                  {/* Team Rule Selector */}
                  <div className={`${st.cardBgAlt} rounded-lg p-3 mb-2`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm ${st.textMuted}`}>Calculation Rule:</span>
                      <select
                        value={thresholds?.team?.rule || 'percentage'}
                        onChange={(e) => onUpdateStatusRule('team', e.target.value)}
                        className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                      >
                        {statusRules && Object.values(statusRules).map(rule => (
                          <option key={rule.id} value={rule.id}>{rule.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className={`text-xs ${st.textDim}`}>
                      {statusRules?.[thresholds?.team?.rule || 'percentage']?.description || 'Status based on percentage of practices meeting target'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.green?.hex || '#059669' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Green</span>
                      <span className={`text-xs ${st.textDim}`}>≥</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={thresholds?.team?.green ?? 75}
                        onChange={(e) => onUpdateThreshold('team', 'green', e.target.value)}
                        className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                      />
                      <span className={`text-xs ${st.textDim}`}>%</span>
                    </div>
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.amber?.hex || '#d97706' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Amber</span>
                      <span className={`text-xs ${st.textDim}`}>≥</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={thresholds?.team?.amber ?? 40}
                        onChange={(e) => onUpdateThreshold('team', 'amber', e.target.value)}
                        className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                      />
                      <span className={`text-xs ${st.textDim}`}>%</span>
                    </div>
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Red</span>
                      <span className={`text-xs ${st.textDim}`}>Below amber</span>
                    </div>
                  </div>
                </div>

                {/* BU Thresholds */}
                <div>
                  <h5 className={`text-xs font-medium ${st.textMuted} mb-2`}>BU Status (% of green teams)</h5>

                  {/* BU Rule Selector */}
                  <div className={`${st.cardBgAlt} rounded-lg p-3 mb-2`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm ${st.textMuted}`}>Calculation Rule:</span>
                      <select
                        value={thresholds?.bu?.rule || 'percentage'}
                        onChange={(e) => onUpdateStatusRule('bu', e.target.value)}
                        className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                      >
                        {statusRules && Object.values(statusRules).map(rule => (
                          <option key={rule.id} value={rule.id}>{rule.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className={`text-xs ${st.textDim}`}>
                      {statusRules?.[thresholds?.bu?.rule || 'percentage']?.description || 'Status based on percentage of green teams'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.green?.hex || '#059669' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Green</span>
                      <span className={`text-xs ${st.textDim}`}>≥</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={thresholds?.bu?.green ?? 75}
                        onChange={(e) => onUpdateThreshold('bu', 'green', e.target.value)}
                        className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                      />
                      <span className={`text-xs ${st.textDim}`}>%</span>
                    </div>
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.amber?.hex || '#d97706' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Amber</span>
                      <span className={`text-xs ${st.textDim}`}>≥</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={thresholds?.bu?.amber ?? 40}
                        onChange={(e) => onUpdateThreshold('bu', 'amber', e.target.value)}
                        className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                      />
                      <span className={`text-xs ${st.textDim}`}>%</span>
                    </div>
                    <div className={`flex items-center gap-3 ${st.cardBgAlt} rounded-lg p-3`}>
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                      <span className={`text-sm ${st.textMuted} w-24`}>Red</span>
                      <span className={`text-xs ${st.textDim}`}>Below amber</span>
                    </div>
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

              {/* Color Themes */}
              <div>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-3`}>Color Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(colorThemes || {}).map(([name, theme]) => (
                    <button
                      key={name}
                      onClick={() => onSetColorPreset(name)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        colorTheme === name
                          ? `border-cyber-500 ${st.cardBg}`
                          : `${st.border} ${st.hover}`
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.green.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.amber.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.red.hex }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.none.hex }} />
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
                  {colorTheme === 'custom' && <span className="ml-2 text-xs text-cyber-400">(Custom)</span>}
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

              {/* Test Data */}
              <div className={`${st.cardBg} rounded-lg p-4`}>
                <h3 className={`text-sm font-medium ${st.textMuted} mb-2`}>Test Data</h3>
                <p className={`text-xs ${st.textDim} mb-3`}>
                  Load sample data with 4 Business Units and 22 teams for testing and demos.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Load test data? This will replace all current data with sample data (4 BUs, 22 teams).')) {
                      onLoadTestData();
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 ${st.cardBgAlt} ${st.hover} rounded text-sm`}
                >
                  <Database className="w-4 h-4" />
                  Load Test Data
                </button>
              </div>

              {/* Practice ID Migration */}
              {hasTimestampIds && (
                <div className={`${st.cardBg} rounded-lg p-4 border border-cyber-500/30`}>
                  <h3 className={`text-sm font-medium text-cyber-400 mb-2`}>Migrate Practice IDs</h3>
                  <p className={`text-xs ${st.textDim} mb-3`}>
                    Convert timestamp-based practice IDs to human-readable slugs based on practice names.
                    This makes exported data easier to read and manually edit.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Migrate all practice IDs to human-readable slugs?\n\nThis will convert IDs like "practice-1738350000000" to slugs like "threatModeling".\n\nThis is safe but cannot be undone.')) {
                        const count = onMigratePracticeIds();
                        alert(`Migrated ${count} practice ID(s) to human-readable slugs.`);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-cyber-500/20 hover:bg-cyber-500/30 text-cyber-400 border border-cyber-500/30 rounded text-sm w-full"
                  >
                    <Settings className="w-4 h-4" />
                    Migrate to Readable IDs
                  </button>
                </div>
              )}

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

  // Get previous month data for automatic trend calculation
  const previousMonthData = useMemo(() => {
    const sortedMonths = store.months; // Already sorted descending
    const currentIndex = sortedMonths.indexOf(store.currentMonth);
    if (currentIndex < 0 || currentIndex >= sortedMonths.length - 1) return null;
    const previousMonthKey = sortedMonths[currentIndex + 1];
    return store.data?.months?.[previousMonthKey] || null;
  }, [store.months, store.currentMonth, store.data]);

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
          colorTheme={store.colorTheme}
          colorThemes={store.colorThemes}
          ragColors={store.ragColors}
          thresholds={store.thresholds}
          statusRules={store.statusRules}
          darkMode={store.darkMode}
          onUpdatePractice={store.updatePractice}
          onAddPractice={store.addPractice}
          onDeletePractice={store.deletePractice}
          onReorderPractice={store.reorderPractice}
          onUpdateMaturityScale={store.updateMaturityScale}
          onDeleteMonth={store.deleteMonth}
          onSetColorPreset={store.setColorPreset}
          onUpdateRagColor={store.updateRagColor}
          onUpdateThreshold={store.updateThreshold}
          onUpdateStatusRule={store.updateStatusRule}
          onExportAllArchive={store.exportAllArchive}
          onImportAllArchive={store.importAllArchive}
          onExportSettings={store.exportSettings}
          onImportSettings={store.importSettings}
          onResetData={store.resetData}
          onMigratePracticeIds={store.migratePracticeIds}
          hasTimestampIds={store.hasTimestampIds}
          onLoadTestData={store.loadTestData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* New Month Modal */}
      {showNewMonth && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`${theme.card} border rounded-xl p-6 w-full max-w-md`}>
            <h2 className="text-lg font-semibold mb-4">Create New Month</h2>
            <p className={`text-sm ${theme.muted} mb-4`}>
              Creates a copy of current month's data with cleared update summaries.
            </p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm ${theme.muted} mb-1`}>Month Key</label>
                <input
                  type="text"
                  value={newMonthKey}
                  onChange={(e) => setNewMonthKey(e.target.value)}
                  className={`w-full ${theme.input} border rounded px-3 py-2`}
                />
              </div>
              <div>
                <label className={`block text-sm ${theme.muted} mb-1`}>Display Label</label>
                <input
                  type="text"
                  value={newMonthLabel}
                  onChange={(e) => setNewMonthLabel(e.target.value)}
                  className={`w-full ${theme.input} border rounded px-3 py-2`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewMonth(false)}
                  className={`flex-1 px-4 py-2 ${theme.mutedBg} ${theme.hover} rounded`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMonth}
                  className="flex-1 px-4 py-2 bg-cyber-500 hover:bg-cyber-600 rounded text-white"
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
                // Calculate trend for rule-based status calculation
                const maxLevel = getMaxMaturityLevel(store.maturityScale);
                const teamTrend = calculateAutoTrend(currentSquad, previousMonthData, currentBU.id, store.practices, maxLevel);
                const autoRag = calculateAutoRagStatus(currentSquad, store.practices, store.thresholds.team, teamTrend);
                const isAutoStatus = currentSquad.autoStatus !== false; // Default to auto
                const displayStatus = currentSquad.tracked === false ? 'none' : (isAutoStatus ? autoRag : (currentSquad.status || autoRag));
                const sc = getStatusInfo(store.ragColors, displayStatus);
                const adoptedInfo = getAdoptedCount(currentSquad.practices, store.practices);
                const ruleLabel = store.thresholds?.team?.rule !== 'percentage' ? ` [${store.statusRules?.[store.thresholds?.team?.rule]?.name || ''}]` : '';
                return (
                  <div
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                    style={{ backgroundColor: sc.hex }}
                    title={isAutoStatus ? `Auto: ${adoptedInfo.meetsTarget}/${adoptedInfo.total} at target${ruleLabel}` : 'Manual override'}
                  >
                    {sc.label}
                    {isAutoStatus && <span className="text-xs opacity-70">(auto)</span>}
                  </div>
                );
              })()}
            </div>

            {/* Team Settings - Type, Tracked & Weight (Edit mode only) */}
            {editMode && (
              <div className={`${theme.cardAlt} rounded-lg p-4`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Team Type */}
                  <div className="flex items-center gap-3">
                    <Users className={`w-4 h-4 ${theme.muted}`} />
                    <span className={`text-sm ${theme.muted}`}>Type:</span>
                    <select
                      value={currentSquad.teamType || 'squad'}
                      onChange={(e) => store.updateSquad(currentBU.id, currentSquad.id, 'teamType', e.target.value)}
                      className={`${theme.input} border rounded px-2 py-1 text-sm`}
                    >
                      {store.teamTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tracked Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const willBeTracked = currentSquad.tracked === false;
                        store.updateSquad(currentBU.id, currentSquad.id, 'tracked', willBeTracked);
                      }}
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
                  </div>

                  {/* Auto Status Toggle + Manual Override */}
                  {currentSquad.tracked !== false && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => store.updateSquad(currentBU.id, currentSquad.id, 'autoStatus', currentSquad.autoStatus === false)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:opacity-80 ${
                          currentSquad.autoStatus !== false
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : `${theme.card} ${theme.muted}`
                        }`}
                        title={currentSquad.autoStatus !== false
                          ? `Auto-calculated from practices (${getAdoptedCount(currentSquad.practices, store.practices).meetsTarget}/${getAdoptedCount(currentSquad.practices, store.practices).total} at target)`
                          : 'Click to enable auto status calculation'
                        }
                      >
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">Auto Status</span>
                      </button>
                      {currentSquad.autoStatus === false && (
                        <select
                          value={currentSquad.status || 'red'}
                          onChange={(e) => store.updateSquad(currentBU.id, currentSquad.id, 'status', e.target.value)}
                          className={`${theme.input} border rounded px-2 py-1.5 text-sm`}
                        >
                          <option value="green">🟢 {store.ragColors?.green?.label || 'Strong'}</option>
                          <option value="amber">🟡 {store.ragColors?.amber?.label || 'Developing'}</option>
                          <option value="red">🔴 {store.ragColors?.red?.label || 'Early Stage'}</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Weight */}
                  <div className="flex items-center gap-3">
                    <Scale className={`w-4 h-4 ${theme.muted}`} />
                    <span className={`text-sm ${theme.muted}`}>Weight:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={currentSquad.weight || 1}
                      onChange={(e) => store.updateSquad(currentBU.id, currentSquad.id, 'weight', parseFloat(e.target.value) || 1)}
                      className={`w-16 ${theme.input} border rounded px-2 py-1 text-sm text-center`}
                    />
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
                  {(() => {
                    const maxLevel = getMaxMaturityLevel(store.maturityScale);
                    const autoTrend = calculateAutoTrend(currentSquad, previousMonthData, currentBU.id, store.practices, maxLevel);
                    const trendInfo = trendConfig[autoTrend] || trendConfig.stable;
                    return (
                      <div className={`flex items-center gap-2 ${trendInfo.color}`}>
                        <trendInfo.Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{trendInfo.label}</span>
                        <span className={`text-xs ${theme.dim}`}>(auto)</span>
                      </div>
                    );
                  })()}
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
                  title="Add a new team (configure type after creation)"
                >
                  <Plus className="w-4 h-4" />
                  Add Team
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBU.squads.map((squad) => {
                // Calculate auto-trend first (needed for status calculation if using trend rules)
                const maxLevel = getMaxMaturityLevel(store.maturityScale);
                const autoTrend = calculateAutoTrend(squad, previousMonthData, currentBU.id, store.practices, maxLevel);
                // Use effective status (considering auto-status and trend for rule-based calculation)
                const displayStatus = getEffectiveSquadStatus(squad, store.practices, store.thresholds.team, autoTrend);
                const statusInfo = getStatusInfo(store.ragColors, displayStatus);
                const { adopted, total, meetsTarget } = getAdoptedCount(squad.practices || {}, store.practices);
                const trend = trendConfig[autoTrend] || trendConfig.stable;
                const teamType = store.teamTypes.find(t => t.id === (squad.teamType || 'squad'));
                return (
                  <Tooltip key={squad.id} squad={squad} practices={store.practices} ragColors={store.ragColors}>
                    <div
                      onClick={() => setSelectedSquad(squad.id)}
                      className="rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      style={{ backgroundColor: statusInfo.hex }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white/60 text-xs mb-0.5">{teamType?.label || 'Squad'}</p>
                          <h3 className="font-bold text-white text-lg leading-tight">{squad.name}</h3>
                        </div>
                        <div className="p-1.5 rounded-full bg-white/20">
                          <trend.Icon className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Pills Summary Row - white-based for contrast */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Object.entries(store.practices).map(([key, def]) => {
                          const value = squad.practices[key];
                          const target = def.target || (def.type === 'boolean' ? true : 3);
                          // Handle N/A values - show as grey/muted
                          const isNA = def.type === 'boolean' ? value === 'na' : value === -1;
                          if (isNA) {
                            return (
                              <div
                                key={key}
                                className="w-3 h-3 rounded-full bg-white/10 border border-white/20"
                                title={`${def.name}: N/A`}
                              />
                            );
                          }
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

            <Legend darkMode={store.darkMode} ragColors={store.ragColors} orderedPractices={store.orderedPractices} maturityScale={store.maturityScale} buThresholds={store.buThresholds} />

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
                // Get max maturity level from scale
                const maxLevel = getMaxMaturityLevel(store.maturityScale);

                // Calculate BU-level trend first (needed for status calculation if using trend rules)
                const buTrend = calculateBUAutoTrend(bu, previousMonthData, store.practices, maxLevel);

                // Use weighted calculation based on tracked squads and their weights
                // Pass buTrend and previous month data for trend-based rule calculations
                const { status: dominantStatus, details: statusDetails } = getWeightedBuStatus(
                  bu.squads,
                  store.practices,
                  store.thresholds.team,
                  store.thresholds.bu,
                  buTrend,
                  previousMonthData,
                  bu,
                  maxLevel
                );
                const statusInfo = getStatusInfo(store.ragColors, dominantStatus);

                // Calculate practice adoption across squads
                const practiceAdoption = getPracticeAdoption(bu.squads, store.practices);

                // Get team type label (default to 'Squad' for backward compatibility)
                const getTeamLabel = (squad) => {
                  const type = squad.teamType || 'squad';
                  const typeInfo = store.teamTypes.find(t => t.id === type);
                  return typeInfo?.label || 'Squad';
                };

                // Get automatic trend for a team (comparing with previous month)
                const getTeamAutoTrend = (squad) => {
                  return calculateAutoTrend(squad, previousMonthData, bu.id, store.practices, maxLevel);
                };

                // Get trend icon for a team (using simple characters to avoid emoji rendering)
                const getTrendIcon = (squad) => {
                  const trend = getTeamAutoTrend(squad);
                  if (trend === 'improving') return '▲';
                  if (trend === 'declining') return '▼';
                  return null;
                };

                return (
                  <div
                    key={bu.id}
                    onClick={() => setSelectedBU(bu.id)}
                    className="rounded-xl p-5 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    style={{ backgroundColor: statusInfo.hex }}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{bu.name}</h3>
                      <div className="px-2 py-1 rounded text-xs font-medium bg-white/20 text-white">
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* BU Trend Indicator */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      {buTrend === 'improving' && (
                        <span className="flex items-center gap-1 text-emerald-200" title="Improving compared to previous month">
                          <ArrowUpRight className="w-4 h-4" /> Improving
                        </span>
                      )}
                      {buTrend === 'stable' && (
                        <span className="flex items-center gap-1 text-white/60" title="Stable compared to previous month">
                          <Minus className="w-4 h-4" /> Stable
                        </span>
                      )}
                      {buTrend === 'declining' && (
                        <span className="flex items-center gap-1 text-amber-200" title="Declining compared to previous month">
                          <ArrowDownRight className="w-4 h-4" /> Declining
                        </span>
                      )}
                      <span className="text-white/40 text-xs">
                        ({bu.squads.filter(s => s.tracked !== false).length} teams)
                      </span>
                    </div>

                    {/* Teams Section - Team Status */}
                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">Team Status ({bu.squads.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {bu.squads.map((squad) => {
                          // Calculate trend first for rule-based status calculation
                          const squadTrend = getTeamAutoTrend(squad);
                          const squadStatus = getEffectiveSquadStatus(squad, store.practices, store.thresholds.team, squadTrend);
                          const squadInfo = getStatusInfo(store.ragColors, squadStatus);
                          const trendIcon = getTrendIcon(squad);
                          // Use white-based opacity for pills on colored background
                          const pillOpacity = squadStatus === 'green' ? 'bg-white/90' :
                                             squadStatus === 'amber' ? 'bg-white/70' :
                                             squadStatus === 'red' ? 'bg-white/40' : 'bg-white/20 border border-white/30';
                          return (
                            <div
                              key={squad.id}
                              className="group relative"
                            >
                              <div
                                className={`w-4 h-4 rounded-full cursor-help ${pillOpacity} flex items-center justify-center`}
                                title={`${squad.name} (${getTeamLabel(squad)}): ${squadInfo.label}`}
                              >
                                {trendIcon && <span className="text-[8px] leading-none">{trendIcon}</span>}
                              </div>
                              {/* Hover tooltip */}
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                <div className="font-medium">{squad.name}</div>
                                <div className="text-slate-400">{getTeamLabel(squad)} • {squadInfo.label} {trendIcon && `• ${getTeamAutoTrend(squad)}`}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Practices Section - Adoption Status */}
                    <div>
                      <p className="text-xs text-white/50 mb-2">Practice Adoption</p>
                      <div className="flex flex-wrap gap-1.5">
                        {store.orderedPractices.map((practice) => {
                          const adoption = practiceAdoption[practice.id] || { adopted: 0, partial: 0, notAdopted: 0, na: 0, total: 0 };
                          const allNA = adoption.total === 0;
                          const allAdopted = adoption.total > 0 && adoption.adopted === adoption.total;
                          const partiallyAdopted = !allAdopted && (adoption.adopted > 0 || adoption.partial > 0);
                          const noneAdopted = adoption.total > 0 && adoption.adopted === 0 && adoption.partial === 0;

                          return (
                            <div
                              key={practice.id}
                              className="group relative"
                            >
                              {/* Half-filled pill for partial adoption */}
                              <div
                                className="w-4 h-4 rounded-full cursor-help relative overflow-hidden"
                                title={`${practice.name}: ${adoption.adopted}/${adoption.total} adopted`}
                              >
                                {allNA ? (
                                  <div className="w-full h-full bg-white/10 border border-white/20 rounded-full" />
                                ) : allAdopted ? (
                                  <div className="w-full h-full bg-white/90 rounded-full" />
                                ) : partiallyAdopted ? (
                                  // Half-filled effect using gradient
                                  <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                      background: `linear-gradient(to top, rgba(255,255,255,0.8) ${Math.round((adoption.adopted / adoption.total) * 100)}%, rgba(255,255,255,0.25) ${Math.round((adoption.adopted / adoption.total) * 100)}%)`
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-white/25 rounded-full" />
                                )}
                              </div>
                              {/* Hover tooltip */}
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                <div className="font-medium">{practice.name}</div>
                                <div className="text-slate-400">
                                  {allNA ? 'N/A for all teams' : (
                                    <>
                                      {adoption.adopted}/{adoption.total} at target
                                      {adoption.partial > 0 && ` (${adoption.partial} close)`}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {monthData.businessUnits.length === 0 && (
              <p className={`text-center ${theme.muted} py-8`}>No business units yet. {editMode && 'Add one to get started.'}</p>
            )}

            <Legend darkMode={store.darkMode} ragColors={store.ragColors} orderedPractices={store.orderedPractices} maturityScale={store.maturityScale} buThresholds={store.buThresholds} />
          </div>
        )}
      </main>
    </div>
  );
}
