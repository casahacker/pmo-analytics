import React, { useState } from "react";
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
  pdfPendingIssues: { key: string; summary: string; bottleneckReason: string; assignee?: string; sprintName?: string }[];
  onOpenDocumenso: () => void;
}

// Bottleneck severity config used in both web preview and PDF
const BOTTLENECK_META: Record<string, { dotClass: string; textClass: string }> = {
  "Atraso":              { dotClass: "bg-error",          textClass: "text-error" },
  "Impedimento":         { dotClass: "bg-warning",         textClass: "text-warning" },
  "Inativo":             { dotClass: "bg-warning",         textClass: "text-warning" },
  "Aguardando Alocação": { dotClass: "bg-text-secondary",  textClass: "text-text-secondary" },
};

function bottleneckSeverity(reason: string) {
  for (const [key, val] of Object.entries(BOTTLENECK_META)) {
    if (reason.startsWith(key)) return val;
  }
  return BOTTLENECK_META["Aguardando Alocação"];
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
  const storageKey = `pmo_report_${selectedProject}_${reportYear}${String(reportMonth + 1).padStart(2, "0")}`;

  const [observationsText, setObservationsText] = useState(
    () => localStorage.getItem(`${storageKey}_obs`) ?? ""
  );
  const [signatoryName, setSignatoryName] = useState(
    () => localStorage.getItem("pmo_signatoryName") ?? ""
  );
  const [signatoryRole, setSignatoryRole] = useState(
    () => localStorage.getItem("pmo_signatoryRole") ?? ""
  );

  // Persist to localStorage on change
  React.useEffect(() => {
    localStorage.setItem(`${storageKey}_obs`, observationsText);
  }, [storageKey, observationsText]);

  React.useEffect(() => {
    localStorage.setItem("pmo_signatoryName", signatoryName);
  }, [signatoryName]);

  React.useEffect(() => {
    localStorage.setItem("pmo_signatoryRole", signatoryRole);
  }, [signatoryRole]);

  // Reload observations when project/month/year changes
  React.useEffect(() => {
    setObservationsText(localStorage.getItem(`${storageKey}_obs`) ?? "");
  }, [storageKey]);

  const projectName  = projectData.find(p => p.key === selectedProject)?.name ?? selectedProject;
  const monthStr     = String(reportMonth + 1).padStart(2, "0");
  const refNumber    = `PMO-REL-${selectedProject}-${reportYear}${monthStr}`;
  const isAllProjects = selectedProject === "All";
  const currentStatus = reportStatus[selectedProject];

  const completedIssues = reportIssues.filter(i => i.statusCategory === "done");
  const pendingIssues   = reportIssues.filter(i => i.statusCategory !== "done");

  return (
    <div className="col-span-12 space-y-6">

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="bg-card p-4 rounded border border-line">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

          {/* Left: period + title */}
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-text uppercase tracking-widest">Relatório de Execução</h3>
              <p className="text-xs text-text-secondary font-bold uppercase">Status de Entregas por Mês e Ano</p>
            </div>
            <div className="flex gap-2">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="bg-sidebar border border-line text-xs font-bold uppercase text-text rounded px-2 py-1.5 outline-none focus:border-primary transition-colors"
              >
                {MONTHS_PT.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(parseInt(e.target.value))}
                className="bg-sidebar border border-line text-xs font-bold uppercase text-text rounded px-2 py-1.5 outline-none focus:border-primary transition-colors"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: parecer + actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Parecer PMO — segmented button group */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-bold uppercase whitespace-nowrap">Parecer PMO:</span>
              <div className="flex rounded overflow-hidden border border-line divide-x divide-line">
                <button
                  onClick={() => setReportStatus(prev => ({ ...prev, [selectedProject]: "approved" }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors",
                    currentStatus === "approved"
                      ? "bg-success text-white border-success"
                      : "bg-sidebar text-text-secondary hover:bg-sidebar-active hover:text-text"
                  )}
                >
                  <FileCheck className="w-3 h-3" /> Aprovada
                </button>
                <button
                  onClick={() => setReportStatus(prev => ({ ...prev, [selectedProject]: "warning" }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors",
                    currentStatus === "warning"
                      ? "bg-warning/20 text-warning border-warning"
                      : "bg-sidebar text-text-secondary hover:bg-sidebar-active hover:text-text"
                  )}
                >
                  <AlertTriangle className="w-3 h-3" /> Ressalvas
                </button>
                <button
                  onClick={() => setReportStatus(prev => ({ ...prev, [selectedProject]: "rejected" }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors",
                    currentStatus === "rejected"
                      ? "bg-error text-white"
                      : "bg-sidebar text-text-secondary hover:bg-sidebar-active hover:text-text"
                  )}
                >
                  <FileX className="w-3 h-3" /> Rejeitada
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-line hidden lg:block" />

            {/* PDF Export — disabled when "All projects" */}
            {isAllProjects ? (
              <div
                title="Selecione um projeto específico para exportar o relatório"
                className="flex items-center gap-2 px-4 py-2 bg-sidebar border border-line text-text-secondary rounded text-xs font-bold cursor-not-allowed opacity-50"
              >
                <FileDown className="w-4 h-4" /> Exportar PDF
              </div>
            ) : (
              <PDFDownloadLink
                document={
                  <RelatorioPDF
                    completedIssues={pdfCompletedIssues}
                    pendingIssues={pdfPendingIssues}
                    reportStatus={currentStatus}
                    reportMonth={reportMonth}
                    reportYear={reportYear}
                    selectedProject={selectedProject}
                    projectName={projectName}
                    kpis={kpis}
                    observationsText={observationsText}
                    signatoryName={signatoryName}
                    signatoryRole={signatoryRole}
                  />
                }
                fileName={`relatorio-execucao-${selectedProject}-${reportMonth + 1}-${reportYear}.pdf`}
              >
                {({ loading }) => (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-bold border border-primary/30 transition-all cursor-pointer">
                    <FileDown className="w-4 h-4" />
                    {loading ? "Gerando PDF..." : "Exportar PDF"}
                  </div>
                )}
              </PDFDownloadLink>
            )}

            {/* Documenso */}
            {!isAllProjects && (
              <button
                onClick={onOpenDocumenso}
                disabled={!currentStatus}
                title={!currentStatus ? "Selecione um Parecer PMO antes de assinar" : "Assinar com Documenso"}
                className="flex items-center gap-2 px-4 py-2 bg-success hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold border border-success transition-all"
              >
                <PenLine className="w-4 h-4" /> Assinar com Documenso
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── White paper (A4 preview) ─────────────────────────── */}
      <div className="bg-white text-text rounded p-8 print:p-0 print:shadow-none min-h-[900px] text-left flex flex-col border border-line max-w-5xl mx-auto w-full">

        {/* Header */}
        <header className="flex justify-between border-b-2 border-text pb-6 mb-8 items-end">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg"
                alt="Casa Hacker"
                className="h-8 w-auto brightness-0 opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="w-0.5 h-8 bg-line flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text tracking-tight uppercase">Associação Casa Hacker</span>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wide leading-none">PMO Data Analytics</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">RELATÓRIO DE EXECUÇÃO</h2>
            <p className="text-xs font-medium text-text-secondary mt-1">
              Projeto: {isAllProjects ? "Todos os Projetos Ativos" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}
            </p>
            <p className="text-xs text-text-secondary/60 font-mono mt-1">Ref: {refNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              "px-4 py-1 rounded text-xs font-bold uppercase tracking-wide border-2",
              currentStatus === "approved" ? "border-success text-success" :
              currentStatus === "warning"  ? "border-warning text-warning" :
              currentStatus === "rejected" ? "border-error text-error"     : "border-line text-text-secondary"
            )}>
              {currentStatus === "approved" ? "Execução Aprovada" :
               currentStatus === "warning"  ? "Aprovada com Ressalvas" :
               currentStatus === "rejected" ? "Execução Rejeitada"     : "Pendente de Avaliação"}
            </span>
            <span className="text-xs font-bold text-text-secondary">
              Ciclo: {MONTHS_PT[reportMonth]} / {reportYear}
            </span>
            <span className="text-xs text-text-secondary/60">
              Emitido em {format(new Date(), "dd/MM/yyyy HH:mm")} BRT
            </span>
          </div>
        </header>

        {/* Issue lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

          {/* Concluídas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-success" />
              <h5 className="text-xs font-bold uppercase text-success tracking-widest">
                Concluídas no Período
              </h5>
              <span className="ml-auto text-xs font-bold text-success">{completedIssues.length} itens</span>
            </div>
            <div className="bg-success/5 border border-success/20 rounded p-4 space-y-2 min-h-[120px]">
              {completedIssues.map(issue => (
                <div key={issue.key} className="flex gap-3 items-start border-b border-success/10 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs font-mono font-bold text-success shrink-0 pt-0.5">{issue.key}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight text-text">{issue.summary}</p>
                    {(issue.assignee || issue.sprintName) && (
                      <p className="text-xs text-text-secondary mt-1">
                        {[issue.assignee, issue.sprintName].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {completedIssues.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">Nenhuma entrega concluída no período.</p>
              )}
            </div>
          </div>

          {/* Pendentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-error" />
              <h5 className="text-xs font-bold uppercase text-error tracking-widest">
                Pendentes / Em Aberto
              </h5>
              <span className="ml-auto text-xs font-bold text-error">{pendingIssues.length} itens</span>
            </div>
            <div className="bg-error/5 border border-error/20 rounded p-4 flex flex-col min-h-[120px]">
              <div className="space-y-2 flex-grow">
                {pendingIssues.map(issue => {
                  const bottleneck = pdfPendingIssues.find(p => p.key === issue.key)?.bottleneckReason ?? "Aguardando Alocação";
                  const sev = bottleneckSeverity(bottleneck);
                  return (
                    <div key={issue.key} className="flex gap-3 items-start border-b border-error/10 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-mono font-bold text-error shrink-0 pt-0.5">{issue.key}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight text-text">{issue.summary}</p>
                        {(issue.assignee || issue.sprintName) && (
                          <p className="text-xs text-text-secondary mt-1">
                            {[issue.assignee, issue.sprintName].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className={cn("text-xs font-bold uppercase mt-1", sev.textClass)}>
                          Gargalo: {bottleneck}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {pendingIssues.length === 0 && (
                  <p className="text-xs text-text-secondary text-center py-4">Fila de execução limpa.</p>
                )}
              </div>
              {/* Bottleneck legend — severity colors */}
              <div className="mt-4 pt-3 border-t border-error/20">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2 opacity-60">Status de Gargalo:</p>
                <div className="grid grid-cols-1 gap-y-1.5">
                  {[
                    ["Atraso",              "Prazo vencido",                    "bg-error",          "text-error"          ],
                    ["Impedimento",         "Bloqueado por dependência externa", "bg-warning",        "text-warning"        ],
                    ["Inativo",             "Sem movimentação há mais de 15d",   "bg-warning",        "text-warning"        ],
                    ["Aguardando Alocação", "Aguardando execução no fluxo",      "bg-text-secondary", "text-text-secondary" ],
                  ].map(([label, desc, dotClass, textClass]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 flex-shrink-0", dotClass)} />
                      <span className={cn("text-xs font-bold leading-none uppercase", textClass)}>
                        {label}: <span className="font-normal normal-case">{desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI section */}
        <div className="bg-bg border-l-4 border-primary p-6 rounded mb-10">
          <h5 className="text-xs font-bold uppercase tracking-wide text-text mb-5 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary" />
            Indicadores de Desempenho do Ciclo
          </h5>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase text-text-secondary">Score de Qualidade</span>
              <p className="text-2xl font-bold tracking-tight text-text">
                {(kpis.avgCompleteness * 100).toFixed(0)} <span className="text-xs font-normal">pts</span>
              </p>
              <p className="text-xs text-text-secondary leading-tight">Completude média dos campos obrigatórios de tarefas e subtarefas.</p>
            </div>
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase text-text-secondary">Impacto em Atraso</span>
              <p className="text-2xl font-bold tracking-tight text-error">
                {kpis.overdue} <span className="text-xs font-normal">issues</span>
              </p>
              <p className="text-xs text-text-secondary leading-tight">Entregas com cronograma comprometido ou prazo vencido.</p>
            </div>
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold uppercase text-text-secondary">Capacidade Operacional</span>
              <p className="text-2xl font-bold tracking-tight text-primary">
                {kpis.total} <span className="text-xs font-normal">total</span>
              </p>
              <p className="text-xs text-text-secondary leading-tight">Demandas monitoradas neste ciclo de status.</p>
            </div>
          </div>
        </div>

        {/* Observations + Signature */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          {/* Observations */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wide text-text border-b border-line pb-2">
              Observações
            </h5>
            <textarea
              value={observationsText}
              onChange={(e) => setObservationsText(e.target.value)}
              placeholder="Insira notas adicionais sobre o progresso, riscos ou decisões tomadas no período monitorado..."
              rows={5}
              className="w-full border border-line bg-bg rounded p-3 text-xs text-text resize-none outline-none focus:border-primary transition-colors placeholder:text-text-secondary/40"
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wide text-text border-b border-line pb-2">
              Assinatura
            </h5>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome do responsável técnico"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full border border-line bg-bg rounded px-3 py-1.5 text-xs text-text outline-none focus:border-primary transition-colors placeholder:text-text-secondary/40"
              />
              <input
                type="text"
                placeholder="Cargo / Função"
                value={signatoryRole}
                onChange={(e) => setSignatoryRole(e.target.value)}
                className="w-full border border-line bg-bg rounded px-3 py-1.5 text-xs text-text outline-none focus:border-primary transition-colors placeholder:text-text-secondary/40"
              />
            </div>
            <div className="mt-6 border-t border-text pt-2 text-center">
              <p className="text-xs font-bold uppercase text-text">{signatoryName || "Assinatura Responsável Técnico"}</p>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">{signatoryRole || "ASSOCIAÇÃO CASA HACKER"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-line flex flex-col gap-4 text-text-secondary">
          <div className="flex justify-between items-start">
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold uppercase text-text leading-none">PMO Data Analytics</p>
              <p className="text-xs font-bold uppercase text-text-secondary">
                {isAllProjects ? "Relatório Global" : projectData.find(p => p.key === selectedProject)?.name} — {selectedProject}
              </p>
              <p className="text-xs font-bold tracking-wide text-error uppercase">Confidencial — Uso Interno</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-text leading-tight">© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</p>
              <p className="text-xs font-medium text-text-secondary leading-tight">R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</p>
            </div>
          </div>
          <div className="bg-bg p-4 border-l-4 border-text text-xs leading-relaxed text-text-secondary">
            Este documento só é válido se assinado eletronicamente por pessoa autorizada pela Diretoria Executiva por meio da plataforma de assinatura eletrônica exclusiva da Associação Casa Hacker com Certificado ICP-Brasil da Casa Hacker. A emissão do documento sem assinatura não tem validade.
          </div>
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide text-text-secondary">
            <p>Emitido em {format(new Date(), "dd/MM/yyyy HH:mm")} BRT (GMT -3)</p>
            <p className="font-mono text-text-secondary/60">{refNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
