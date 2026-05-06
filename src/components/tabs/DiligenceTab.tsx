import React from "react";
import { Share2, FileDown, ExternalLink, Check, CheckCircle, ChevronRight } from "lucide-react";
import { TextInput } from "../TextInput";
import { format, parseISO } from "date-fns";
import { cn } from "../../lib/utils";
import { NormalizedIssue } from "../../lib/dataProcessor";
import { Pagination } from "../Pagination";

interface DiligenceTabProps {
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  projectData: { key: string; name: string }[];
  diligenceAnomalies: NormalizedIssue[];
  paginatedDiligence: NormalizedIssue[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (p: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  copySuccess: boolean;
  copyShareLink: () => void;
  exportToCSV: () => void;
  onOpenIssueDetail: (issue: NormalizedIssue, list: NormalizedIssue[]) => void;
}

export const DiligenceTab: React.FC<DiligenceTabProps> = ({
  selectedProject,
  setSelectedProject,
  projectData,
  diligenceAnomalies,
  paginatedDiligence,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  copySuccess,
  copyShareLink,
  exportToCSV,
  onOpenIssueDetail,
}) => {
  return (
    <div className="col-span-12 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded border border-line gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-bold uppercase whitespace-nowrap">Projeto:</span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="bg-sidebar text-xs font-bold py-1.5 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors max-w-[200px]">
              <option value="All">Todos os Projetos</option>
              {projectData.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
            </select>
          </div>
          <TextInput
            placeholder="Chave ou identificação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            className="w-48 font-bold"
            aria-label="Buscar issue"
          />
          <button onClick={copyShareLink} className={cn("flex items-center gap-2 px-3 py-1.5 rounded border transition-all", copySuccess ? "bg-success/20 border-success text-success" : "bg-sidebar border-line text-text hover:bg-sidebar-active")} title="Copiar link com filtro de projeto">
            {copySuccess ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            <span className="text-xs font-bold uppercase">{copySuccess ? "Copiado!" : "Compartilhar Filtro"}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-xs font-bold uppercase transition-colors">
            <FileDown className="w-3 h-3" /> Exportar Report (.CSV)
          </button>
          <div className="text-xs text-text-secondary font-bold uppercase">
            Exibindo <span className="text-error font-bold">{diligenceAnomalies.length}</span> pendências detectadas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 bento-card p-4 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Execução do Protocolo Crítico — Correções de Campo Urgentes</h3>
            <div className="flex items-center gap-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages || 1}
                onPageChange={setCurrentPage}
                totalItems={diligenceAnomalies.length}
                pageSize={itemsPerPage}
              />
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-xs uppercase text-text-secondary border-b border-line font-bold tracking-wide">
                  <th className="pb-3 px-4 hidden lg:table-cell">Projeto</th>
                  <th className="pb-3 px-4">Chave</th>
                  <th className="pb-3 px-4 min-w-[200px]">Identificação</th>
                  <th className="pb-3 px-4 hidden sm:table-cell">Responsável</th>
                  <th className="pb-3 px-4 hidden lg:table-cell">Sprint</th>
                  <th className="pb-3 px-4 text-center hidden sm:table-cell">Entrega</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 px-4 hidden md:table-cell">Pendências</th>
                  <th className="pb-3 px-2 text-right hidden lg:table-cell">Acesso</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {paginatedDiligence.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <CheckCircle className="w-8 h-8 text-success mx-auto mb-3" />
                      <p className="text-sm font-bold text-text">Nenhuma pendência detectada</p>
                      <p className="text-xs text-text-secondary mt-1">Todas as issues do filtro ativo estão com campos obrigatórios preenchidos.</p>
                    </td>
                  </tr>
                )}
                {paginatedDiligence.map(issue => (
                  <tr key={issue.key} className="border-b border-line hover:bg-sidebar-active transition-colors group cursor-pointer" onClick={() => onOpenIssueDetail(issue, paginatedDiligence)}>
                    <td className="py-4 px-4 hidden lg:table-cell"><span className="text-xs font-bold text-text-secondary group-hover:text-text transition-colors uppercase tracking-tight">{issue.projectName}</span></td>
                    <td className="py-4 px-4 font-mono text-primary font-bold text-xs">{issue.key}</td>
                    <td className="py-3 px-4">
                      <p className="text-text font-semibold group-hover:text-primary transition-colors leading-snug">{issue.summary}</p>
                      <p className="text-xs text-text-secondary uppercase font-bold tracking-tight">{issue.issueType}</p>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-bold", issue.assignee ? "bg-sidebar border border-line text-text-secondary" : "bg-error/10 text-error uppercase")}>
                        {issue.assignee || "Não Atribuído"}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <span className="text-xs text-text-secondary font-medium truncate max-w-[100px] block">
                        {issue.sprintName || <span className="text-text-secondary/50">—</span>}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center hidden sm:table-cell">
                      <div className="flex flex-col items-center">
                        <span className={cn("font-mono font-bold text-xs", issue.isOverdue ? "text-error" : "text-text-secondary")}>
                          {issue.dueDate ? format(parseISO(issue.dueDate), "dd/MM/yy") : <span className="text-text-secondary">—</span>}
                        </span>
                        {issue.isOverdue && <span className="text-[10px] text-error font-bold uppercase">Atrasada</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn("font-bold text-xs", issue.completenessScore >= 0.8 ? "text-success" : issue.completenessScore >= 0.5 ? "text-warning" : "text-error")}>{(issue.completenessScore * 100).toFixed(0)}%</span>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {issue.missingFields.map(f => {
                          const isCritical = f === "Responsável" || f === "Data de Entrega";
                          const isImportant = f === "Sprint" || f === "Data de Início" || f === "Prioridade";
                          return (
                            <span key={f} className={cn("text-xs font-bold px-1.5 py-0.5 rounded border",
                              isCritical ? "bg-error/10 border-error/20 text-error" :
                              isImportant ? "bg-warning/10 border-warning/20 text-warning" :
                              "bg-sidebar border-line text-text-secondary"
                            )}>{f}</span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <ChevronRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <a href={`https://jira.casahacker.org/browse/${issue.key}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-text-secondary hover:text-primary transition-colors" title="Abrir no Jira">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
