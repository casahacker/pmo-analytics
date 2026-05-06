import React from "react";

interface PayloadEntry {
  name: string;
  value: number | string;
  color?: string;
  unit?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number | string, name: string) => string;
}

function formatLabel(label: string): string {
  if (!label) return "";
  // "2026-03-17" → "17/03/2026" (ISO date)
  const dateMatch = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    try {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const m = parseInt(dateMatch[2], 10) - 1;
      return `Semana de ${dateMatch[3]}/${dateMatch[2]} — ${months[m]} ${dateMatch[1]}`;
    } catch { return label; }
  }
  // "2026-03" → "Mar 2026"
  const monthMatch = label.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const month = parseInt(monthMatch[2], 10) - 1;
    return `${months[month]} ${monthMatch[1]}`;
  }
  // "2026-W12" → "Semana 12/2026"
  const weekMatch = label.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) return `Semana ${weekMatch[2]}/${weekMatch[1]}`;
  return label;
}

function formatValue(value: number | string): string {
  if (typeof value === "number") {
    if (value > 0 && value <= 1) return `${(value * 100).toFixed(0)}%`;
    if (value >= 1000) return value.toLocaleString("pt-BR");
    if (!Number.isInteger(value)) return value.toFixed(1);
    return String(value);
  }
  return String(value);
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}) => {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label ?? "") : formatLabel(label ?? "");

  return (
    <div className="bg-card border border-line rounded px-3 py-2 min-w-[120px] text-xs text-text shadow-sm">
      {displayLabel && (
        <p className="font-bold mb-1 pb-1 border-b border-line">{displayLabel}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex justify-between gap-3 mt-0.5">
          <span className="font-semibold" style={{ color: entry.color ?? "var(--color-text-secondary, #525252)" }}>{entry.name}</span>
          <span className="font-bold">
            {valueFormatter ? valueFormatter(entry.value, entry.name) : formatValue(entry.value)}
            {entry.unit ? ` ${entry.unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
};
