import { useState } from 'react';
import {
  TrendingUp, Users, Star, Clock, HelpCircle,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  AlertTriangle, Info, Building2, UserCircle, X, Eye, Calendar
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
  badge = null,
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium ${st.text}`}>{title}</h3>
              {alwaysEnabled && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  Always Active
                </span>
              )}
              {badge}
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

// Main StatusRulesModal component
export default function StatusRulesModal({
  statusRules,
  ragColors,
  darkMode,
  onUpdateThreshold,
  onToggleRule,
  onUpdateRuleConfig,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('bu');

  const st = darkMode ? {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-300',
    textHint: 'text-slate-400',
    input: 'bg-slate-800 border-slate-700 text-white',
    cardBg: 'bg-slate-800/50',
    border: 'border-slate-700',
    section: 'bg-slate-800/30 border-slate-700',
    hover: 'hover:bg-slate-700',
  } : {
    bg: 'bg-white',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    textHint: 'text-slate-500',
    input: 'bg-white border-slate-300 text-slate-900',
    cardBg: 'bg-slate-50',
    border: 'border-slate-200',
    section: 'bg-slate-50 border-slate-200',
    hover: 'hover:bg-slate-200',
  };

  const tabs = [
    { id: 'bu', label: 'Business Unit Rules', icon: Building2 },
    { id: 'team', label: 'Team Rules', icon: UserCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`${st.bg} border ${st.border} rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col ${st.text}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${st.border}`}>
          <div>
            <h2 className="text-lg font-semibold">Status Rules</h2>
            <p className={`text-xs ${st.textHint} mt-0.5`}>
              Configure how RAG status is calculated
            </p>
          </div>
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? `${tab.id === 'bu' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-cyber-400 border-b-2 border-cyber-400'}`
                  : `${st.textHint} ${st.hover}`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* How it works info */}
          <div className={`flex items-start gap-3 p-3 rounded-lg mb-4 ${darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className={`text-xs ${st.textMuted}`}>
              {activeTab === 'bu' ? (
                <>
                  <p className="font-medium mb-1">Business Unit Status</p>
                  <p className={st.textHint}>BU status = % of teams that are Green. These rules affect how BU status is calculated from team statuses.</p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-1">Team Status</p>
                  <p className={st.textHint}>Team status = % of practices meeting target. These rules affect how individual team statuses are calculated.</p>
                </>
              )}
            </div>
          </div>

          {/* BU Rules Tab */}
          {activeTab === 'bu' && (
            <div className="space-y-4">
              {/* BU Thresholds */}
              <RuleCard
                title="BU Status Thresholds"
                description="What percentage of teams need to be Green for the BU to be Green?"
                icon={AlertTriangle}
                enabled={true}
                alwaysEnabled={true}
                darkMode={darkMode}
              >
                <div className="space-y-3">
                  <p className={`text-xs ${st.textHint} mb-3`}>
                    BU status is based on the percentage of teams that are Green.
                  </p>
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
                      <span className={`text-xs ${st.textHint}`}>% of teams are Green</span>
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
                      <span className={`text-xs ${st.textHint}`}>% of teams are Green</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                      <span className={`text-sm ${st.textMuted} w-20`}>Red</span>
                      <span className={`text-xs ${st.textHint} ml-6`}>Below {statusRules?.thresholds?.bu?.amber ?? 40}% of teams are Green</span>
                    </div>
                  </div>
                </div>
              </RuleCard>

              {/* Team Weights Rule */}
              <RuleCard
                title="Team Weights"
                description="Some teams count more than others when calculating BU status."
                icon={Users}
                enabled={statusRules?.teamWeights?.enabled}
                onToggle={(enabled) => onToggleRule('teamWeights', enabled)}
                darkMode={darkMode}
              >
                <div className="space-y-2">
                  <p className={`text-xs ${st.textHint}`}>
                    Each team has a weight (0.1 to 1.0). A team with weight 0.5 counts half as much as weight 1.0.
                  </p>
                  <p className={`text-xs ${st.textHint}`}>
                    <strong>Example:</strong> If you have 2 teams - one Green (weight 1.0) and one Red (weight 0.5) -
                    the BU is calculated as 67% Green (1.0 / 1.5), not 50%.
                  </p>
                  <p className={`text-xs text-amber-400`}>
                    Configure individual team weights in each team's detail view.
                  </p>
                </div>
              </RuleCard>

              {/* BU Trend Rule */}
              <RuleCard
                title="BU Trend Penalty"
                description="Downgrade BU status if the overall trend is declining."
                icon={TrendingUp}
                enabled={statusRules?.buTrend?.enabled}
                onToggle={(enabled) => onToggleRule('buTrend', enabled)}
                darkMode={darkMode}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${st.textMuted}`}>Mode:</span>
                    <select
                      value={statusRules?.buTrend?.mode || 'penalty'}
                      onChange={(e) => onUpdateRuleConfig('buTrend', 'mode', e.target.value)}
                      className={`flex-1 ${st.input} border rounded px-2 py-1.5 text-sm focus:border-cyber-500 outline-none`}
                    >
                      <option value="penalty">Downgrade by one level (Green → Amber → Red)</option>
                      <option value="strict">Declining BU capped at Amber (can't be Green)</option>
                    </select>
                  </div>
                  <p className={`text-xs ${st.textHint}`}>
                    BU trend is auto-calculated by comparing average team scores with the previous month.
                  </p>
                </div>
              </RuleCard>

              {/* Untracked BU Status (renamed from Grey Status) */}
              <RuleCard
                title="Untracked Business Unit"
                description="Show grey status for BUs that don't have enough data or tracked teams."
                icon={HelpCircle}
                enabled={statusRules?.grey?.enabled}
                onToggle={(enabled) => onToggleRule('grey', enabled)}
                darkMode={darkMode}
              >
                <div className="space-y-4">
                  <p className={`text-xs ${st.textHint}`}>
                    Enable one or both conditions below. If both are enabled, a BU will be grey if <strong>either</strong> condition is met.
                  </p>

                  {/* Untracked Teams Threshold */}
                  <div className={`p-3 rounded-lg border ${statusRules?.grey?.useUntrackedThreshold ? (darkMode ? 'border-cyber-500/50 bg-slate-700/30' : 'border-blue-300 bg-blue-50/50') : (darkMode ? 'border-slate-600' : 'border-slate-200')}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusRules?.grey?.useUntrackedThreshold ?? true}
                        onChange={(e) => onUpdateRuleConfig('grey', 'useUntrackedThreshold', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-400 text-cyber-500 focus:ring-cyber-500"
                      />
                      <span className={`text-sm font-medium ${st.textMuted}`}>% of untracked teams</span>
                    </label>
                    {(statusRules?.grey?.useUntrackedThreshold ?? true) && (
                      <div className="flex items-center gap-3 mt-2 ml-6">
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
                        <span className={`text-xs ${st.textHint}`}>% or more → Grey</span>
                      </div>
                    )}
                  </div>

                  {/* Data Maturity */}
                  <div className={`p-3 rounded-lg border ${statusRules?.grey?.useDataMaturity ? (darkMode ? 'border-cyber-500/50 bg-slate-700/30' : 'border-blue-300 bg-blue-50/50') : (darkMode ? 'border-slate-600' : 'border-slate-200')}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusRules?.grey?.useDataMaturity ?? false}
                        onChange={(e) => onUpdateRuleConfig('grey', 'useDataMaturity', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-400 text-cyber-500 focus:ring-cyber-500"
                      />
                      <span className={`text-sm font-medium ${st.textMuted}`}>Data maturity (minimum periods)</span>
                    </label>
                    {statusRules?.grey?.useDataMaturity && (
                      <div className="flex items-center gap-3 mt-2 ml-6">
                        <span className={`text-sm ${st.textMuted}`}>Min periods:</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          step="1"
                          value={statusRules?.grey?.minPeriods ?? 3}
                          onChange={(e) => onUpdateRuleConfig('grey', 'minPeriods', parseInt(e.target.value))}
                          className={`w-16 ${st.input} border rounded px-2 py-1.5 text-sm font-mono focus:border-cyber-500 outline-none`}
                        />
                        <span className={`text-xs ${st.textHint}`}>periods of data required</span>
                      </div>
                    )}
                    <p className={`text-xs ${st.textHint} mt-2 ml-6`}>
                      If your data has fewer periods than this, all BUs will show grey.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.grey?.hex || '#6b7280' }} />
                    <span className={`text-sm ${st.textMuted}`}>Grey = "{ragColors?.grey?.label || 'Untracked'}"</span>
                  </div>
                </div>
              </RuleCard>

              {/* Show Reason Badges Toggle */}
              <RuleCard
                title="Show Status Reasons"
                description="Display badges explaining why a BU was downgraded (e.g., 'declining trend')."
                icon={Eye}
                enabled={statusRules?.showReasonBadges?.enabled}
                onToggle={(enabled) => onToggleRule('showReasonBadges', enabled)}
                darkMode={darkMode}
              >
                <p className={`text-xs ${st.textHint}`}>
                  When enabled, BU cards will show small badges indicating which rules caused a status downgrade.
                </p>
              </RuleCard>
            </div>
          )}

          {/* Team Rules Tab */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              {/* Team Thresholds */}
              <RuleCard
                title="Team Status Thresholds"
                description="What percentage of practices need to be at target for a team to be Green?"
                icon={AlertTriangle}
                enabled={true}
                alwaysEnabled={true}
                darkMode={darkMode}
              >
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
                    <span className={`text-xs ${st.textHint}`}>% of practices at target</span>
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
                    <span className={`text-xs ${st.textHint}`}>% of practices at target</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded" style={{ backgroundColor: ragColors?.red?.hex || '#dc2626' }} />
                    <span className={`text-sm ${st.textMuted} w-20`}>Red</span>
                    <span className={`text-xs ${st.textHint} ml-6`}>Below {statusRules?.thresholds?.team?.amber ?? 40}% of practices at target</span>
                  </div>
                </div>
              </RuleCard>

              {/* Team Trend Rule */}
              <RuleCard
                title="Team Trend Penalty"
                description="Downgrade team status if their trend is declining."
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
                    Team trend is auto-calculated by comparing practice scores with the previous month.
                  </p>
                </div>
              </RuleCard>

              {/* Practice Importance Rule */}
              <RuleCard
                title="Practice Importance"
                description="Starred practices count more when calculating team status."
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
                    Mark practices as important (⭐) in Settings → Practices.
                    A 1.5x weight means failing an important practice hurts more.
                  </p>
                </div>
              </RuleCard>

              {/* Stagnation Penalty Rule */}
              <RuleCard
                title="Stagnation Penalty"
                description="Penalize teams stuck below target for multiple months."
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
                    Teams that haven't improved any practice in {statusRules?.stagnation?.monthsThreshold ?? 3} months
                    get penalized. This encourages continuous improvement.
                  </p>
                </div>
              </RuleCard>

              {/* Show Reason Badges Toggle for Teams */}
              <RuleCard
                title="Show Status Reasons"
                description="Display badges explaining why a team was downgraded (e.g., 'missing key practice')."
                icon={Eye}
                enabled={statusRules?.showTeamReasonBadges?.enabled}
                onToggle={(enabled) => onToggleRule('showTeamReasonBadges', enabled)}
                darkMode={darkMode}
              >
                <p className={`text-xs ${st.textHint}`}>
                  When enabled, team cards will show small badges indicating which rules caused a status downgrade.
                </p>
              </RuleCard>
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
