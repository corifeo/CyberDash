import { useState } from 'react';
import {
  TrendingUp, Users, Star, Clock, HelpCircle,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  AlertTriangle, Info
} from 'lucide-react';

// Rule card component for individual toggleable rules
function RuleCard({
  title,
  description,
  icon: Icon,
  enabled,
  onToggle,
  children,
  darkMode,
  alwaysEnabled = false,
}) {
  const [expanded, setExpanded] = useState(enabled);

  const st = darkMode ? {
    card: 'bg-slate-800/50 border-slate-700',
    cardActive: 'bg-slate-800/70 border-cyber-500/50',
    text: 'text-white',
    textMuted: 'text-slate-300',
    textHint: 'text-slate-400',
    hover: 'hover:bg-slate-700',
  } : {
    card: 'bg-slate-50 border-slate-200',
    cardActive: 'bg-blue-50 border-blue-300',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textHint: 'text-slate-500',
    hover: 'hover:bg-slate-100',
  };

  return (
    <div className={`rounded-lg border p-4 transition-all ${enabled ? st.cardActive : st.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-cyber-500/20 text-cyber-400' : `${darkMode ? 'bg-slate-700' : 'bg-slate-200'} ${st.textHint}`}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium ${st.text}`}>{title}</h3>
              {alwaysEnabled && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  Always Active
                </span>
              )}
            </div>
            <p className={`text-sm ${st.textHint} mt-1`}>{description}</p>
          </div>
        </div>

        {!alwaysEnabled && (
          <button
            onClick={() => onToggle(!enabled)}
            className={`p-1 rounded transition-colors ${st.hover}`}
            title={enabled ? 'Disable rule' : 'Enable rule'}
          >
            {enabled ? (
              <ToggleRight className="w-8 h-8 text-cyber-400" />
            ) : (
              <ToggleLeft className={`w-8 h-8 ${st.textHint}`} />
            )}
          </button>
        )}
      </div>

      {/* Expandable config section */}
      {children && (enabled || alwaysEnabled) && (
        <div className="mt-4 pt-4 border-t border-slate-600/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-1 text-xs ${st.textHint} ${st.hover} px-2 py-1 rounded mb-3`}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide options' : 'Show options'}
          </button>
          {expanded && children}
        </div>
      )}
    </div>
  );
}

// Main StatusRulesTab component
export default function StatusRulesTab({
  statusRules,
  ragColors,
  darkMode,
  onUpdateThreshold,
  onToggleRule,
  onUpdateRuleConfig,
}) {
  const st = darkMode ? {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-300',
    textHint: 'text-slate-400',
    input: 'bg-slate-800 border-slate-700 text-white',
    cardBg: 'bg-slate-800/50',
    border: 'border-slate-700',
  } : {
    bg: 'bg-white',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textHint: 'text-slate-500',
    input: 'bg-white border-slate-300 text-slate-900',
    cardBg: 'bg-slate-50',
    border: 'border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-xl font-bold ${st.text}`}>Status Rules</h2>
        <p className={`text-sm ${st.textHint} mt-1`}>
          Configure how RAG status is calculated. Toggle rules on/off to customize the calculation.
        </p>
      </div>

      {/* Info banner */}
      <div className={`flex items-start gap-3 p-4 rounded-lg ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className={`text-sm ${st.textMuted}`}>
          <p className="font-medium mb-1">How status calculation works</p>
          <p className={st.textHint}>
            The base status is always calculated from practice adoption thresholds. Additional rules can modify
            this status - for example, enabling the Trend rule will downgrade teams with declining performance.
            Rules are applied in order from top to bottom.
          </p>
        </div>
      </div>

      {/* Core Thresholds (always active) */}
      <RuleCard
        title="Core Thresholds"
        description="Define the percentage boundaries for Green, Amber, and Red status. This is always active."
        icon={AlertTriangle}
        enabled={true}
        alwaysEnabled={true}
        darkMode={darkMode}
      >
        <div className="space-y-4">
          {/* Team Thresholds */}
          <div>
            <h4 className={`text-sm font-medium ${st.textMuted} mb-2`}>Team Status (% of practices at target)</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.green?.hex || '#059669' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Green</span>
                <span className={`text-xs ${st.textHint}`}>≥</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={statusRules?.thresholds?.team?.green ?? 75}
                  onChange={(e) => onUpdateThreshold('team', 'green', e.target.value)}
                  className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                />
                <span className={`text-xs ${st.textHint}`}>%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.amber?.hex || '#d97706' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Amber</span>
                <span className={`text-xs ${st.textHint}`}>≥</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={statusRules?.thresholds?.team?.amber ?? 40}
                  onChange={(e) => onUpdateThreshold('team', 'amber', e.target.value)}
                  className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                />
                <span className={`text-xs ${st.textHint}`}>%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Red</span>
                <span className={`text-xs ${st.textHint} ml-6`}>Below amber threshold</span>
              </div>
            </div>
          </div>

          {/* BU Thresholds */}
          <div className="pt-3 border-t border-slate-600/30">
            <h4 className={`text-sm font-medium ${st.textMuted} mb-2`}>BU Status (% of green teams)</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.green?.hex || '#059669' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Green</span>
                <span className={`text-xs ${st.textHint}`}>≥</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={statusRules?.thresholds?.bu?.green ?? 75}
                  onChange={(e) => onUpdateThreshold('bu', 'green', e.target.value)}
                  className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                />
                <span className={`text-xs ${st.textHint}`}>%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.amber?.hex || '#d97706' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Amber</span>
                <span className={`text-xs ${st.textHint}`}>≥</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={statusRules?.thresholds?.bu?.amber ?? 40}
                  onChange={(e) => onUpdateThreshold('bu', 'amber', e.target.value)}
                  className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                />
                <span className={`text-xs ${st.textHint}`}>%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                <span className={`text-sm ${st.textMuted} w-20`}>Red</span>
                <span className={`text-xs ${st.textHint} ml-6`}>Below amber threshold</span>
              </div>
            </div>
          </div>
        </div>
      </RuleCard>

      {/* Trend Rule */}
      <RuleCard
        title="Trend Penalty"
        description="Penalize teams with declining trends by downgrading their status."
        icon={TrendingUp}
        enabled={statusRules?.trend?.enabled}
        onToggle={(enabled) => onToggleRule('trend', enabled)}
        darkMode={darkMode}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm ${st.textMuted}`}>Mode:</span>
            <select
              value={statusRules?.trend?.mode || 'penalty'}
              onChange={(e) => onUpdateRuleConfig('trend', 'mode', e.target.value)}
              className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
            >
              <option value="penalty">Downgrade by one level (Green → Amber → Red)</option>
              <option value="strict">Declining teams capped at Amber (can't be Green)</option>
            </select>
          </div>
          <p className={`text-xs ${st.textHint}`}>
            {statusRules?.trend?.mode === 'strict'
              ? 'Strict mode: Teams with declining trend cannot achieve Green status, regardless of their practice adoption.'
              : 'Penalty mode: Teams with declining trend have their status reduced by one level (e.g., Green becomes Amber).'}
          </p>
        </div>
      </RuleCard>

      {/* Team Weights Rule */}
      <RuleCard
        title="Team Weights"
        description="Weight teams differently in BU status calculations. Higher-weighted teams have more impact."
        icon={Users}
        enabled={statusRules?.teamWeights?.enabled}
        onToggle={(enabled) => onToggleRule('teamWeights', enabled)}
        darkMode={darkMode}
      >
        <p className={`text-xs ${st.textHint}`}>
          Each team has a weight value (0.1 to 1.0) that determines its influence on the BU status.
          A team with weight 0.5 contributes half as much as a team with weight 1.0.
          Configure individual team weights in the team detail view.
        </p>
      </RuleCard>

      {/* Practice Importance Rule */}
      <RuleCard
        title="Practice Importance"
        description="Important practices (marked with star) have more impact on status calculation."
        icon={Star}
        enabled={statusRules?.practiceImportance?.enabled}
        onToggle={(enabled) => onToggleRule('practiceImportance', enabled)}
        darkMode={darkMode}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm ${st.textMuted}`}>Important practice weight:</span>
            <input
              type="number"
              min="1"
              max="3"
              step="0.25"
              value={statusRules?.practiceImportance?.importantWeight ?? 1.5}
              onChange={(e) => onUpdateRuleConfig('practiceImportance', 'importantWeight', parseFloat(e.target.value))}
              className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
            />
            <span className={`text-xs ${st.textHint}`}>x multiplier</span>
          </div>
          <p className={`text-xs ${st.textHint}`}>
            Mark practices as important (star icon) in Settings → Practices. A weight of 1.5x means important
            practices count 50% more towards the status calculation.
          </p>
        </div>
      </RuleCard>

      {/* Stagnation Penalty Rule */}
      <RuleCard
        title="Stagnation Penalty"
        description="Penalize teams that have been below target for multiple months without improvement."
        icon={Clock}
        enabled={statusRules?.stagnation?.enabled}
        onToggle={(enabled) => onToggleRule('stagnation', enabled)}
        darkMode={darkMode}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm ${st.textMuted}`}>Months without progress:</span>
            <input
              type="number"
              min="2"
              max="12"
              step="1"
              value={statusRules?.stagnation?.monthsThreshold ?? 3}
              onChange={(e) => onUpdateRuleConfig('stagnation', 'monthsThreshold', parseInt(e.target.value))}
              className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
            />
            <span className={`text-xs ${st.textHint}`}>months</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${st.textMuted}`}>Penalty:</span>
            <select
              value={statusRules?.stagnation?.penalty || 'downgrade'}
              onChange={(e) => onUpdateRuleConfig('stagnation', 'penalty', e.target.value)}
              className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
            >
              <option value="downgrade">Downgrade by one level</option>
              <option value="red">Force Red status</option>
            </select>
          </div>
          <p className={`text-xs ${st.textHint}`}>
            A team is considered stagnant if it has been below its target status for the specified number
            of consecutive months without any practice improvement.
          </p>
        </div>
      </RuleCard>

      {/* Grey Status Rule */}
      <RuleCard
        title="Grey Status (Insufficient Data)"
        description="Show grey status when there isn't enough data to calculate a meaningful status."
        icon={HelpCircle}
        enabled={statusRules?.grey?.enabled}
        onToggle={(enabled) => onToggleRule('grey', enabled)}
        darkMode={darkMode}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm ${st.textMuted}`}>Trigger when:</span>
            <select
              value={statusRules?.grey?.trigger || 'scopeThreshold'}
              onChange={(e) => onUpdateRuleConfig('grey', 'trigger', e.target.value)}
              className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
            >
              <option value="scopeThreshold">Percentage of teams are out of scope</option>
              <option value="allUntracked">All teams are untracked</option>
              <option value="noPractices">No practices have been scored</option>
            </select>
          </div>

          {statusRules?.grey?.trigger === 'scopeThreshold' && (
            <div className="flex items-center gap-3">
              <span className={`text-sm ${st.textMuted}`}>Threshold:</span>
              <input
                type="number"
                min="10"
                max="100"
                step="5"
                value={statusRules?.grey?.scopeThreshold ?? 50}
                onChange={(e) => onUpdateRuleConfig('grey', 'scopeThreshold', parseInt(e.target.value))}
                className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
              />
              <span className={`text-xs ${st.textHint}`}>% of teams out of scope</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.grey?.hex || '#6b7280' }} />
            <span className={`text-sm ${st.textMuted}`}>Grey: {ragColors?.grey?.label || 'Insufficient Data'}</span>
          </div>

          <p className={`text-xs ${st.textHint}`}>
            Grey status indicates that there isn't enough reliable data to determine the actual health
            of the team or BU. This helps distinguish "no data" from "poor performance".
          </p>
        </div>
      </RuleCard>
    </div>
  );
}
