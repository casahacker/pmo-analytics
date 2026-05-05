import React from "react";
import { TOOLTIP_STYLE } from "../lib/constants";

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
  // "2026-03" → "Mar 2026"
  const monthMatch = label?.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const month = parseInt(monthMatch[2], 10) - 1;
    return `${months[month]} ${monthMatch[1]}`;
  }
  // "2026-W12" → "Semana 12/2026"
  const weekMatch = label?.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) return `Semana ${weekMatch[2]}/${weekMatch[1]}`;
  return label ?? "";
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
    <div
      style={{
        ...TOOLTIP_STYLE,
        padding: "8px 12px",
        border: `1px solid ${TOOLTIP_STYLE.borderColor}`,
        borderRadius: TOOLTIP_STYLE.borderRadius,
        backgroundColor: TOOLTIP_STYLE.backgroundColor,
        fontSize: TOOLTIP_STYLE.fontSize,
        color: TOOLTIP_STYLE.color,
        minWidth: "120px",
      }}
    >
      {displayLabel && (
        <p style={{ fontWeight: 700, marginBottom: 4, borderBottom: "1px solid #e0e0e0", paddingBottom: 4 }}>
          {displayLabel}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 2 }}>
          <span style={{ color: entry.color ?? "#525252", fontWeight: 600 }}>{entry.name}</span>
          <span style={{ fontWeight: 700 }}>
            {valueFormatter ? valueFormatter(entry.value, entry.name) : formatValue(entry.value)}
            {entry.unit ? ` ${entry.unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
};
