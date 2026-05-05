import React from "react";
import { FileDown, FileCheck, FileX, AlertTriangle, PenLine } from "lucide-react";
import { format } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { cn } from "../../lib/utils";
import { MONTHS_PT } from "../../lib/constants";
import { NormalizedIssue } from "../../lib/dataProcessor";
import { RelatorioPDF } from "../RelatorioPDF";
import { Button } from "../Button";

interface KPISummary {
  total: number;
  overdue: number;
  avgCompleteness: number;
}

interface ReportsTabProps {
  selectedProject: string;
  projectData: { key: string; name: string }[];
  kpis: KPISummary;
  reportIssues: NormalizedIssue[];
  reportMonth: number;
  reportYear: number;
  setReportMonth: (m: number) => void;
  setReportYear: (y: number) => void;
  reportStatus: Record<string, "approved" | "warning" | "rejected">;
  setReportStatus: React.Dispatch<React.SetStateAction<Record<string, "approved" | "warning" | "rejected">>>;
  pdfCompletedIssues: { key: string; summary: string }[];
  pdfPendingIssues: { key: string; summary: string; bottleneckReason: string }[];
  onOpenDocumenso: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  selectedProject,
  projectData,
  kpis,
  reportIssues,
  reportMonth,
  reportYear,
  setReportMonth,
  setReportYear,
  reportStatus,
  setReportStatus,
  pdfCompletedIssues,
  pdfPendingIssues,
  onOpenDocumenso,
}) => {
  return (
    <div className="col-span-12 space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded border border-line">
        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-text uppercase tracking-widest">RELATÓRIO DE EXECUÇÃO</h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase">Status de Entregas por Mês e Ano</p>
          </div>
          <div className="flex gap-2 mb-0.5 ml-4">
            <select value={reportMonth} onChange={(e) => setReportMonth(parseInt(e.target.value))} className="bg-sidebar border border-line text-[10px] font-bold uppercase text-text rounded px-2 py-1 outline-none focus:border-primary transition-colors">
              {MONTHS_PT.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select value={reportYear} onChange={(e) => setReportYear(parseInt(e.target.value))} className="bg-sidebar border border-line text-[10px] font-bold uppercase text-text rounded px-2 py-1 outline-none focus:border-primary transition-colors">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-[10px] text-text-secondary font-bold uppercase">Parecer PMO:</span>
            <div className="flex gap-1">
              <Button
                kind={reportStatus[selectedProject] === "approved" ? "primary" : "ghost"}
                size="sm"
                icon={<FileCheck className="w-3 h-3" />}
                onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "approved"}))}
                className={reportStatus[selectedProject] === "approved" ? "bg-success border-success hover:bg-success/90" : "hover:border-success/50"}
              >Aprovada</Button>
              <Button
                kind={reportStatus[selectedProject] === "warning" ? "tertiary" : "ghost"}
                size="sm"
                icon={<AlertTriangle className="w-3 h-3" />}
                onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "warning"}))}
                className={reportStatus[selectedProject] === "warning" ? "text-warning border-warning bg-warning/10 hover:bg-warning/20" : "hover:border-warning/50"}
              >Ressalvas</Button>
              <Button
                kind={reportStatus[selectedProject] === "rejected" ? "danger" : "ghost"}
                size="sm"
                icon={<FileX className="w-3 h-3" />}
                onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "rejected"}))}
                className={reportStatus[selectedProject] === "rejected" ? "" : "hover:border-error/50"}
              >Rejeitada</Button>
            </div>
          </div>
          <PDFDownloadLink
            document={<RelatorioPDF completedIssues={pdfCompletedIssues} pendingIssues={pdfPendingIssues} reportStatus={reportStatus[selectedProject]} reportMonth={reportMonth} reportYear={reportYear} selectedProject={selectedProject} projectName={projectData.find(p => p.key === selectedProject)?.name ?? selectedProject} kpis={kpis} />}
            fileName={`relatorio-execucao-${selectedProject}-${reportMonth + 1}-${reportYear}.pdf`}
          >
            {({ loading }) => (
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-bold border border-primary/30 transition-all">
                <FileDown className="w-4 h-4" />
                {loading ? "Gerando PDF..." : "Exportar PDF"}
              </button>
            )}
          </PDFDownloadLink>
          {selectedProject !== "All" && (
            <button onClick={onOpenDocumenso} disabled={!reportStatus[selectedProject]} className="flex items-center gap-2 px-4 py-2 bg-success hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold border border-success transition-all">
              <PenLine className="w-4 h-4" /> Assinar com Documenso
            </button>
          )}
        </div>
      </div>

      {/* Report Document (white) */}
      <div className="bg-white text-text rounded p-8 print:p-0 print:shadow-none min-h-[800px] text-left flex flex-col border border-line">
        <header className="flex justify-between border-b-2 border-text pb-6 mb-8 items-end">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <img src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg" alt="Casa Hacker" className="h-8 w-auto grayscale brightness-0" referrerPolicy="no-referrer" />
              <div className="h-8 w-px bg-line"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text tracking-tight uppercase">Associação Casa Hacker</span>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wide leading-none">PMO Data Analytics</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">RELATÓRIO DE EXECUÇÃO</h2>
            <p className="text-xs font-medium text-text-secondary">Projeto: {selectedProject === "All" ? "Todos os Projetos Ativos" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn("px-4 py-1 rounded text-xs font-bold uppercase tracking-wide mb-2 border-2",
              reportStatus[selectedProject] === "approved" ? "border-success text-success" :
              reportStatus[selectedProject] === "warning" ? "border-warning text-warning" :
              reportStatus[selectedProject] === "rejected" ? "border-error text-error" : "border-line text-text-secondary"
            )}>
              {reportStatus[selectedProject] === "approved" ? "Execução Aprovada" : reportStatus[selectedProject] === "warning" ? "Aprovada com Ressalvas" : reportStatus[selectedProject] === "rejected" ? "Execução Rejeitada" : "Pendente de Avaliação"}
            </span>
            <span className="text-[9px] font-bold text-text-secondary">Ciclo Monitorado: {MONTHS_PT[reportMonth]} / {reportYear}</span>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className="bg-success/5 p-4 border border-success/20 rounded">
              <h5 className="text-[10px] font-bold uppercase text-success mb-4 border-b border-success/20 pb-2 flex justify-between">
                Concluídas no Período <span>{reportIssues.filter(i => i.statusCategory === "done").length} Items</span>
              </h5>
              <div className="space-y-2">
                {reportIssues.filter(i => i.statusCategory === "done").map(issue => (
                  <div key={issue.key} className="flex gap-3 items-start border-b border-success/10 pb-2">
                    <span className="text-[9px] font-mono font-bold text-success shrink-0">{issue.key}</span>
                    <p className="text-[10px] font-medium leading-tight text-text">{issue.summary}</p>
                  </div>
                ))}
                {reportIssues.filter(i => i.statusCategory === "done").length === 0 && (
                  <p className="text-[10px] text-text-secondary text-center py-4">Nenhuma entrega concluída no período.</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-error/5 p-4 border border-error/20 rounded h-full flex flex-col">
              <h5 className="text-[10px] font-bold uppercase text-error mb-4 border-b border-error/20 pb-2 flex justify-between">
                Pendentes / Em Aberto <span>{reportIssues.filter(i => i.statusCategory !== "done").length} Items</span>
              </h5>
              <div className="space-y-2 flex-grow">
                {reportIssues.filter(i => i.statusCategory !== "done").map(issue => (
                  <div key={issue.key} className="flex gap-3 items-start border-b border-error/10 pb-2">
                    <span className="text-[9px] font-mono font-bold text-error shrink-0">{issue.key}</span>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-medium leading-tight text-text">{issue.summary}</p>
                      <p className="text-[8px] font-bold uppercase text-error text-left">
                        <span className="text-error">Gargalo:</span> {pdfPendingIssues.find(p => p.key === issue.key)?.bottleneckReason ?? "Aguardando Alocação"}
                      </p>
                    </div>
                  </div>
                ))}
                {reportIssues.filter(i => i.statusCategory !== "done").length === 0 && (
                  <p className="text-[10px] text-text-secondary text-center py-4">Fila de execução limpa.</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-error/20">
                <p className="text-[8px] font-bold text-error uppercase tracking-wide mb-1.5 opacity-60">Significado dos Status de Gargalo:</p>
                <div className="grid grid-cols-1 gap-y-1.5">
                  {[["Atraso", "Task com prazo original do Jira vencido"], ["Impedimento", "Task bloqueada por dependência externa"], ["Inativo", "Sem movimentação no Ticket por mais de 15 dias"], ["Aguardando Alocação", "Task no fluxo do mês aguardando execução"]].map(([label, desc]) => (
                    <div key={label} className="flex items-center gap-1.5 grayscale">
                      <div className="w-1 h-1 bg-error rounded"></div>
                      <span className="text-[7px] text-error font-bold leading-none uppercase"><span className="text-error">{label}:</span> {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-bg p-6 rounded border border-line mb-12">
          <h5 className="text-xs font-bold uppercase tracking-wide text-text mb-4 text-left">Análise Qualitativa da Notificação</h5>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-bold uppercase text-text-secondary">Score de Qualidade</span>
              <p className="text-xl font-bold tracking-tight text-text">{(kpis.avgCompleteness * 100).toFixed(0)} <span className="text-xs font-normal">pts</span></p>
              <p className="text-[10px] text-text-secondary leading-tight">Métrica baseada na completude das informações de tarefas e subtarefas.</p>
            </div>
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-bold uppercase text-text-secondary">Impacto em Atraso</span>
              <p className="text-xl font-bold tracking-tight text-error">{kpis.overdue} <span className="text-xs font-normal">Issues</span></p>
              <p className="text-[10px] text-text-secondary leading-tight">Volume de entregas com cronograma comprometido ou vencido.</p>
            </div>
            <div className="space-y-1 text-left">
              <span className="text-[9px] font-bold uppercase text-text-secondary">Capacidade Operacional</span>
              <p className="text-xl font-bold tracking-tight text-primary">{kpis.total} <span className="text-xs font-normal">Total</span></p>
              <p className="text-[10px] text-text-secondary leading-tight">Total de demandas monitoradas neste ciclo de status.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-12">
          <div className="space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wide text-text border-b border-line pb-2 text-left">Observações</h5>
            <div className="h-24 w-full border border-line bg-bg rounded p-3 text-xs text-text-secondary">Insira notas adicionais sobre o progresso, riscos ou decisões tomadas no período monitorado...</div>
          </div>
          <div className="flex flex-col justify-end items-center pb-2">
            <div className="w-full border-t border-text pt-2 text-center">
              <p className="text-[10px] font-bold uppercase text-text">Assinatura Responsável Técnico</p>
              <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wide">ASSOCIAÇÃO CASA HACKER</p>
            </div>
          </div>
        </div>
        <div className="mt-auto pt-16 border-t border-line flex flex-col gap-6 text-text-secondary">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-bold uppercase text-text leading-none">PMO Data Analytics</p>
              <p className="text-[9px] font-bold uppercase text-text-secondary">{selectedProject === "All" ? "Relatório Global" : (projectData.find(p => p.key === selectedProject)?.name)} - {selectedProject}</p>
              <p className="text-[8px] font-bold tracking-wide text-error uppercase">Confidencial - Uso Interno</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-bold text-text leading-tight">© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</p>
              <p className="text-[8px] font-medium text-text-secondary leading-tight">R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</p>
            </div>
          </div>
          <div className="bg-bg p-4 border-l-4 border-text text-[9px] leading-relaxed text-text-secondary">
            Este documento só é válido se assinado eletronicamente por pessoa autorizada pela Diretoria Executiva por meio da plataforma de assinatura eletrônica exclusiva da Associação Casa Hacker com Certificado ICP-Brasil da Casa Hacker. A emissão do documento sem assinatura não tem validade.
          </div>
          <div className="flex justify-between items-center text-[7px] font-bold uppercase tracking-wide text-text-secondary">
            <p>Emitido em {format(new Date(), "dd/MM/yyyy HH:mm")} BRT (GMT -3)</p>
            <p></p>
          </div>
        </div>
      </div>
    </div>
  );
};
