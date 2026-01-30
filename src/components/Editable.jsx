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
 * Toggle for boolean practices
 */
export function EditableToggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
        value
          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
      }`}
    >
      <span className={`w-3 h-3 rounded-full ${value ? "bg-emerald-400" : "bg-red-400"}`} />
      {label}
    </button>
  );
}

/**
 * Maturity level selector (1-4)
 */
export function EditableMaturity({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
              level <= value
                ? "bg-cyber-500 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
