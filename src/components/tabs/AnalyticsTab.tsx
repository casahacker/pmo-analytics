import React from "react";
import { TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { cn } from "../../lib/utils";
import { COLORS } from "../../lib/constants";
import { ChartTooltip } from "../ChartTooltip";
import { NormalizedIssue } from "../../lib/dataProcessor";

interface AnalyticsTabProps {
  trendData: any[];
  overdueDist: { key: string; name: string; rate: number }[];
  statusData: { name: string; value: number }[];
  projectDist: { name: string; done: number; inProgress: number; todo: number }[];
  missingFieldsData: { name: string; value: number }[];
  workloadData: { name: string; value: number }[];
  healthAssigneeData: { name: string; score: number }[];
  resolutionData: { key: string; avgDays: number }[];
  filteredIssues: NormalizedIssue[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  trendData,
  overdueDist,
  statusData,
  projectDist,
  missingFieldsData,
  workloadData,
  healthAssigneeData,
  resolutionData,
  filteredIssues,
}) => {
  return (
    <>
      {/* Trend Chart */}
      <div className="col-span-8 row-span-2 bento-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-text uppercase tracking-widest italic opacity-70">Tendência: Criadas vs. Concluídas (Semanal)</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="text-[10px] text-text-secondary font-bold uppercase">Resolvidas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-line"></span>
              <span className="text-[10px] text-text-secondary font-bold uppercase">Criadas</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#198038" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#198038" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#525252' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#525252' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="completed" name="Resolvidas" stroke="#198038" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
              <Area type="monotone" dataKey="created" name="Criadas" stroke="#8d8d8d" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue by Project */}
      <div className="col-span-4 row-span-2 bento-card p-6 overflow-hidden flex flex-col">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Taxas de Atraso por Projeto</h3>
        <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {overdueDist.slice(0, 10).map((proj) => (
            <div key={proj.key} className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate max-w-[140px]">{proj.name}</span>
                <span className="text-[9px] text-text-secondary uppercase font-bold tracking-tighter">{proj.key}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-mono px-2 py-0.5 rounded font-bold",
                  proj.rate > 30 ? "bg-error/10 text-error" : proj.rate > 10 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                )}>{proj.rate}%</span>
                <div className={cn("w-1.5 h-1.5 rounded-full", proj.rate > 30 ? "bg-error" : proj.rate > 10 ? "bg-warning" : "bg-success")}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Pie */}
      <div className="col-span-4 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-4 italic opacity-70">Status do Ciclo de Vida</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} innerRadius={45} outerRadius={60} paddingAngle={8} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="col-span-8 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Distribuição de Capacidade por Projeto</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectDist.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#525252' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#525252' }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f4f4' }} />
              <Bar dataKey="done" stackId="a" fill="#198038" radius={[0, 0, 0, 0]} barSize={32} />
              <Bar dataKey="inProgress" stackId="a" fill="#f1c21b" barSize={32} />
              <Bar dataKey="todo" stackId="a" fill="#0f62fe" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Debt Frequency */}
      <div className="col-span-4 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Frequência de Dívida de Dados</h3>
        <div className="h-48 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-4">
            {missingFieldsData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-text-secondary">
                  <span>{item.name}</span>
                  <span className="text-primary">{item.value} Ocorrências</span>
                </div>
                <div className="h-1 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-primary/50" style={{ width: `${Math.min(100, (item.value / Math.max(filteredIssues.length, 1)) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workload */}
      <div className="col-span-4 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Top 10 Workload (Por Responsável)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#525252' }} width={80} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4f4f4' }} />
              <Bar dataKey="value" fill="#0f62fe" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Ranking */}
      <div className="col-span-4 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Ranking de Saúde de Dados</h3>
        <div className="h-48 overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-3">
            {healthAssigneeData.map((user) => (
              <div key={user.name} className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary truncate max-w-[120px]">{user.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-line rounded-full overflow-hidden">
                    <div
                      className={cn("h-full", user.score < 50 ? "bg-error" : user.score < 80 ? "bg-warning" : "bg-success")}
                      style={{ width: `${user.score}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-text-secondary">{user.score.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution Time */}
      <div className="col-span-12 bento-card p-6">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 italic opacity-70">Ciclo de Vida: Tempo Médio de Resolução (Em Dias)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="key" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#525252' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avgDays" fill="#198038" radius={[4, 4, 0, 0]} name="Dias Médios" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technical Dictionary */}
      <div className="col-span-12 bento-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Dicionário de Métricas & Lógica Analítica</h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase">Referência Técnica para Decisores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { dot: "bg-success", title: "Volume de Demandas", text: <><span className="text-text">O que mede:</span> Quantidade absoluta de issues vinculadas ao filtro selecionado (ex: Sprint Ativa).<br/><span className="text-text">Lógica:</span> Contagem simples por Project Key.<br/><span className="text-text">Memória:</span> <code>count(issues) GROUP BY project</code>.</> },
            { dot: "bg-error", title: "Pendências Temporais", text: <><span className="text-text">O que mede:</span> Itens com data de entrega (duedate) anterior à data atual.<br/><span className="text-text">Lógica:</span> Filtra issues não finalizadas onde <code>duedate &lt; today</code>.<br/><span className="text-text">Memória:</span> Identifica gargalos críticos de cronograma por projeto.</> },
            { dot: "bg-warning", title: "Qualidade de Dados", text: <><span className="text-text">O que mede:</span> Nível de preenchimento dos campos obrigatórios do protocolo.<br/><span className="text-text">Lógica:</span> Média ponderada de 0-100% baseada na presença de Responsável, Datas, Sprint e Prioridade.<br/><span className="text-text">Memória:</span> <code>(sum(fields_filled) / total_required_fields) * 100</code>.</> },
            { dot: "bg-line", title: "Dívida de Dados", text: <><span className="text-text">O que mede:</span> Quais metadados estão sendo mais negligenciados pela operação.<br/><span className="text-text">Lógica:</span> Frequência acumulada de "null" ou "undefined" em campos chave.<br/><span className="text-text">Memória:</span> Frequência absoluta de campos vazios detectados no Protocolo Diligência.</> },
            { dot: "bg-primary", title: "Top Workload", text: <><span className="text-text">O que mede:</span> Concentração de volume de trabalho por colaborador.<br/><span className="text-text">Lógica:</span> Volume total de issues ativas (In Progress / To Do).<br/><span className="text-text">Memória:</span> Ranking decrescente dos 10 usuários com maior número de chaves associadas.</> },
            { dot: "bg-success", title: "Tempo de Resolução", text: <><span className="text-text">O que mede:</span> Eficiência operacional (Lead Time simplificado).<br/><span className="text-text">Lógica:</span> Diferença em dias entre a Data de Início (campo customizado) e a data de resolução.<br/><span className="text-text">Memória:</span> <code>avg(resolution_date - date_start)</code> apenas para itens em estado "Done".</> },
          ].map(({ dot, title, text }) => (
            <div key={title} className="space-y-3">
              <h4 className="text-[11px] font-bold text-text uppercase tracking-tight flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
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
