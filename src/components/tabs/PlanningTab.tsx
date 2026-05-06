import React from "react";
import { Calendar, FileText, ExternalLink, AlertTriangle, ShieldAlert, ListChecks, Timer } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "../../lib/utils";
import { NormalizedIssue } from "../../lib/dataProcessor";
import { StatusTag } from "../StatusTag";

interface PlanningKPIS {
  total: number;
  tasks: number;
  subtasks: number;
  itemsWithAnomalies: number;
  projectHasAnomalies: boolean;
}

interface PlanningTabProps {
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  projectData: { key: string; name: string }[];
  planningIssues: NormalizedIssue[];
  planningKPIS: PlanningKPIS;
  planningMonth: number;
  planningYear: number;
  setPlanningMonth: (m: number) => void;
  setPlanningYear: (y: number) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedIssueForDetail: (issue: NormalizedIssue | null) => void;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({
  selectedProject,
  setSelectedProject,
  projectData,
  planningIssues,
  planningKPIS,
  planningMonth,
  planningYear,
  setPlanningMonth,
  setPlanningYear,
  setCurrentTab,
  setSelectedIssueForDetail,
}) => {
  return (
    <div className="col-span-12 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded border border-line gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Período de Planejamento</span>
            <div className="flex gap-2">
              <select value={planningMonth} onChange={(e) => setPlanningMonth(parseInt(e.target.value))} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors">
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select value={planningYear} onChange={(e) => setPlanningYear(parseInt(e.target.value))} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="h-10 w-px bg-line hidden md:block"></div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Projeto Alvo</span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors max-w-[240px]">
              <option value="All">Visão Geral (Top 10)</option>
              {projectData.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
            </select>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary font-bold uppercase mb-1">Total de Itens Planejados</p>
          <p className="text-2xl font-bold text-text leading-none">{planningKPIS.total}</p>
        </div>
      </div>

      {planningKPIS.projectHasAnomalies && (
        <div className="bg-warning/10 border border-warning/30 rounded p-4 flex gap-4 items-center">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-warning tracking-wide mb-0.5">Aviso de Integridade de Planejamento</p>
            <p className="text-xs text-text leading-relaxed font-medium">
              Este projeto possui itens sob <span className="font-bold text-warning">diligência (campos obrigatórios ausentes ou atrasos)</span>. Os dados de planejamento acima podem estar imprecisos.
            </p>
          </div>
          <button onClick={() => setCurrentTab("diligence")} className="bg-warning text-text px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-colors shrink-0">Ver Diligências</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bento-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wide mb-1">Tarefas (Tasks)</p>
            <p className="text-2xl font-bold text-text">{planningKPIS.tasks}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center text-primary">
            <ListChecks className="w-5 h-5" />
          </div>
        </div>
        <div className="bento-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wide mb-1">Subtarefas</p>
            <p className="text-2xl font-bold text-text">{planningKPIS.subtasks}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center text-primary">
            <Timer className="w-5 h-5" />
          </div>
        </div>
        <div className="bento-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-error font-bold uppercase tracking-wide mb-1">Itens sob Diligência</p>
            <p className="text-2xl font-bold text-error">{planningKPIS.itemsWithAnomalies}</p>
          </div>
          <div className="h-12 w-12 bg-error/10 rounded flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-error" />
          </div>
        </div>
      </div>

      <div className="bento-card p-8">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary" /> Cronograma Mensal de Execução
        </h3>
        {planningIssues.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-4 opacity-40">
            <Calendar className="w-12 h-12 text-text-secondary" />
            <p className="text-sm font-bold text-text-secondary">Nenhum item planejado com Due Date para este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-text-secondary border-b border-line font-bold tracking-wide pb-3">
                  <th className="pb-3 px-4">Chave</th>
                  <th className="pb-3 px-4">Identificação</th>
                  <th className="pb-3 px-4">Responsável</th>
                  <th className="pb-3 px-4 text-center">Data Entrega</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-center">Diligência</th>
                  <th className="pb-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {planningIssues.slice(0, 50).map(issue => (
                  <tr key={issue.key} className="border-b border-line hover:bg-sidebar-active transition-colors group">
                    <td className="py-4 px-4 font-mono text-primary font-bold">{issue.key}</td>
                    <td className="py-4 px-4">
                      <p className="text-text font-semibold group-hover:text-primary transition-colors">{issue.summary}</p>
                      <p className="text-xs text-text-secondary uppercase font-bold tracking-tight">{issue.issueType}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-bold", issue.assignee ? "bg-sidebar border border-line text-text-secondary" : "bg-error/10 text-error uppercase")}>
                        {issue.assignee || "Não Atribuído"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn("font-mono font-bold", issue.isOverdue ? "text-error" : "text-text-secondary")}>
                        {issue.dueDate ? format(parseISO(issue.dueDate), "dd/MM/yyyy") : <span className="text-text-secondary">—</span>}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <StatusTag status={issue.status} statusCategory={issue.statusCategory as any} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={cn("text-xs font-bold",
                          issue.completenessScore >= 0.8 ? "text-success" :
                          issue.completenessScore >= 0.5 ? "text-warning" : "text-error"
                        )}>{(issue.completenessScore * 100).toFixed(0)}%</span>
                        {issue.isDiligence && <span className="text-[10px] text-error font-bold uppercase leading-none">Alerta</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedIssueForDetail(issue)} className="p-1.5 rounded bg-sidebar border border-line text-text-secondary hover:bg-sidebar-active hover:text-text transition-colors" title="Ver Detalhes">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <a href={`https://jira.casahacker.org/browse/${issue.key}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" aria-label="Abrir no Jira" title="Abrir no Jira">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
