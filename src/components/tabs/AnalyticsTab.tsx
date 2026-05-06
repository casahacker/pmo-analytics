import React, { useState } from "react";
import { Maximize2, X, TrendingUp } from "lucide-react";
import { addDays, format, parseISO, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis,
  Treemap, FunnelChart, Funnel, LabelList, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import { cn } from "../../lib/utils";
import { COLORS } from "../../lib/constants";
import { ChartTooltip } from "../ChartTooltip";
import { NormalizedIssue } from "../../lib/dataProcessor";

// ─── ChartCard ────────────────────────────────────────────────────────────────

interface ChartCardProps {
  id: string;
  title: string;
  subtitle?: string;
  className?: string;
  expandedChart: string | null;
  onExpand: (id: string | null) => void;
  children: (expanded: boolean) => React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ id, title, subtitle, className = "", expandedChart, onExpand, children }) => {
  const isExpanded = expandedChart === id;
  return (
    <>
      <div className={cn("bento-card p-6 flex flex-col", className)}>
        <div className="flex justify-between items-start mb-4 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-text uppercase tracking-wide">{title}</h3>
            {subtitle && <p className="text-[10px] text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={() => onExpand(id)}
            className="p-1.5 rounded hover:bg-sidebar-active text-text-secondary hover:text-text transition-colors"
            title="Tela cheia"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 min-h-0">{children(false)}</div>
      </div>

      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => onExpand(null)}
        >
          <div
            className="bg-card w-full h-full rounded p-8 flex flex-col border border-line"
            style={{ maxWidth: "96vw", maxHeight: "92vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-text uppercase tracking-wide">{title}</h3>
                {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={() => onExpand(null)}
                className="p-2 rounded hover:bg-sidebar-active text-text-secondary hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{children(true)}</div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Section header ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="col-span-12 flex items-center gap-3 pt-4">
    <div className="h-px flex-1 bg-line" />
    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">{label}</span>
    <div className="h-px flex-1 bg-line" />
  </div>
);

// ─── Calendar Heatmap (SVG) ───────────────────────────────────────────────────

const CalendarHeatmap: React.FC<{ data: Record<string, number> }> = ({ data }) => {
  const today = new Date();
  const vals = Object.values(data);
  const maxVal = vals.length > 0 ? Math.max(1, ...vals) : 1;

  const CELL = 14;
  const GAP = 3;
  const COL = CELL + GAP;
  const ROW = CELL + GAP;
  const LEFT = 30;
  const TOP = 22;
  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // align to Sunday
  let start = subDays(today, 364);
  while (start.getDay() !== 0) start = subDays(start, 1);

  const weeks: { date: string; count: number; row: number }[][] = [];
  let cur = new Date(start);
  while (cur <= today) {
    const week: { date: string; count: number; row: number }[] = [];
    for (let d = 0; d < 7; d++) {
      if (cur > today) break;
      const dateStr = format(cur, "yyyy-MM-dd");
      week.push({ date: dateStr, count: data[dateStr] || 0, row: d });
      cur = addDays(cur, 1);
    }
    if (week.length > 0) weeks.push(week);
  }

  const getColor = (count: number): string => {
    if (count === 0) return "#e0e0e0";
    const pct = count / maxVal;
    if (pct < 0.15) return "#bfdbfe";
    if (pct < 0.35) return "#93c5fd";
    if (pct < 0.6)  return "#3b82f6";
    if (pct < 0.82) return "#1d4ed8";
    return "#0f62fe";
  };

  // month label positions — show at first week of each month
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date);
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], x: LEFT + wi * COL });
      lastMonth = m;
    }
  });

  const W = LEFT + weeks.length * COL + 4;
  const H = TOP + 7 * ROW + 28;

  const LEGEND_COLORS = ["#e0e0e0", "#bfdbfe", "#93c5fd", "#3b82f6", "#1d4ed8", "#0f62fe"];

  return (
    <div className="overflow-x-auto custom-scrollbar" style={{ overflowX: "auto" }}>
      <svg width={W} height={H} overflow="visible" style={{ display: "block", minWidth: W, fontFamily: "IBM Plex Sans, sans-serif" }}>
        {/* Month labels */}
        {monthLabels.map(({ label, x }, i) => (
          <text key={i} x={x} y={TOP - 7} fontSize={10} fill="#525252" fontWeight="600">{label}</text>
        ))}

        {/* Day labels: Mon, Wed, Fri */}
        {[{ label: "Seg", row: 1 }, { label: "Qua", row: 3 }, { label: "Sex", row: 5 }].map(({ label, row }) => (
          <text key={label} x={LEFT - 4} y={TOP + row * ROW + CELL / 2} fontSize={9} fill="#8d8d8d" textAnchor="end" dominantBaseline="middle">{label}</text>
        ))}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((day) => (
            <rect key={day.date} x={LEFT + wi * COL} y={TOP + day.row * ROW} width={CELL} height={CELL} rx={2} fill={getColor(day.count)}>
              <title>{format(new Date(day.date + "T12:00:00"), "dd/MM/yyyy")}: {day.count} atividades</title>
            </rect>
          ))
        )}

        {/* Legend */}
        <text x={LEFT} y={H - 6} fontSize={9} fill="#8d8d8d" textAnchor="end" dx={-4}>Menos</text>
        {LEGEND_COLORS.map((color, i) => (
          <rect key={i} x={LEFT + i * (CELL + 2)} y={H - CELL - 4} width={CELL} height={CELL} rx={2} fill={color} />
        ))}
        <text x={LEFT + LEGEND_COLORS.length * (CELL + 2) + 2} y={H - 6} fontSize={9} fill="#8d8d8d">Mais</text>
      </svg>
    </div>
  );
};

// ─── Custom Sankey SVG ────────────────────────────────────────────────────────

interface SankeyData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
}

const CustomSankey: React.FC<{ data: SankeyData; expanded?: boolean }> = ({ data, expanded }) => {
  const { nodes, links } = data;
  if (!nodes.length || !links.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary text-xs">
        Sem dados de fluxo disponíveis
      </div>
    );
  }

  const minTarget = Math.min(...links.map(l => l.target));
  const sourceNodes = nodes.slice(0, minTarget);
  const targetNodes = nodes.slice(minTarget);
  const totalFlow = links.reduce((s, l) => s + l.value, 0);
  if (totalFlow === 0 || sourceNodes.length === 0) {
    return <div className="flex items-center justify-center h-full text-text-secondary text-xs">Sem dados</div>;
  }

  const W = expanded ? 900 : 600;
  const H = expanded ? 420 : 260;
  const nodeW = 10;
  const pad = 10;
  const usableH = H - pad * (Math.max(sourceNodes.length, targetNodes.length) - 1);

  const srcFlow = sourceNodes.map((_, i) => links.filter(l => l.source === i).reduce((s, l) => s + l.value, 0));
  const tgtFlow = targetNodes.map((_, i) => links.filter(l => l.target === i + minTarget).reduce((s, l) => s + l.value, 0));

  let yc = 0;
  const srcY = srcFlow.map(f => { const t = yc; yc += Math.max(4, (f / totalFlow) * usableH) + pad; return t; });
  const srcH = srcFlow.map(f => Math.max(4, (f / totalFlow) * usableH));

  yc = 0;
  const tgtY = tgtFlow.map(f => { const t = yc; yc += Math.max(4, (f / totalFlow) * usableH) + pad; return t; });
  const tgtH = tgtFlow.map(f => Math.max(4, (f / totalFlow) * usableH));

  const srcUsed = new Array(sourceNodes.length).fill(0);
  const tgtUsed = new Array(targetNodes.length).fill(0);

  const sortedLinks = [...links].sort((a, b) => a.source - b.source);
  const paths = sortedLinks.map((link, li) => {
    const si = link.source;
    const ti = link.target - minTarget;
    const lH = Math.max(1, (link.value / totalFlow) * usableH);
    const y0 = srcY[si] + srcUsed[si] + lH / 2;
    const y1 = tgtY[ti] + tgtUsed[ti] + lH / 2;
    srcUsed[si] += lH;
    tgtUsed[ti] += lH;
    const color = COLORS[si % COLORS.length];
    return (
      <path
        key={li}
        d={`M ${nodeW} ${y0} C ${W / 2} ${y0}, ${W / 2} ${y1}, ${W - nodeW} ${y1}`}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1, lH)}
        strokeOpacity={0.22}
      />
    );
  });

  const fontSize = expanded ? 11 : 9;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {paths}
      {sourceNodes.map((n, i) => (
        <g key={`s${i}`}>
          <rect x={0} y={srcY[i]} width={nodeW} height={srcH[i]} fill={COLORS[i % COLORS.length]} />
          <text x={nodeW + 6} y={srcY[i] + srcH[i] / 2 - 4} dominantBaseline="middle" fontSize={fontSize} fontWeight="bold" fill="#161616">{n.name}</text>
          <text x={nodeW + 6} y={srcY[i] + srcH[i] / 2 + 9} dominantBaseline="middle" fontSize={fontSize - 1} fill="#525252">{srcFlow[i]} issues</text>
        </g>
      ))}
      {targetNodes.map((n, i) => (
        <g key={`t${i}`}>
          <rect x={W - nodeW} y={tgtY[i]} width={nodeW} height={tgtH[i]} fill={COLORS[(i + sourceNodes.length) % COLORS.length]} />
          <text x={W - nodeW - 6} y={tgtY[i] + tgtH[i] / 2 - 4} dominantBaseline="middle" textAnchor="end" fontSize={fontSize} fontWeight="bold" fill="#161616">{n.name}</text>
          <text x={W - nodeW - 6} y={tgtY[i] + tgtH[i] / 2 + 9} dominantBaseline="middle" textAnchor="end" fontSize={fontSize - 1} fill="#525252">{tgtFlow[i]} issues</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Contributor Matrix ───────────────────────────────────────────────────────

const ContributorMatrixChart: React.FC<{
  reporters: string[];
  assignees: string[];
  matrix: Record<string, Record<string, number>>;
}> = ({ reporters, assignees, matrix }) => {
  const maxVal = Math.max(1, ...reporters.flatMap(r => assignees.map(a => matrix[r]?.[a] ?? 0)));
  if (!reporters.length || !assignees.length) {
    return <div className="flex items-center justify-center h-full text-text-secondary text-xs">Sem dados de colaboração</div>;
  }
  return (
    <div className="overflow-auto h-full custom-scrollbar">
      <table className="text-[9px] border-collapse w-full">
        <thead>
          <tr>
            <th className="p-1.5 text-left text-text-secondary font-bold min-w-[72px] sticky left-0 bg-card">Criador ↓ / Responsável →</th>
            {assignees.map(a => (
              <th key={a} className="p-1.5 text-center text-text-secondary font-bold min-w-[52px]" title={a}>
                {a.split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reporters.map(r => (
            <tr key={r}>
              <td className="p-1.5 font-bold text-text truncate max-w-[72px] sticky left-0 bg-card" title={r}>
                {r.split(" ")[0]}
              </td>
              {assignees.map(a => {
                const val = matrix[r]?.[a] ?? 0;
                const intensity = val / maxVal;
                return (
                  <td key={a} className="p-0.5 text-center" title={`${r} → ${a}: ${val}`}>
                    <div
                      className="flex items-center justify-center h-7 rounded-sm"
                      style={{ backgroundColor: val > 0 ? `rgba(15,98,254,${Math.max(0.08, intensity * 0.75)})` : "transparent" }}
                    >
                      {val > 0 && (
                        <span className={cn("font-bold text-[9px]", intensity > 0.55 ? "text-white" : "text-primary")}>{val}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Treemap Cell ─────────────────────────────────────────────────────────────

// IBM Blue intensity scale by volume rank (light → dark)
const TREEMAP_BLUES = ["#d0e2ff", "#a6c8ff", "#78a9ff", "#4589ff", "#0f62fe", "#0043ce"];

const TreemapCell = (props: any) => {
  const { x, y, width, height, name, value, overdue, maxValue } = props;
  if (!width || !height || width < 2 || height < 2) return null;

  // Color intensity: normalize volume to one of 6 shades
  const ratio = value / Math.max(1, maxValue ?? value);
  const colorIdx = Math.min(5, Math.floor(ratio * 6));
  const fill = TREEMAP_BLUES[colorIdx];

  // Adapt text color to background lightness
  const textColor = colorIdx >= 3 ? "#ffffff" : "#161616";
  const subColor = colorIdx >= 3 ? "rgba(255,255,255,0.72)" : "#525252";

  // Risk dot
  const riskRate = (overdue ?? 0) / Math.max(1, value);
  const riskFill = riskRate > 0.3 ? "#da1e28" : riskRate > 0.1 ? "#f1c21b" : "#42be65";

  const showText = width > 40 && height > 22;
  const showCount = width > 40 && height > 44;
  const showRisk = width > 52 && height > 28;
  const fontSize = Math.min(12, Math.max(9, Math.floor(width / 7)));

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#ffffff" strokeWidth={2} rx={0} />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showCount ? 7 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="600"
          fill={textColor}
        >
          {name}
        </text>
      )}
      {showCount && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill={subColor}
        >
          {value} issues
        </text>
      )}
      {showRisk && (
        <circle cx={x + width - 9} cy={y + 9} r={5} fill={riskFill} stroke="#ffffff" strokeWidth={1.5} />
      )}
    </g>
  );
};

// ─── Bubble Tooltip ───────────────────────────────────────────────────────────

const BubbleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-card border border-line rounded p-3 text-xs shadow">
      <p className="font-bold text-text mb-1.5">{d.fullName}</p>
      <p className="text-text-secondary">Taxa Atraso: <span className="text-error font-bold">{d.x}%</span></p>
      <p className="text-text-secondary">Completude: <span className="text-success font-bold">{d.y}%</span></p>
      <p className="text-text-secondary">Volume: <span className="text-primary font-bold">{d.z} issues</span></p>
    </div>
  );
};

const LeadTimeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-card border border-line rounded p-3 text-xs shadow">
      <p className="font-bold text-text mb-1.5">{d.key}</p>
      <p className="text-text-secondary">Mínimo: <span className="text-text font-bold">{d.min}d</span></p>
      <p className="text-text-secondary">P25: <span className="text-text font-bold">{d.q1}d</span></p>
      <p className="text-text-secondary font-semibold">Mediana: <span className="text-primary font-bold">{d.median}d</span></p>
      <p className="text-text-secondary">P75: <span className="text-text font-bold">{d.q3}d</span></p>
      <p className="text-text-secondary">Máximo: <span className="text-text font-bold">{d.max}d</span></p>
      <p className="text-text-secondary">N={d.count} issues</p>
    </div>
  );
};

// ─── Props interface ───────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  // existing
  trendData: any[];
  overdueDist: { key: string; name: string; rate: number }[];
  statusData: { name: string; value: number }[];
  projectDist: { name: string; done: number; inProgress: number; todo: number }[];
  missingFieldsData: { name: string; value: number }[];
  workloadData: { name: string; value: number }[];
  healthAssigneeData: { name: string; score: number }[];
  resolutionData: { key: string; avgDays: number }[];
  filteredIssues: NormalizedIssue[];
  // new
  sankeyData: SankeyData;
  calendarData: Record<string, number>;
  bubbleData: { name: string; fullName: string; x: number; y: number; z: number }[];
  treemapData: { name: string; key: string; value: number; overdue: number }[];
  radarData: { data: any[]; series: string[] };
  funnelData: { name: string; value: number; fill: string }[];
  leadTimeData: { key: string; min: number; q1: number; median: number; q3: number; max: number; count: number }[];
  contributorData: { reporters: string[]; assignees: string[]; matrix: Record<string, Record<string, number>> };
  cycleTimeData: { date: string; days: number; project: string; key: string }[];
  agingData: { label: string; min: number; max: number; count: number }[];
}

// ─── Main component ────────────────────────────────────────────────────────────

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  trendData, overdueDist, statusData, projectDist, missingFieldsData,
  workloadData, healthAssigneeData, resolutionData, filteredIssues,
  sankeyData, calendarData, bubbleData, treemapData, radarData,
  funnelData, leadTimeData, contributorData, cycleTimeData, agingData,
}) => {
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const ec = expandedChart;
  const onExpand = setExpandedChart;

  return (
    <>
      {/* ── A: Tendências & Atividade ─────────────────────────────────────── */}
      <SectionLabel label="Tendências & Atividade" />

      <ChartCard id="trend" title="Tendências: Criadas vs. Concluídas" subtitle="Série temporal semanal" className="col-span-8" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#198038" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#198038" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} tickFormatter={(v: string) => { try { return format(parseISO(v), "dd/MM"); } catch { return v; } }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="completed" name="Resolvidas" stroke="#198038" strokeWidth={2} fillOpacity={1} fill="url(#colRes)" />
                <Area type="monotone" dataKey="created" name="Criadas" stroke="#8d8d8d" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard id="overdue" title="Taxas de Atraso por Projeto" subtitle="Top 10 — ordenado por criticidade" className="col-span-4" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={cn("overflow-y-auto custom-scrollbar pr-2 space-y-3", expanded ? "h-full" : "h-72")}>
            {overdueDist.slice(0, expanded ? 30 : 10).map(proj => (
              <div key={proj.key} className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate max-w-[160px]">{proj.name}</span>
                  <span className="text-[9px] text-text-secondary uppercase font-bold tracking-tight">{proj.key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded font-bold",
                    proj.rate > 30 ? "bg-error/10 text-error" : proj.rate > 10 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>{proj.rate}%</span>
                  <div className={cn("w-1.5 h-1.5 rounded", proj.rate > 30 ? "bg-error" : proj.rate > 10 ? "bg-warning" : "bg-success")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <ChartCard id="calendar" title="Mapa de Calor de Atividade" subtitle="Criações e atualizações — últimos 12 meses" className="col-span-12" expandedChart={ec} onExpand={onExpand}>
        {() => (
          <CalendarHeatmap data={calendarData} />
        )}
      </ChartCard>

      {/* ── B: Fluxo de Trabalho ──────────────────────────────────────────── */}
      <SectionLabel label="Fluxo de Trabalho" />

      <ChartCard id="sankey" title="Diagrama de Fluxo — Tipo × Status" subtitle="Distribuição proporcional de issues por tipo de artefato e estado do ciclo de vida" className="col-span-12" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            <CustomSankey data={sankeyData} expanded={expanded} />
          </div>
        )}
      </ChartCard>

      <ChartCard id="funnel" title="Funil de Completude" subtitle="Conversão do total até conclusão por presença de metadados" className="col-span-5" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<ChartTooltip />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  <LabelList position="right" fill="#161616" stroke="none" dataKey="name" style={{ fontSize: 10, fontWeight: "bold" }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard id="status" title="Status do Ciclo de Vida" subtitle="Distribuição percentual por categoria de status" className="col-span-7" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={cn("flex flex-col", expanded ? "h-full" : "h-72")}>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius="38%" outerRadius="60%" paddingAngle={6} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── C: Risco & Volume ─────────────────────────────────────────────── */}
      <SectionLabel label="Risco & Volume" />

      <ChartCard id="bubble" title="Mapa de Risco por Projeto" subtitle="X = taxa de atraso | Y = completude | tamanho = volume de issues" className="col-span-6" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" dataKey="x" name="Taxa de Atraso" unit="%" domain={[0, 100]} tick={{ fontSize: 9, fill: "#525252" }} axisLine={false} tickLine={false} label={{ value: "Taxa de Atraso (%)  —  Risco aumenta →", position: "insideBottom", offset: -16, fontSize: 9, fill: "#525252" }} />
                <YAxis type="number" dataKey="y" name="Completude" unit="%" domain={[0, 100]} tick={{ fontSize: 9, fill: "#525252" }} axisLine={false} tickLine={false} label={{ value: "Completude (%)", angle: -90, position: "insideLeft", offset: 10, fontSize: 9, fill: "#525252" }} />
                <ZAxis type="number" dataKey="z" range={[300, 3000]} name="Volume" />
                <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={bubbleData} fillOpacity={0.55}>
                  {bubbleData.map((entry, i) => {
                    const fill = entry.x > 30 ? "#da1e28" : entry.x > 10 ? "#f1c21b" : "#198038";
                    return <Cell key={i} fill={fill} stroke={fill} strokeWidth={1.5} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard id="treemap" title="Volume por Projeto (Treemap)" subtitle="Área = nº de issues | intensidade = volume relativo | ponto = risco de atraso" className="col-span-6" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => {
          const maxTreemapValue = treemapData.length ? Math.max(...treemapData.map(d => d.value)) : 1;
          return (
            <div className={expanded ? "h-full" : "h-72"}>
              {treemapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#ffffff"
                    content={(props: any) => <TreemapCell {...props} maxValue={maxTreemapValue} />}
                  />
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary text-xs">Sem dados</div>
              )}
            </div>
          );
        }}
      </ChartCard>

      <ChartCard id="capacity" title="Distribuição de Capacidade por Projeto" subtitle="Issues por estado — To Do / Em Andamento / Concluído" className="col-span-12" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-64"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectDist.slice(0, expanded ? 20 : 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f4f4f4" }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="done" name="Concluído" stackId="a" fill="#198038" barSize={32} />
                <Bar dataKey="inProgress" name="Em Andamento" stackId="a" fill="#f1c21b" barSize={32} />
                <Bar dataKey="todo" name="To Do" stackId="a" fill="#0f62fe" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* ── D: Qualidade & Equipe ─────────────────────────────────────────── */}
      <SectionLabel label="Qualidade & Equipe" />

      <ChartCard id="missing" title="Frequência de Dívida de Dados" subtitle="Campos obrigatórios ausentes — protocolo de diligência" className="col-span-4" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={cn("overflow-y-auto custom-scrollbar pr-2 space-y-3", expanded ? "h-full" : "h-64")}>
            {missingFieldsData.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-text-secondary">
                  <span>{item.name}</span>
                  <span className="text-primary">{item.value}</span>
                </div>
                <div className="h-1 bg-line overflow-hidden">
                  <div className="h-full bg-primary/50" style={{ width: `${Math.min(100, (item.value / Math.max(filteredIssues.length, 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <ChartCard id="workload" title="Top 10 Workload por Responsável" subtitle="Volume de issues ativas atribuídas" className="col-span-4" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-64"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#525252" }} width={80} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f4f4f4" }} />
                <Bar dataKey="value" name="Issues" fill="#0f62fe" radius={[0, 2, 2, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard id="health" title="Ranking de Saúde de Dados" subtitle="Score médio de completude por responsável" className="col-span-4" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={cn("overflow-y-auto custom-scrollbar pr-2 space-y-3", expanded ? "h-full" : "h-64")}>
            {healthAssigneeData.map(user => (
              <div key={user.name} className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary truncate max-w-[130px]">{user.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-line overflow-hidden">
                    <div
                      className={cn("h-full", user.score < 50 ? "bg-error" : user.score < 80 ? "bg-warning" : "bg-success")}
                      style={{ width: `${user.score}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-text-secondary w-8 text-right">{user.score.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      {/* ── E: Análise Multidimensional ───────────────────────────────────── */}
      <SectionLabel label="Análise Multidimensional" />

      <ChartCard id="radar" title="Radar de Saúde dos Projetos" subtitle="5 eixos de qualidade — top 5 projetos por volume" className="col-span-7" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-80"}>
            {radarData.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData.data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#525252", fontWeight: "bold" }} />
                  <PolarRadiusAxis angle={18} domain={[0, 100]} tick={{ fontSize: 8, fill: "#525252" }} />
                  {radarData.series.map((key, i) => (
                    <Radar key={key} name={key} dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.08} strokeWidth={1.5} />
                  ))}
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary text-xs">Dados insuficientes para o radar</div>
            )}
          </div>
        )}
      </ChartCard>

      <ChartCard id="matrix" title="Matriz de Colaboração" subtitle="Criadores (linhas) × Responsáveis (colunas) — intensidade = volume de issues" className="col-span-5" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-80"}>
            <ContributorMatrixChart
              reporters={contributorData.reporters}
              assignees={contributorData.assignees}
              matrix={contributorData.matrix}
            />
          </div>
        )}
      </ChartCard>

      {/* ── F: Ciclo de Vida ──────────────────────────────────────────────── */}
      <SectionLabel label="Ciclo de Vida & Lead Time" />

      <ChartCard id="resolution" title="Tempo Médio de Resolução" subtitle="Média em dias entre início e conclusão — por projeto" className="col-span-6" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avgDays" fill="#198038" radius={[2, 2, 0, 0]} name="Dias (média)" barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard id="leadtime" title="Distribuição de Lead Time (Mediana)" subtitle="Mediana de dias do início à conclusão | tooltip mostra P25/P50/P75/min/max" className="col-span-6" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => (
          <div className={expanded ? "h-full" : "h-72"}>
            {leadTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadTimeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} label={{ value: "Dias", angle: -90, position: "insideLeft", fontSize: 9, fill: "#525252" }} />
                  <Tooltip content={<LeadTimeTooltip />} />
                  <Bar dataKey="median" name="Mediana (dias)" fill="#8a3ffc" radius={[2, 2, 0, 0]} barSize={36} />
                  <Bar dataKey="q3" name="P75 (dias)" fill="#8a3ffc" radius={[2, 2, 0, 0]} barSize={36} fillOpacity={0.2} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary text-xs">
                Dados insuficientes — necessário ao menos 2 issues concluídas por projeto
              </div>
            )}
          </div>
        )}
      </ChartCard>

      {/* Aging Distribution */}
      <ChartCard id="aging" title="Distribuição de Idade do Backlog" subtitle="Issues em aberto agrupadas por tempo desde a criação" className="col-span-4" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => {
          const AGING_COLORS = ["#198038", "#42be65", "#f1c21b", "#ff832b", "#da1e28", "#750e13"];
          return (
            <div className={expanded ? "h-full" : "h-64"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#525252" }} />
                  <Tooltip content={<ChartTooltip />} />
                  {agingData.map((entry, i) => null)}
                  <Bar dataKey="count" name="Issues em Aberto" radius={[2, 2, 0, 0]} barSize={28}>
                    {agingData.map((entry, i) => (
                      <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }}
      </ChartCard>

      {/* Cycle Time Scatterplot */}
      <ChartCard id="cycletime" title="Cycle Time Scatterplot" subtitle="Cada ponto = uma issue concluída | X = semana de conclusão | Y = dias do início ao fim" className="col-span-8" expandedChart={ec} onExpand={onExpand}>
        {(expanded) => {
          const projectKeys = Array.from(new Set(cycleTimeData.map(d => d.project)));
          const meanDays = cycleTimeData.length
            ? Math.round(cycleTimeData.reduce((s, d) => s + d.days, 0) / cycleTimeData.length)
            : 0;
          return (
            <div className={expanded ? "h-full" : "h-64"}>
              {cycleTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 4, right: 16, left: -20, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="date"
                      type="category"
                      allowDuplicatedCategory={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fill: "#525252" }}
                      tickFormatter={(v: string) => { try { return format(parseISO(v), "dd/MM"); } catch { return v; } }}
                      label={{ value: "Semana de conclusão", position: "insideBottom", offset: -16, fontSize: 9, fill: "#525252" }}
                    />
                    <YAxis
                      dataKey="days"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#525252" }}
                      label={{ value: "Dias", angle: -90, position: "insideLeft", offset: 12, fontSize: 9, fill: "#525252" }}
                    />
                    <ZAxis range={[20, 20]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-card border border-line rounded p-3 text-xs shadow">
                            <p className="font-bold text-text mb-1">{d.key}</p>
                            <p className="text-text-secondary">Cycle time: <span className="text-primary font-bold">{d.days}d</span></p>
                            <p className="text-text-secondary">Semana: <span className="text-text font-bold">{(() => { try { return format(parseISO(d.date), "dd/MM/yyyy"); } catch { return d.date; } })()}</span></p>
                            <p className="text-text-secondary">Projeto: <span className="text-text font-bold">{d.project}</span></p>
                          </div>
                        );
                      }}
                    />
                    {projectKeys.map((pk, i) => (
                      <Scatter
                        key={pk}
                        name={pk}
                        data={cycleTimeData.filter(d => d.project === pk)}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.7}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary text-xs">Sem issues concluídas no filtro ativo</div>
              )}
              {cycleTimeData.length > 0 && (
                <p className="text-[9px] text-text-secondary mt-1">Média: <span className="font-bold text-primary">{meanDays}d</span> · {cycleTimeData.length} issues concluídas</p>
              )}
            </div>
          );
        }}
      </ChartCard>

      {/* ── G: Dicionário ─────────────────────────────────────────────────── */}
      <div className="col-span-12 bento-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text uppercase tracking-wide">Dicionário de Métricas & Lógica Analítica</h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase">Referência Técnica para Decisores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              dot: "bg-success", title: "Volume de Demandas",
              text: <><span className="text-text">O que mede:</span> Quantidade absoluta de issues no filtro ativo.<br /><span className="text-text">Lógica:</span> <code>count(issues) GROUP BY projectKey</code>. Visualizado no Treemap onde área = volume, intensidade de azul = volume relativo ao maior projeto e ponto colorido = risco de atraso (verde/amarelo/vermelho).</>
            },
            {
              dot: "bg-error", title: "Pendências Temporais (Overdue)",
              text: <><span className="text-text">O que mede:</span> Issues com <code>dueDate &lt; hoje</code> e status não "Done".<br /><span className="text-text">Lógica:</span> Taxa calculada como <code>overdue / total * 100</code> por projeto. Visualizado nas barras laterais e no Mapa de Risco (eixo X).</>
            },
            {
              dot: "bg-warning", title: "Qualidade de Dados (Score)",
              text: <><span className="text-text">O que mede:</span> Preenchimento dos campos obrigatórios do protocolo.<br /><span className="text-text">Lógica:</span> <code>(campos_preenchidos / campos_obrigatórios) * 100</code> por issue. Visualizado no Radar (eixo Completude) e no Mapa de Risco (eixo Y).</>
            },
            {
              dot: "bg-line", title: "Dívida de Dados",
              text: <><span className="text-text">O que mede:</span> Quais metadados são mais negligenciados pela operação.<br /><span className="text-text">Lógica:</span> Frequência absoluta de campos vazios detectados pelo Protocolo de Diligência. Visualizado no gráfico de barras horizontais de Frequência.</>
            },
            {
              dot: "bg-primary", title: "Diagrama de Fluxo (Sankey)",
              text: <><span className="text-text">O que mede:</span> Como o volume de issues se distribui entre tipos de artefato e estados do ciclo de vida.<br /><span className="text-text">Lógica:</span> Matriz de contagens <code>issueType × statusCategory</code>. A espessura de cada banda é proporcional ao volume de issues que percorre esse caminho.</>
            },
            {
              dot: "bg-success", title: "Mapa de Calor de Atividade",
              text: <><span className="text-text">O que mede:</span> Ritmo operacional diário da equipe nos últimos 12 meses.<br /><span className="text-text">Lógica:</span> Contagem de eventos de criação + atualização de issues agrupados por dia (<code>yyyy-MM-dd</code>). Cor proporcional à intensidade relativa ao dia mais ativo.</>
            },
            {
              dot: "bg-error", title: "Mapa de Risco (Bubble)",
              text: <><span className="text-text">O que mede:</span> Posição de risco de cada projeto em 3 dimensões simultâneas.<br /><span className="text-text">Lógica:</span> Eixo X = taxa de atraso; Eixo Y = completude média; Tamanho = volume total de issues. Projetos no canto superior esquerdo (baixo atraso, alta completude) têm menor risco.</>
            },
            {
              dot: "bg-warning", title: "Funil de Completude",
              text: <><span className="text-text">O que mede:</span> Taxa de conversão de issues ao longo das etapas de maturidade operacional.<br /><span className="text-text">Lógica:</span> Sequência de filtros cumulativos: Total → Com Responsável → Com Prazo → Em Sprint → Concluídas. Cada camada revela onde o processo gargala.</>
            },
            {
              dot: "bg-primary", title: "Radar de Saúde Multidimensional",
              text: <><span className="text-text">O que mede:</span> Perfil de saúde operacional de cada projeto em 5 eixos.<br /><span className="text-text">Lógica:</span> (1) Completude de dados; (2) Pontualidade = <code>1 - overdueRate</code>; (3) Taxa de conclusão = done/total; (4) Alocação = com responsável/total; (5) Cobertura de Sprint. Escala 0–100.</>
            },
            {
              dot: "bg-success", title: "Tempo de Resolução (Lead Time)",
              text: <><span className="text-text">O que mede:</span> Eficiência operacional e velocidade de entrega.<br /><span className="text-text">Lógica:</span> <code>avg(data_conclusão - data_início)</code> para issues "Done" por projeto. O gráfico de distribuição de lead time exibe a mediana (P50), P25 e P75 para análise de variabilidade do processo.</>
            },
            {
              dot: "bg-line", title: "Matriz de Colaboração",
              text: <><span className="text-text">O que mede:</span> Padrões de delegação entre membros da equipe.<br /><span className="text-text">Lógica:</span> Contagem de issues onde <code>reporter ≠ assignee</code>. Cada célula mostra quantas vezes o membro da linha delegou para o membro da coluna. Alta intensidade revela pares de colaboração frequentes.</>
            },
            {
              dot: "bg-primary", title: "Top Workload",
              text: <><span className="text-text">O que mede:</span> Concentração de volume de trabalho por colaborador.<br /><span className="text-text">Lógica:</span> Volume total de issues ativas atribuídas por usuário. Ranking decrescente dos 10 usuários com maior número de chaves associadas. Monitora risco de sobrecarga operacional.</>
            },
            {
              dot: "bg-warning", title: "Distribuição de Idade do Backlog",
              text: <><span className="text-text">O que mede:</span> Saúde do backlog em aberto pelo tempo desde a criação de cada issue.<br /><span className="text-text">Lógica:</span> Issues com <code>statusCategory ≠ done</code> agrupadas em buckets: 0–7d (fresco), 8–15d, 16–30d, 31–60d, 61–90d e &gt;90d (crítico). Cor em gradiente verde→vermelho. Backlog dominado por buckets vermelhos indica débito acumulado ou falta de priorização.</>
            },
            {
              dot: "bg-error", title: "Cycle Time Scatterplot",
              text: <><span className="text-text">O que mede:</span> Distribuição do tempo de ciclo de cada issue concluída ao longo do tempo.<br /><span className="text-text">Lógica:</span> <code>cycle_time = resolvedAt − dateStart</code> (ou <code>created</code> se dateStart ausente). Cada ponto representa uma issue: eixo X = semana de conclusão (dd/MM), eixo Y = dias decorridos, cor = projeto. Clusters acima da média indicam gargalos; tendência crescente sinaliza aumento de complexidade ou débito operacional.</>
            },
          ].map(({ dot, title, text }) => (
            <div key={title} className="space-y-3">
              <h4 className="text-[11px] font-bold text-text uppercase tracking-tight flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded ${dot}`} />
                {title}
              </h4>
              <p className="text-[10px] text-text-secondary leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
