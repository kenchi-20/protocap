"use client";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
  label?: string;
}

export function FilterDropdown({ options, selected, onChange, label }: FilterDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-maroon"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
