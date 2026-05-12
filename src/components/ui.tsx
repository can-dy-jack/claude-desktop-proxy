import type { ReactNode } from "react";

/** A single preferences row: right-aligned label + left-aligned control. */
export function PrefRow({
  label,
  hint,
  children,
  align = "center",
}: {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div className={`pref-row ${align === "start" ? "items-start" : "items-center"}`}>
      <div className="pref-label">{label}</div>
      <div className="pref-control">
        {children}
        {hint && (
          <div className="mt-0.5 text-[11px] leading-snug text-neutral-400">{hint}</div>
        )}
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  actions,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-3 last:mb-0">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-1 px-1">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-neutral-500">
            {title}
          </h3>
          {actions}
        </div>
      )}
      <div className="px-1">
        {children}
      </div>
    </section>
  );
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="mac-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="track" />
      <span className="thumb" />
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  width = 220,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
  width?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="mac-slider"
        style={{ width, ["--val" as never]: `${pct}%` }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex items-center gap-1 tabular-nums">
        <input
          type="number"
          className="mac-input w-[72px] text-right"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
        />
        {unit && <span className="text-[12px] text-neutral-500">{unit}</span>}
      </div>
    </div>
  );
}

/** macOS-style shortcut display, e.g. ⌥ + Space. Read-only display matching the screenshot. */
export function ShortcutInput({
  modifiers = ["⌥ Option"],
  keyName,
  placeholder = "Not set",
}: {
  modifiers?: string[];
  keyName?: string;
  placeholder?: string;
}) {
  return (
    <div className="shortcut-input">
      {modifiers.map((modifier, idx) => (
        <div key={`${modifier}-${idx}`} className="inline-flex items-center gap-1">
          <span className="key-cap">{modifier}</span>
          <span className="text-neutral-400 text-[12px]">+</span>
        </div>
      ))}
      {keyName ? (
        <span className="key-cap">{keyName}</span>
      ) : (
        <span className="text-neutral-400 text-[12px] px-1">{placeholder}</span>
      )}
    </div>
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  width = 220,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <div className="relative inline-block" style={{ width }}>
      <select
        className="mac-input appearance-none pr-7 cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path
          d="M3 4.5l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
