import React from "react";
import { Share2, FileDown, ExternalLink, Check } from "lucide-react";
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
  setSelectedIssueForDetail: (issue: NormalizedIssue | null) => void;
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
  setSelectedIssueForDetail,
}) => {
  return (
    <div className="col-span-12 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded border border-line gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary font-bold uppercase whitespace-nowrap">Projeto:</span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="bg-sidebar text-xs font-bold py-1.5 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors max-w-[200px]">
              <option value="All">Todos os Projetos</option>
              {projectData.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary font-bold uppercase whitespace-nowrap">Busca:</span>
            <input
              type="text"
              placeholder="Chave ou identificação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-sidebar text-xs font-bold py-1.5 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors w-48 placeholder:text-text-secondary/40"
            />
          </div>
          <button onClick={copyShareLink} className={cn("flex items-center gap-2 px-3 py-1.5 rounded border transition-all", copySuccess ? "bg-success/20 border-success text-success" : "bg-sidebar border-line text-text hover:bg-sidebar-active")} title="Copiar link com filtro de projeto">
            {copySuccess ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            <span className="text-[10px] font-bold uppercase">{copySuccess ? "Copiado!" : "Compartilhar Filtro"}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase transition-colors">
            <FileDown className="w-3 h-3" /> Exportar Report (.CSV)
          </button>
          <div className="text-[10px] text-text-secondary font-bold uppercase">
            Exibindo <span className="text-primary">{diligenceAnomalies.length}</span> pendências detectadas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 bento-card p-4 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-text uppercase tracking-widest italic opacity-70">Execução do Protocolo Crítico — Correções de Campo Urgentes</h3>
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
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="text-[10px] uppercase text-text-secondary border-b border-line font-bold tracking-widest">
                  <th className="pb-3 px-4">Projeto</th>
                  <th className="pb-3 px-4">Chave</th>
                  <th className="pb-3 px-4 min-w-[300px]">Identificação</th>
                  <th className="pb-3 px-4">Responsável</th>
                  <th className="pb-3 px-4 text-center min-w-[140px]">Entrega</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 px-4">Pendências</th>
                  <th className="pb-3 px-4 text-right">Acesso</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {paginatedDiligence.map(issue => (
                  <tr key={issue.key} className="border-b border-line hover:bg-sidebar-active transition-colors group cursor-pointer" onClick={() => setSelectedIssueForDetail(issue)}>
                    <td className="py-4 px-4"><span className="text-[10px] font-bold text-text-secondary group-hover:text-text transition-colors uppercase tracking-tight">{issue.projectName}</span></td>
                    <td className="py-4 px-4 font-mono text-primary font-bold">{issue.key}</td>
                    <td className="py-4 px-4">
                      <p className="text-text font-semibold group-hover:text-primary transition-colors">{issue.summary}</p>
                      <p className="text-[9px] text-text-secondary uppercase font-bold tracking-tight">{issue.issueType}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", issue.assignee ? "bg-sidebar border border-line text-text-secondary" : "bg-error/10 text-error uppercase")}>
                        {issue.assignee || "Não Atribuído"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn("font-mono font-bold", issue.isOverdue ? "text-error" : "text-text-secondary")}>
                          {issue.dueDate ? format(parseISO(issue.dueDate), "dd-MM-yy") : "NULL"}
                        </span>
                        {issue.isOverdue && <span className="text-[8px] text-error font-bold uppercase tracking-tight">Atrasada</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn("font-bold", issue.completenessScore < 0.5 ? "text-error" : "text-warning")}>{(issue.completenessScore * 100).toFixed(0)}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {issue.missingFields.map(f => (
                          <span key={f} className="text-[9px] font-bold px-1.5 py-0.5 bg-sidebar border border-line text-text-secondary rounded">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <a href={`https://jira.casahacker.org/browse/${issue.key}`} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-primary transition-colors">
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
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
