import { useState, useRef, useEffect } from 'react';

/**
 * Simple click-to-edit text field
 */
export function EditableText({ value, onChange, className = "", placeholder = "Click to edit" }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (text !== value) {
      onChange(text);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setText(value);
            setEditing(false);
          }
        }}
        className={`bg-slate-800 border border-cyber-500 rounded px-2 py-1 text-white outline-none ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-slate-700/50 rounded px-1 -mx-1 ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-slate-500 italic">{placeholder}</span>}
    </span>
  );
}

/**
 * Simple click-to-edit textarea
 */
export function EditableTextarea({ value, onChange, className = "", placeholder = "Click to edit" }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (text !== value) {
      onChange(text);
    }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setText(value);
            setEditing(false);
          }
        }}
        rows={3}
        className={`w-full bg-slate-800 border border-cyber-500 rounded px-2 py-1 text-white outline-none resize-none ${className}`}
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-slate-700/50 rounded px-1 -mx-1 min-h-[1.5em] ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-slate-500 italic">{placeholder}</span>}
    </p>
  );
}

/**
 * Simple select dropdown for trends
 */
export function EditableSelect({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white outline-none cursor-pointer hover:border-cyber-500 ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Toggle for boolean practices with N/A support
 * Values: true, false, 'na'
 * Click cycles: No → Yes → N/A → No
 */
export function EditableToggle({ value, onChange, label }) {
  // Cycle: false -> true -> na -> false
  const handleClick = () => {
    if (value === 'na') onChange(false);
    else if (value === true) onChange('na');
    else onChange(true);
  };

  const isNA = value === 'na';

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-between w-full gap-2 px-2 py-1.5 rounded transition-colors ${
        isNA
          ? "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
          : value
            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
      }`}
      title={`Click to change: ${isNA ? "N/A → No" : value ? "Yes → N/A" : "No → Yes"}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
        isNA ? "bg-slate-500/30" : value ? "bg-emerald-500/30" : "bg-red-500/30"
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          isNA ? "bg-slate-400" : value ? "bg-emerald-400" : "bg-red-400"
        }`} />
        {isNA ? 'N/A' : value ? 'Yes' : 'No'}
      </span>
    </button>
  );
}

/**
 * Maturity level selector (1-4)
 */
export function EditableMaturity({ value, onChange, label, scale }) {
  // Use provided scale or default to 0-4
  const levels = scale ? scale.filter(l => l.level >= 0) : [
    { level: 0, short: '0' },
    { level: 1, short: '1' },
    { level: 2, short: '2' },
    { level: 3, short: '3' },
    { level: 4, short: '4' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex gap-1">
        {/* N/A button */}
        <button
          onClick={() => onChange(-1)}
          className={`px-2 h-6 rounded text-xs font-medium transition-colors ${
            value === -1
              ? "bg-slate-500 text-white"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
          title="Not Applicable - this practice doesn't apply to this squad"
        >
          N/A
        </button>
        {/* Level buttons */}
        {levels.map((level) => (
          <button
            key={level.level}
            onClick={() => onChange(level.level)}
            className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
              value !== -1 && level.level <= value
                ? "bg-cyber-500 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
            title={level.label || `Level ${level.level}`}
          >
            {level.short || level.level}
          </button>
        ))}
      </div>
    </div>
  );
}
