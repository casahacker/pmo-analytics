import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface DropdownItem {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  items: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  items,
  value,
  onChange,
  className,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((i) => i.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label htmlFor={id} className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKey}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 bg-sidebar border border-line text-text rounded text-[12px] transition-colors cursor-pointer",
          "hover:border-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
          open && "border-primary ring-1 ring-primary"
        )}
      >
        <span className="truncate">{selected?.label ?? "Selecionar"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-text-secondary shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-card border border-line rounded shadow-lg max-h-52 overflow-y-auto custom-scrollbar"
        >
          {items.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={item.value === value}
              onClick={() => { onChange(item.value); setOpen(false); }}
              className={cn(
                "px-3 py-2 text-[12px] cursor-pointer transition-colors",
                item.value === value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-text hover:bg-sidebar-active"
              )}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
