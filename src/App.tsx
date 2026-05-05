import { pdf } from "@react-pdf/renderer";
import { RelatorioPDF } from "./components/RelatorioPDF";
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  PenLine
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { KPIWidget } from "./components/KPIWidget";
import { normalizeIssues, NormalizedIssue } from "./lib/dataProcessor";
import {
  getKPISummary,
  getIssuesByStatus,
  getTrendData,
  getIssuesByProject,
  getOverdueByProject,
  getMissingFieldsFrequency,
  getWorkloadByAssignee,
  getHealthByAssignee,
  getResolutionTimeByProject
} from "./lib/analytics";
import { format, parseISO, differenceInDays } from "date-fns";
import { cn } from "./lib/utils";
import { MONTHS_PT } from "./lib/constants";
import { InlineNotification } from "./components/InlineNotification";
import { AnalyticsTab } from "./components/tabs/AnalyticsTab";
import { NotificationsTab } from "./components/tabs/NotificationsTab";
import { ReportsTab } from "./components/tabs/ReportsTab";
import { PlanningTab } from "./components/tabs/PlanningTab";
import { DiligenceTab } from "./components/tabs/DiligenceTab";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rawIssues, setRawIssues] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState("analytics");
  const initialIssueKey = useRef<string | null>(null);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedAssignee, setSelectedAssignee] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalCopySuccess, setModalCopySuccess] = useState(false);
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<NormalizedIssue | null>(null);
  const [showDocumensoModal, setShowDocumensoModal] = useState(false);
  const [docSignatoryName, setDocSignatoryName] = useState("");
  const [docSignatoryEmail, setDocSignatoryEmail] = useState("");
  const [documensoLoading, setDocumensoLoading] = useState(false);
  const [documensoError, setDocumensoError] = useState<string | null>(null);
  const [documensoSigningUrl, setDocumensoSigningUrl] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<Record<string, "approved" | "warning" | "rejected">>({});
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [planningMonth, setPlanningMonth] = useState(new Date().getMonth());
  const [planningYear, setPlanningYear] = useState(new Date().getFullYear());
  const itemsPerPage = 50;
  const normalizedIssues = useMemo(() => normalizeIssues(rawIssues), [rawIssues]);

  const globalStats = useMemo(() => {
    const total = normalizedIssues.length;
    if (total === 0) return { avgCompleteness: 0, overdueRate: 0 };
    const avgComp = normalizedIssues.reduce((acc, i) => acc + i.completenessScore, 0) / total;
    const overdueTotal = normalizedIssues.filter(i => i.isOverdue).length;
    return { avgCompleteness: avgComp, overdueRate: (overdueTotal / total) * 100 };
  }, [normalizedIssues]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");
    if (project) setSelectedProject(project);
    const tab = params.get("tab");
    const validTabs = ["analytics", "planning", "diligence", "reports", "notifications"];
    if (tab && validTabs.includes(tab)) setCurrentTab(tab);
    initialIssueKey.current = params.get("issue");
  }, []);

  useEffect(() => {
    const issueKey = initialIssueKey.current;
    if (issueKey && normalizedIssues.length > 0 && !selectedIssueForDetail) {
      const issue = normalizedIssues.find(i => i.key === issueKey);
      if (issue) setSelectedIssueForDetail(issue);
    }
  }, [normalizedIssues]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedProject !== "All") url.searchParams.set("project", selectedProject);
    else url.searchParams.delete("project");
    if (selectedIssueForDetail) url.searchParams.set("issue", selectedIssueForDetail.key);
    else url.searchParams.delete("issue");
    if (currentTab !== "analytics") url.searchParams.set("tab", currentTab);
    else url.searchParams.delete("tab");
    window.history.replaceState({}, "", url);
  }, [selectedProject, selectedIssueForDetail, currentTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const issuesRes = await axios.get("/api/issues");
      setRawIssues(issuesRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [selectedProject, selectedAssignee, searchQuery]);

  const filteredIssues = useMemo(() => {
    return normalizedIssues.filter(i => {
      const matchProject = selectedProject === "All" || i.projectKey === selectedProject;
      const matchAssignee = selectedAssignee === "All" || i.assignee === selectedAssignee;
      const matchSearch = searchQuery === "" ||
        i.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchAssignee && matchSearch;
    });
  }, [normalizedIssues, selectedProject, selectedAssignee, searchQuery]);

  const reportIssues = useMemo(() => {
    return filteredIssues.filter(issue => {
      if (issue.statusCategory === "done") {
        const dateStr = issue.resolvedAt || issue.updated;
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return date.getMonth() === reportMonth && date.getFullYear() === reportYear;
      }
      const dueStr = issue.dueDate;
      if (dueStr) {
        const dueDate = parseISO(dueStr);
        const isScheduledOrOverdue = (dueDate.getFullYear() < reportYear) ||
                                     (dueDate.getFullYear() === reportYear && dueDate.getMonth() <= reportMonth);
        return isScheduledOrOverdue;
      }
      const updatedDate = parseISO(issue.updated);
      return updatedDate.getMonth() === reportMonth && updatedDate.getFullYear() === reportYear;
    });
  }, [filteredIssues, reportMonth, reportYear]);

  const getBottleneckReason = (issue: NormalizedIssue) => {
    if (issue.statusCategory === "done") return null;
    const now = new Date();
    if (issue.dueDate && parseISO(issue.dueDate) < now) return "Atraso: Prazo Expirado";
    if (issue.status === "Blocked" || issue.status === "Impedimento") return "Impedimento: Bloqueio";
    if (differenceInDays(now, parseISO(issue.updated)) > 15) return "Inativo (>15 dias parado)";
    return "Aguardando Alocação";
  };

  const pdfCompletedIssues = useMemo(() =>
    reportIssues.filter(i => i.statusCategory === "done").map(i => ({ key: i.key, summary: i.summary })),
    [reportIssues]
  );

  const pdfPendingIssues = useMemo(() =>
    reportIssues.filter(i => i.statusCategory !== "done").map(i => ({
      key: i.key, summary: i.summary, bottleneckReason: getBottleneckReason(i) ?? "Aguardando Alocação"
    })),
    [reportIssues]
  );

  const projectData = useMemo(() => {
    const map = new Map<string, string>();
    normalizedIssues.forEach(i => { if (!map.has(i.projectKey)) map.set(i.projectKey, i.projectName); });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name })).sort((a,b) => a.name.localeCompare(b.name));
  }, [normalizedIssues]);

  const projects = useMemo(() => projectData.map(p => p.key), [projectData]);
  const assignees = useMemo(() => Array.from(new Set(normalizedIssues.map(i => i.assignee).filter(Boolean))).sort() as string[], [normalizedIssues]);

  const kpis = useMemo(() => getKPISummary(filteredIssues), [filteredIssues]);
  const statusData = useMemo(() => getIssuesByStatus(filteredIssues), [filteredIssues]);
  const trendData = useMemo(() => getTrendData(filteredIssues), [filteredIssues]);
  const projectDist = useMemo(() => getIssuesByProject(filteredIssues), [filteredIssues]);
  const overdueDist = useMemo(() => getOverdueByProject(filteredIssues), [filteredIssues]);
  const missingFieldsData = useMemo(() => getMissingFieldsFrequency(filteredIssues), [filteredIssues]);
  const workloadData = useMemo(() => getWorkloadByAssignee(filteredIssues), [filteredIssues]);
  const healthAssigneeData = useMemo(() => getHealthByAssignee(filteredIssues), [filteredIssues]);
  const resolutionData = useMemo(() => getResolutionTimeByProject(filteredIssues), [filteredIssues]);

  const planningIssues = useMemo(() => {
    return filteredIssues.filter(issue => {
      if (!issue.dueDate) return false;
      const dueDate = parseISO(issue.dueDate);
      return dueDate.getMonth() === planningMonth && dueDate.getFullYear() === planningYear;
    });
  }, [filteredIssues, planningMonth, planningYear]);

  const planningKPIS = useMemo(() => {
    const total = planningIssues.length;
    const tasks = planningIssues.filter(i => !i.isSubtask).length;
    const subtasks = planningIssues.filter(i => i.isSubtask).length;
    const itemsWithAnomalies = planningIssues.filter(i => i.isDiligence).length;
    const projectHasAnomalies = filteredIssues.some(i => i.isDiligence);
    return { total, tasks, subtasks, itemsWithAnomalies, projectHasAnomalies };
  }, [planningIssues, filteredIssues]);

  const diligenceAnomalies = useMemo(() => {
    return filteredIssues.filter(i => i.isDiligence).sort((a,b) => (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0));
  }, [filteredIssues]);

  const totalPages = Math.ceil(diligenceAnomalies.length / itemsPerPage);
  const paginatedDiligence = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return diligenceAnomalies.slice(start, start + itemsPerPage);
  }, [diligenceAnomalies, currentPage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await axios.post("/api/refresh");
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyShareLink = () => {
    const url = new URL(window.location.href);
    if (selectedProject !== "All") url.searchParams.set("project", selectedProject);
    navigator.clipboard.writeText(url.toString());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const exportToCSV = () => {
    const data = diligenceAnomalies.map(i => ({
      Key: i.key, Projeto: i.projectName, Resumo: i.summary, Status: i.statusName,
      Prioridade: i.priority, Responsável: i.assignee || "Sem Responsável",
      "Vencimento": i.dueDate ? format(parseISO(i.dueDate), "dd/MM/yyyy") : "N/A",
      "Dívida Técnica": i.missingFields.join(", ")
    }));
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const val = (row as any)[header] || "";
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `diligencia_${selectedProject === "All" ? "todos" : selectedProject}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyLinkToIssueDetail = (issueKey: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("issue", issueKey);
    navigator.clipboard.writeText(url.toString());
    setModalCopySuccess(true);
    setTimeout(() => setModalCopySuccess(false), 2000);
  };

  const handleDocumensoSign = async () => {
    setDocumensoLoading(true);
    setDocumensoError(null);
    try {
      const blob = await pdf(
        <RelatorioPDF
          completedIssues={pdfCompletedIssues}
          pendingIssues={pdfPendingIssues}
          reportStatus={reportStatus[selectedProject]}
          reportMonth={reportMonth}
          reportYear={reportYear}
          selectedProject={selectedProject}
          projectName={projectData.find((p: {key: string; name: string}) => p.key === selectedProject)?.name ?? selectedProject}
          kpis={kpis}
        />
      ).toBlob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const PARECER_LABEL: Record<string, string> = {
        approved: "APROVADO", warning: "APROVADO COM RESSALVAS", rejected: "REJEITADO",
      };
      const parecerLabel = PARECER_LABEL[reportStatus[selectedProject] ?? ""] ?? "";
      const title = `PMO — PARECER: ${parecerLabel} — Relatório de Execução — ${selectedProject} — ${MONTHS_PT[reportMonth]}/${reportYear}`;
      const { data } = await axios.post("/api/documenso/sign", {
        pdfBase64: base64, title, signatoryName: docSignatoryName, signatoryEmail: docSignatoryEmail,
      });
      setDocumensoSigningUrl(data.signingUrl);
      window.open(data.signingUrl, "_blank");
    } catch {
      setDocumensoError("Falha ao criar envelope. Verifique a configuração do Documenso.");
    } finally {
      setDocumensoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-bg">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary animate-pulse">Iniciando Pipeline de Dados...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-bg min-h-screen text-text font-sans selection:bg-primary/20">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        projects={projectData}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        assignees={assignees}
        selectedAssignee={selectedAssignee}
        onAssigneeChange={setSelectedAssignee}
      />

      <main className="flex-1 overflow-x-hidden flex flex-col">
        <header className="px-10 py-6 border-b border-line flex justify-between items-end bg-sidebar">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <img
                src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg"
                alt="Casa Hacker"
                className="h-10 w-auto brightness-0 opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-xl font-light text-text-secondary uppercase tracking-widest leading-none">PMO Data Analytics</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-[#198038] rounded-full shadow-[0_0_8px_rgba(25,128,56,0.5)]"></div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter">API REST jira.casahacker.org</span>
                </div>
              </div>
            </div>
            <h2 className="text-sm font-bold tracking-tight text-text-secondary capitalize">
              Dashboard Operacional <span className="text-text-secondary font-light italic">
                {currentTab === "analytics" && "• Insights & Performance"}
                {currentTab === "diligence" && "• Protocolo de Diligência"}
                {currentTab === "notifications" && "• Notificações Formais"}
                {currentTab === "reports" && "• Relatórios de Status"}
                {currentTab === "planning" && "• Planejamento Mensal"}
              </span>
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-secondary uppercase font-semibold">Filtro Ativo</span>
            <span className="text-xs text-text font-medium">{selectedProject === "All" ? "Em 10 Projetos" : selectedProject}</span>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1800px] mx-auto w-full flex-grow">
          <div className="grid grid-cols-12 gap-4">
            {/* KPI Row */}
            <div className="col-span-3">
              <KPIWidget title="Total de Issues" value={kpis.total} icon={BarChart3} />
            </div>
            <div className="col-span-3">
              <KPIWidget
                title="Atrasadas (Risco)"
                value={kpis.overdue}
                icon={AlertCircle}
                className={kpis.overdue > 0 ? "border-error/30 bg-error/5" : ""}
              />
            </div>
            <div className="col-span-3">
              <KPIWidget
                title="Completude de Dados"
                value={(kpis.avgCompleteness * 100).toFixed(1) + "%"}
                icon={CheckCircle2}
                description="Score de Qualidade"
              />
            </div>
            <div className="col-span-3">
              <KPIWidget title="Vol. Backlog" value={kpis.openIssues} icon={Clock} />
            </div>

            {currentTab === "analytics" ? (
              <AnalyticsTab
                trendData={trendData}
                overdueDist={overdueDist}
                statusData={statusData}
                projectDist={projectDist}
                missingFieldsData={missingFieldsData}
                workloadData={workloadData}
                healthAssigneeData={healthAssigneeData}
                resolutionData={resolutionData}
                filteredIssues={filteredIssues}
              />
            ) : currentTab === "notifications" ? (
              <NotificationsTab
                selectedProject={selectedProject}
                projectData={projectData}
                kpis={kpis}
                globalStats={globalStats}
                diligenceAnomalies={diligenceAnomalies}
              />
            ) : currentTab === "reports" ? (
              <ReportsTab
                selectedProject={selectedProject}
                projectData={projectData}
                kpis={kpis}
                reportIssues={reportIssues}
                reportMonth={reportMonth}
                reportYear={reportYear}
                setReportMonth={setReportMonth}
                setReportYear={setReportYear}
                reportStatus={reportStatus}
                setReportStatus={setReportStatus}
                pdfCompletedIssues={pdfCompletedIssues}
                pdfPendingIssues={pdfPendingIssues}
                onOpenDocumenso={() => { setShowDocumensoModal(true); setDocumensoSigningUrl(null); setDocumensoError(null); }}
              />
            ) : currentTab === "planning" ? (
              <PlanningTab
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                projectData={projectData}
                planningIssues={planningIssues}
                planningKPIS={planningKPIS}
                planningMonth={planningMonth}
                planningYear={planningYear}
                setPlanningMonth={setPlanningMonth}
                setPlanningYear={setPlanningYear}
                setCurrentTab={setCurrentTab}
                setSelectedIssueForDetail={setSelectedIssueForDetail}
              />
            ) : currentTab === "diligence" ? (
              <DiligenceTab
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                projectData={projectData}
                diligenceAnomalies={diligenceAnomalies}
                paginatedDiligence={paginatedDiligence}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                copySuccess={copySuccess}
                copyShareLink={copyShareLink}
                exportToCSV={exportToCSV}
                setSelectedIssueForDetail={setSelectedIssueForDetail}
              />
            ) : null}
          </div>
        </div>

        <footer className="px-10 py-10 border-t border-line flex flex-col gap-8 text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-auto">
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <span>Python 3.11</span>
              <span>Streamlit React-Shim</span>
              <span>Jira REST v2</span>
              <span>Data source jira.casahacker.org</span>
            </div>
            <div>Monitoramento em tempo real • {format(new Date(), "dd/MM/yyyy HH:mm")} BRT (GMT -3)</div>
          </div>
          <div className="pt-8 border-t border-line flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1">
              <div className="text-success/80">Confidencial - Uso Interno</div>
              <div>© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</div>
              <div className="normal-case text-text-secondary font-medium tracking-normal text-[9px]">R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</div>
            </div>
          </div>
        </footer>
      </main>

      {/* Issue Detail Modal */}
      {selectedIssueForDetail && (
        <div role="dialog" aria-modal="true" aria-label="Detalhes da Tarefa" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-line rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex justify-between items-start bg-sidebar">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedIssueForDetail.key}</span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{selectedIssueForDetail.projectName}</span>
                </div>
                <h2 className="text-lg font-bold text-text leading-tight">{selectedIssueForDetail.summary}</h2>
              </div>
              <button onClick={() => setSelectedIssueForDetail(null)} aria-label="Fechar modal" className="p-2 hover:bg-sidebar-active rounded-full transition-colors text-text-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-xl">×</div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Status", value: selectedIssueForDetail.status },
                  { label: "Prioridade", value: selectedIssueForDetail.priority },
                  { label: "Responsável", value: selectedIssueForDetail.assignee || "Não Atribuído" },
                  { label: "Data de Entrega", value: selectedIssueForDetail.dueDate ? format(parseISO(selectedIssueForDetail.dueDate), "dd/MM/yyyy") : "Não definida" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 bg-sidebar rounded-xl border border-line">
                    <div className="text-[10px] font-bold text-text-secondary uppercase mb-1">{label}</div>
                    <div className="text-xs font-bold text-text uppercase">{value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-line"></div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em] italic">Guia de Correção</h3>
                  <div className="h-px flex-1 bg-line"></div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {selectedIssueForDetail.isOverdue && (
                    <InlineNotification
                      kind="error"
                      title="ATENÇÃO: ITEM EM ATRASO — CRÍTICO"
                      subtitle="Esta issue ultrapassou a Data de Entrega (Due Date). Entrega obrigatória imediata para evitar impacto no cronograma geral do projeto. Atualize o status ou repactue a data se houver justificativa."
                    />
                  )}
                  {selectedIssueForDetail.missingFields.length > 0 ? (
                    selectedIssueForDetail.missingFields.map((field) => (
                      <InlineNotification
                        key={field}
                        kind="warning"
                        title={`Pendência: ${field}`}
                        subtitle={
                          field === "Responsável" ? "Ação Requerida: Atribuir um responsável direto. Vá ao Jira, clique no campo 'Responsável' e selecione o membro da equipe encarregado." :
                          field === "Data de Entrega" ? "Ação Requerida: Definir data de entrega. Clique no campo 'Data de Entrega' (customfield_10501) e selecione a data final prevista." :
                          field === "Sprint" ? "Ação Requerida: Vincular a uma Sprint. No Jira, arraste a issue para o quadro da Sprint ativa ou selecione no campo 'Sprint'." :
                          (field === "Prioridade" || field === "Prioridade Indispensável") ? "Ação Requerida: Definir criticidade. Clique no ícone de prioridade e selecione o nível conforme o protocolo." :
                          field === "Data de Início" ? "Ação Requerida: Informar data de início. Preencha o campo customizado 'Data de Início' para tracking de lead time." :
                          field === "Link do Epic" ? "Ação Requerida: Vincular a um Epic. Use o campo 'Link do Epic' para associar esta tarefa ao seu projeto guarda-chuva." :
                          field === "Descrição" ? "Ação Requerida: Adicionar detalhamento. Escreva o escopo da tarefa para garantir que a equipe entenda os requisitos." : undefined
                        }
                      />
                    ))
                  ) : !selectedIssueForDetail.isOverdue ? (
                    <InlineNotification
                      kind="success"
                      title="Conformidade Total"
                      subtitle="Esta issue atende a todos os critérios do protocolo de diligência de dados."
                    />
                  ) : null}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 flex-wrap">
                <button onClick={() => setSelectedIssueForDetail(null)} className="px-4 py-2 text-[10px] font-bold uppercase text-text-secondary hover:text-text transition-colors">Fechar</button>
                <button
                  onClick={() => copyLinkToIssueDetail(selectedIssueForDetail.key)}
                  className={cn("px-6 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border",
                    modalCopySuccess ? "bg-success/10 border-success text-success" : "bg-sidebar border-line text-text hover:bg-sidebar-active"
                  )}
                >
                  {modalCopySuccess ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {modalCopySuccess ? "Link Copiado!" : "Copiar Link de Pendência"}
                </button>
                <button onClick={() => window.open(`https://jira.casahacker.org/browse/${selectedIssueForDetail.key}`, "_blank")} className="bg-primary hover:opacity-90 text-white px-6 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                  Corrigir no Jira <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documenso Modal */}
      {showDocumensoModal && (
        <div role="dialog" aria-modal="true" aria-label="Assinar Relatório" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text mb-4 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-success" /> Assinar Relatório com Documenso
            </h2>
            {!documensoSigningUrl ? (
              <>
                <p className="text-xs text-text-secondary mb-4">Informe os dados do signatário. Um e-mail com o link de assinatura será enviado automaticamente.</p>
                <div className="flex flex-col gap-3 mb-5">
                  <input value={docSignatoryName} onChange={e => setDocSignatoryName(e.target.value)} placeholder="Nome completo" className="bg-sidebar border border-line rounded px-3 py-2 text-xs text-text placeholder:text-text-secondary/40 outline-none focus:border-primary transition-colors" />
                  <input value={docSignatoryEmail} onChange={e => setDocSignatoryEmail(e.target.value)} placeholder="E-mail" type="email" className="bg-sidebar border border-line rounded px-3 py-2 text-xs text-text placeholder:text-text-secondary/40 outline-none focus:border-primary transition-colors" />
                </div>
                {documensoError && <p className="text-xs text-error mb-3">{documensoError}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowDocumensoModal(false)} className="px-4 py-2 text-xs text-text-secondary hover:text-text transition-colors">Cancelar</button>
                  <button onClick={handleDocumensoSign} disabled={!docSignatoryName || !docSignatoryEmail || documensoLoading} className="px-5 py-2 rounded text-xs font-bold uppercase tracking-wider bg-success hover:opacity-90 text-white disabled:opacity-50 flex items-center gap-2">
                    {documensoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine className="w-3 h-3" />}
                    {documensoLoading ? "Enviando…" : "Enviar para Assinatura"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-success mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Envelope criado! O link foi aberto em uma nova aba e um e-mail foi enviado para <strong className="ml-1">{docSignatoryEmail}</strong>.
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => window.open(documensoSigningUrl, "_blank")} className="px-4 py-2 text-xs text-text border border-line rounded hover:bg-sidebar-active transition-colors">Reabrir Link</button>
                  <button onClick={() => setShowDocumensoModal(false)} className="px-5 py-2 rounded text-xs font-bold bg-sidebar-active text-text hover:bg-line transition-colors">Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
