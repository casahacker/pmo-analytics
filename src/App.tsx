import { pdf } from "@react-pdf/renderer";
import { RelatorioPDF } from "./components/RelatorioPDF";
import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
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
  PenLine,
  SearchX,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  Filter,
  X,
  FileDown,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { AccessibilityBar } from "./components/AccessibilityBar";
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
  getResolutionTimeByProject,
  getSankeyFlowData,
  getCalendarActivityData,
  getRiskBubbleData,
  getTreemapByProject,
  getRadarHealthData,
  getFunnelData,
  getLeadTimeDistribution,
  getContributorMatrix,
  getCycleTimeScatter,
  getAgingDistribution,
} from "./lib/analytics";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "./lib/utils";
import { MONTHS_PT } from "./lib/constants";
import { InlineNotification } from "./components/InlineNotification";
import * as XLSX from "xlsx";

const AnalyticsTab = lazy(() => import("./components/tabs/AnalyticsTab").then(m => ({ default: m.AnalyticsTab })));
const NotificationsTab = lazy(() => import("./components/tabs/NotificationsTab").then(m => ({ default: m.NotificationsTab })));
const ReportsTab = lazy(() => import("./components/tabs/ReportsTab").then(m => ({ default: m.ReportsTab })));
const PlanningTab = lazy(() => import("./components/tabs/PlanningTab").then(m => ({ default: m.PlanningTab })));
const DiligenceTab = lazy(() => import("./components/tabs/DiligenceTab").then(m => ({ default: m.DiligenceTab })));

const TabSkeleton = () => (
  <div className="col-span-12 flex justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [rawIssues, setRawIssues] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState("analytics");
  const initialIssueKey = useRef<string | null>(null);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedAssignee, setSelectedAssignee] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("pmo_darkMode") === "1");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("pmo_highContrast") === "1");
  const [fontScale, setFontScale] = useState<0 | 1 | 2>(() => (Number(localStorage.getItem("pmo_fontScale") ?? 0) as 0 | 1 | 2));
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalCopySuccess, setModalCopySuccess] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<NormalizedIssue | null>(null);
  const [modalIssueList, setModalIssueList] = useState<NormalizedIssue[]>([]);

  const openIssueDetail = useCallback((issue: NormalizedIssue | null, list?: NormalizedIssue[]) => {
    setSelectedIssueForDetail(issue);
    if (list) setModalIssueList(list);
  }, []);

  const [showDocumensoModal, setShowDocumensoModal] = useState(false);
  const [docSignatoryName, setDocSignatoryName] = useState("");
  const [docSignatoryEmail, setDocSignatoryEmail] = useState("");
  const [documensoLoading, setDocumensoLoading] = useState(false);
  const [docStep, setDocStep] = useState<"idle" | "generating" | "uploading" | "signing">("idle");
  const [documensoError, setDocumensoError] = useState<string | null>(null);
  const [documensoSigningUrl, setDocumensoSigningUrl] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<Record<string, "approved" | "warning" | "rejected">>({});
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [planningMonth, setPlanningMonth] = useState(new Date().getMonth());
  const [planningYear, setPlanningYear] = useState(new Date().getFullYear());
  const itemsPerPage = 50;
  const normalizedIssues = useMemo(() => normalizeIssues(rawIssues), [rawIssues]);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("pmo_darkMode", darkMode ? "1" : "0");
  }, [darkMode]);

  // High contrast
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("pmo_highContrast", highContrast ? "1" : "0");
  }, [highContrast]);

  // Font scale
  useEffect(() => {
    const sizes: Record<number, string> = { 0: "16px", 1: "18px", 2: "20px" };
    document.documentElement.style.fontSize = sizes[fontScale];
    localStorage.setItem("pmo_fontScale", String(fontScale));
  }, [fontScale]);

  // Close sidebar on mobile when tab changes
  useEffect(() => { setSidebarOpen(false); }, [currentTab]);

  const globalStats = useMemo(() => {
    const total = normalizedIssues.length;
    if (total === 0) return { avgCompleteness: 0, overdueRate: 0 };
    const scorable = normalizedIssues.filter(i => i.issueType !== "Epic");
    const avgComp = scorable.length > 0
      ? scorable.reduce((acc, i) => acc + i.completenessScore, 0) / scorable.length
      : 0;
    const overdueTotal = normalizedIssues.filter(i => i.isOverdue).length;
    return { avgCompleteness: avgComp, overdueRate: (overdueTotal / total) * 100 };
  }, [normalizedIssues]);

  const [currentPage, setCurrentPage] = useState(1);

  // Restore URL state on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");
    if (project) setSelectedProject(project);
    const tab = params.get("tab");
    const validTabs = ["analytics", "planning", "diligence", "reports", "notifications"];
    if (tab && validTabs.includes(tab)) setCurrentTab(tab);
    initialIssueKey.current = params.get("issue");
    const assignee = params.get("assignee");
    if (assignee) setSelectedAssignee(assignee);
    const q = params.get("q");
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    const issueKey = initialIssueKey.current;
    if (issueKey && normalizedIssues.length > 0 && !selectedIssueForDetail) {
      const issue = normalizedIssues.find(i => i.key === issueKey);
      if (issue) setSelectedIssueForDetail(issue);
    }
  }, [normalizedIssues]);

  // Persist filters in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedProject !== "All") url.searchParams.set("project", selectedProject);
    else url.searchParams.delete("project");
    if (selectedIssueForDetail) url.searchParams.set("issue", selectedIssueForDetail.key);
    else url.searchParams.delete("issue");
    if (currentTab !== "analytics") url.searchParams.set("tab", currentTab);
    else url.searchParams.delete("tab");
    if (selectedAssignee !== "All") url.searchParams.set("assignee", selectedAssignee);
    else url.searchParams.delete("assignee");
    if (searchQuery) url.searchParams.set("q", searchQuery);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
  }, [selectedProject, selectedIssueForDetail, currentTab, selectedAssignee, searchQuery]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setFetchError(null);
    try {
      const issuesRes = await axios.get("/api/issues");
      setRawIssues(issuesRes.data);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      console.error("Failed to fetch data", err);
      setFetchError("Falha ao carregar dados do Jira. Verifique a conexão e tente novamente.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [selectedProject, selectedAssignee, searchQuery, filterStatus, filterPriority, filterType]);

  const filteredIssues = useMemo(() => {
    return normalizedIssues.filter(i => {
      const matchProject = selectedProject === "All" || i.projectKey === selectedProject;
      const matchAssignee = selectedAssignee === "All" || i.assignee === selectedAssignee;
      const matchSearch = searchQuery === "" ||
        i.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(i.statusCategory) || filterStatus.includes(i.status);
      const matchPriority = filterPriority.length === 0 || filterPriority.includes(i.priority);
      const matchType = filterType.length === 0 || filterType.includes(i.issueType);
      return matchProject && matchAssignee && matchSearch && matchStatus && matchPriority && matchType;
    });
  }, [normalizedIssues, selectedProject, selectedAssignee, searchQuery, filterStatus, filterPriority, filterType]);

  const activeFilterCount = filterStatus.length + filterPriority.length + filterType.length;

  const clearAllFilters = useCallback(() => {
    setSelectedProject("All");
    setSelectedAssignee("All");
    setSearchQuery("");
    setFilterStatus([]);
    setFilterPriority([]);
    setFilterType([]);
  }, []);

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
      key: i.key,
      summary: i.summary,
      bottleneckReason: getBottleneckReason(i) ?? "Aguardando Alocação",
      assignee:   i.assignee   ?? undefined,
      sprintName: i.sprintName ?? undefined,
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

  // Computed unique values for advanced filters
  const availableStatuses = useMemo(() => Array.from(new Set(normalizedIssues.map(i => i.statusCategory).filter(Boolean))).sort() as string[], [normalizedIssues]);
  const availablePriorities = useMemo(() => Array.from(new Set(normalizedIssues.map(i => i.priority).filter(Boolean))).sort() as string[], [normalizedIssues]);
  const availableTypes = useMemo(() => Array.from(new Set(normalizedIssues.map(i => i.issueType).filter(Boolean))).sort() as string[], [normalizedIssues]);

  const kpis = useMemo(() => getKPISummary(filteredIssues), [filteredIssues]);
  const statusData = useMemo(() => getIssuesByStatus(filteredIssues), [filteredIssues]);
  const trendData = useMemo(() => getTrendData(filteredIssues), [filteredIssues]);
  const projectDist = useMemo(() => getIssuesByProject(filteredIssues), [filteredIssues]);
  const overdueDist = useMemo(() => getOverdueByProject(filteredIssues), [filteredIssues]);
  const missingFieldsData = useMemo(() => getMissingFieldsFrequency(filteredIssues), [filteredIssues]);
  const workloadData = useMemo(() => getWorkloadByAssignee(filteredIssues), [filteredIssues]);
  const healthAssigneeData = useMemo(() => getHealthByAssignee(filteredIssues), [filteredIssues]);
  const resolutionData = useMemo(() => getResolutionTimeByProject(filteredIssues), [filteredIssues]);
  const sankeyData = useMemo(() => getSankeyFlowData(filteredIssues), [filteredIssues]);
  const calendarData = useMemo(() => getCalendarActivityData(filteredIssues), [filteredIssues]);
  const bubbleData = useMemo(() => getRiskBubbleData(filteredIssues), [filteredIssues]);
  const treemapData = useMemo(() => getTreemapByProject(filteredIssues), [filteredIssues]);
  const radarData = useMemo(() => getRadarHealthData(filteredIssues), [filteredIssues]);
  const funnelData = useMemo(() => getFunnelData(filteredIssues), [filteredIssues]);
  const leadTimeData = useMemo(() => getLeadTimeDistribution(filteredIssues), [filteredIssues]);
  const contributorData = useMemo(() => getContributorMatrix(filteredIssues), [filteredIssues]);
  const cycleTimeData = useMemo(() => getCycleTimeScatter(filteredIssues), [filteredIssues]);
  const agingData = useMemo(() => getAgingDistribution(filteredIssues), [filteredIssues]);

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
    setFetchError(null);
    try {
      await axios.post("/api/refresh");
      await fetchData(false);
      setRefreshSuccess(true);
      if (refreshSuccessTimerRef.current) clearTimeout(refreshSuccessTimerRef.current);
      refreshSuccessTimerRef.current = setTimeout(() => setRefreshSuccess(false), 3000);
    } catch {
      setFetchError("Falha ao atualizar dados. Tente novamente.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyShareLink = useCallback(() => {
    const url = new URL(window.location.href);
    if (selectedProject !== "All") url.searchParams.set("project", selectedProject);
    navigator.clipboard.writeText(url.toString());
    setCopySuccess(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopySuccess(false), 2000);
  }, [selectedProject]);

  const exportToCSV = useCallback(() => {
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
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [diligenceAnomalies, selectedProject]);

  const exportToXLSX = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // KPIs sheet
    const kpiData = [
      ["Indicador", "Valor"],
      ["Total de Issues", kpis.total],
      ["Issues Atrasadas", kpis.overdue],
      ["Score de Completude", `${(kpis.avgCompleteness * 100).toFixed(1)}%`],
      ["Backlog Aberto", kpis.openIssues],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), "KPIs");

    // Filtered issues sheet
    const issueRows = filteredIssues.map(i => ({
      Chave: i.key,
      Projeto: i.projectName,
      Resumo: i.summary,
      Status: i.statusName,
      Categoria: i.statusCategory,
      Prioridade: i.priority,
      Tipo: i.issueType,
      Responsável: i.assignee || "",
      Sprint: i.sprintName || "",
      "Due Date": i.dueDate ? format(parseISO(i.dueDate), "dd/MM/yyyy") : "",
      Atrasada: i.isOverdue ? "Sim" : "Não",
      "Score Completude": `${(i.completenessScore * 100).toFixed(0)}%`,
      "Campos Faltando": i.missingFields.join(", "),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(issueRows), "Issues");

    // Diligence anomalies sheet
    if (diligenceAnomalies.length > 0) {
      const diagRows = diligenceAnomalies.map(i => ({
        Chave: i.key,
        Projeto: i.projectName,
        Resumo: i.summary,
        Responsável: i.assignee || "Não Atribuído",
        "Due Date": i.dueDate ? format(parseISO(i.dueDate), "dd/MM/yyyy") : "",
        Atrasada: i.isOverdue ? "Sim" : "Não",
        "Score Completude": `${(i.completenessScore * 100).toFixed(0)}%`,
        Pendências: i.missingFields.join(", "),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diagRows), "Diligência");
    }

    const filename = `pmo-analytics_${selectedProject === "All" ? "todos" : selectedProject}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [filteredIssues, diligenceAnomalies, kpis, selectedProject]);

  const copyLinkToIssueDetail = useCallback((issueKey: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("issue", issueKey);
    navigator.clipboard.writeText(url.toString());
    setModalCopySuccess(true);
    if (modalCopyTimerRef.current) clearTimeout(modalCopyTimerRef.current);
    modalCopyTimerRef.current = setTimeout(() => setModalCopySuccess(false), 2000);
  }, []);

  const handleDocumensoSign = async () => {
    setDocumensoLoading(true);
    setDocumensoError(null);
    setDocStep("generating");
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
      setDocStep("uploading");
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
      setDocStep("signing");
      const { data } = await axios.post("/api/documenso/sign", {
        pdfBase64: base64, title, signatoryName: docSignatoryName, signatoryEmail: docSignatoryEmail,
      });
      setDocumensoSigningUrl(data.signingUrl);
      setDocStep("idle");
      window.open(data.signingUrl, "_blank");
    } catch {
      setDocumensoError("Falha ao criar envelope. Verifique a configuração do Documenso.");
      setDocStep("idle");
    } finally {
      setDocumensoLoading(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (modalCopyTimerRef.current) clearTimeout(modalCopyTimerRef.current);
      if (refreshSuccessTimerRef.current) clearTimeout(refreshSuccessTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-bg">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Iniciando Pipeline de Dados...</p>
      </div>
    );
  }

  return (
    <>
      {/* Skip to content — accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:rounded">
        Ir para conteúdo principal
      </a>

      <div className="flex flex-col bg-bg min-h-screen text-text font-sans selection:bg-primary/20">
      <AccessibilityBar
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast(v => !v)}
        fontScale={fontScale}
        onFontScaleChange={setFontScale}
      />
      <div className="flex flex-1">
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
          diligenceCount={diligenceAnomalies.length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lastFetchedAt={lastFetchedAt}
          availableStatuses={availableStatuses}
          availablePriorities={availablePriorities}
          availableTypes={availableTypes}
          filterStatus={filterStatus}
          filterPriority={filterPriority}
          filterType={filterType}
          onFilterStatusChange={setFilterStatus}
          onFilterPriorityChange={setFilterPriority}
          onFilterTypeChange={setFilterType}
        />

        <main id="main-content" className="flex-1 overflow-x-hidden flex flex-col min-w-0">
          <header className="px-4 md:px-8 py-4 md:py-5 border-b border-line bg-sidebar">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-sidebar-active transition-colors text-text-secondary"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 min-w-0">
                  <img
                    src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg"
                    alt="Casa Hacker"
                    className="h-8 w-auto brightness-0 opacity-80 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-base sm:text-xl font-light text-text-secondary uppercase tracking-wide leading-none truncate">PMO Data Analytics</span>
                    <h2 className="text-xs font-bold tracking-tight text-text-secondary capitalize truncate">
                      {currentTab === "analytics" && "Insights & Performance"}
                      {currentTab === "diligence" && "Protocolo de Diligência"}
                      {currentTab === "notifications" && "Notificações Formais"}
                      {currentTab === "reports" && "Relatórios de Status"}
                      {currentTab === "planning" && "Planejamento Mensal"}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Advanced filters toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(v => !v)}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded border text-xs font-bold uppercase transition-colors",
                    (showAdvancedFilters || activeFilterCount > 0)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-sidebar border-line text-text-secondary hover:bg-sidebar-active"
                  )}
                  aria-label="Filtros avançados"
                  aria-expanded={showAdvancedFilters}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
                  )}
                </button>

                {/* Excel export */}
                <button
                  onClick={exportToXLSX}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded border border-line bg-sidebar text-text-secondary hover:bg-sidebar-active text-xs font-bold uppercase transition-colors"
                  aria-label="Exportar Excel"
                  title="Exportar dados filtrados em Excel"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Excel</span>
                </button>

                {/* Dark mode toggle */}
                <button
                  onClick={() => setDarkMode(v => !v)}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-sidebar-active transition-colors text-text-secondary"
                  aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                  title={darkMode ? "Modo claro" : "Modo escuro"}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Project filter indicator */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs text-text-secondary uppercase font-semibold">Filtro Ativo</span>
                  <span className="text-xs text-text font-medium">{selectedProject === "All" ? `${projectData.length} Projetos` : selectedProject}</span>
                </div>
              </div>
            </div>

            {/* Advanced filters bar */}
            {showAdvancedFilters && (
              <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-3 items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Status</span>
                  <div className="flex flex-wrap gap-1">
                    {availableStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={cn(
                          "px-2 py-1 text-[11px] font-bold uppercase rounded border transition-colors",
                          filterStatus.includes(s) ? "bg-primary text-white border-primary" : "bg-sidebar border-line text-text-secondary hover:bg-sidebar-active"
                        )}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Prioridade</span>
                  <div className="flex flex-wrap gap-1">
                    {availablePriorities.map(p => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        className={cn(
                          "px-2 py-1 text-[11px] font-bold uppercase rounded border transition-colors",
                          filterPriority.includes(p) ? "bg-primary text-white border-primary" : "bg-sidebar border-line text-text-secondary hover:bg-sidebar-active"
                        )}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Tipo</span>
                  <div className="flex flex-wrap gap-1">
                    {availableTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => setFilterType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                        className={cn(
                          "px-2 py-1 text-[11px] font-bold uppercase rounded border transition-colors",
                          filterType.includes(t) ? "bg-primary text-white border-primary" : "bg-sidebar border-line text-text-secondary hover:bg-sidebar-active"
                        )}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterStatus([]); setFilterPriority([]); setFilterType([]); }}
                    className="self-end px-3 py-1.5 text-xs font-bold text-error border border-error/30 rounded hover:bg-error/10 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpar filtros avançados
                  </button>
                )}
              </div>
            )}
          </header>

          {/* Error banner */}
          {fetchError && (
            <div className="px-4 md:px-8 pt-4">
              <InlineNotification
                kind="error"
                title="Falha ao carregar dados"
                subtitle={fetchError}
                action={
                  <button onClick={() => fetchData()} className="text-xs font-bold underline hover:no-underline ml-2">
                    Tentar novamente
                  </button>
                }
              />
            </div>
          )}

          {/* Refresh success toast */}
          {refreshSuccess && (
            <div className="px-4 md:px-8 pt-4">
              <InlineNotification kind="success" title="Dados atualizados com sucesso." subtitle="" />
            </div>
          )}

          <div className="p-4 md:p-8 max-w-[1800px] mx-auto w-full flex-grow">
            <div className="grid grid-cols-12 gap-4">
              {/* KPI Row — responsive */}
              <div className="col-span-6 sm:col-span-3">
                <KPIWidget title="Total de Issues" value={kpis.total} icon={BarChart3} />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <KPIWidget
                  title="Atrasadas (Risco)"
                  value={kpis.overdue}
                  icon={AlertCircle}
                  className={kpis.overdue > 0 ? "border-error/30 bg-error/5" : ""}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <KPIWidget
                  title="Completude de Dados"
                  value={(kpis.avgCompleteness * 100).toFixed(1) + "%"}
                  icon={CheckCircle2}
                  description="Score de Qualidade"
                  progress={Math.round(kpis.avgCompleteness * 100)}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <KPIWidget title="Vol. Backlog" value={kpis.openIssues} icon={Clock} />
              </div>

              {filteredIssues.length === 0 ? (
                <div className="col-span-12 flex flex-col items-center justify-center py-24 gap-4 text-center">
                  <SearchX className="w-10 h-10 text-line" />
                  <p className="text-sm font-bold text-text">Nenhuma issue encontrada</p>
                  <p className="text-xs text-text-secondary max-w-xs">
                    {activeFilterCount > 0 || selectedProject !== "All" || selectedAssignee !== "All" || searchQuery
                      ? "Os filtros ativos não retornaram resultados."
                      : "Nenhuma issue encontrada para este projeto."
                    }
                  </p>
                  {(activeFilterCount > 0 || selectedProject !== "All" || selectedAssignee !== "All" || searchQuery) && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded hover:opacity-90 transition-colors"
                    >
                      Limpar todos os filtros
                    </button>
                  )}
                </div>
              ) : (
                <Suspense fallback={<TabSkeleton />}>
                  {currentTab === "analytics" && (
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
                      sankeyData={sankeyData}
                      calendarData={calendarData}
                      bubbleData={bubbleData}
                      treemapData={treemapData}
                      radarData={radarData}
                      funnelData={funnelData}
                      leadTimeData={leadTimeData}
                      contributorData={contributorData}
                      cycleTimeData={cycleTimeData}
                      agingData={agingData}
                    />
                  )}
                  {currentTab === "notifications" && (
                    <NotificationsTab
                      selectedProject={selectedProject}
                      projectData={projectData}
                      kpis={kpis}
                      globalStats={globalStats}
                      diligenceAnomalies={diligenceAnomalies}
                    />
                  )}
                  {currentTab === "reports" && (
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
                      onOpenDocumenso={() => { setShowDocumensoModal(true); setDocumensoSigningUrl(null); setDocumensoError(null); setDocStep("idle"); }}
                    />
                  )}
                  {currentTab === "planning" && (
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
                      onOpenIssueDetail={openIssueDetail}
                    />
                  )}
                  {currentTab === "diligence" && (
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
                      onOpenIssueDetail={openIssueDetail}
                    />
                  )}
                </Suspense>
              )}
            </div>
          </div>

          <footer className="px-4 md:px-8 py-6 border-t border-line text-xs text-text-secondary font-bold uppercase tracking-wide mt-auto">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 md:gap-6">
                <span>Jira REST v2</span>
                <span>jira.casahacker.org</span>
                {lastFetchedAt && (
                  <span className="text-success/70">
                    Dados: {formatDistanceToNow(lastFetchedAt, { locale: ptBR, addSuffix: true })}
                  </span>
                )}
              </div>
              <div className="normal-case text-text-secondary font-medium tracking-normal">
                {format(new Date(), "dd/MM/yyyy HH:mm")} BRT
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-line flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="text-success/80">Confidencial - Uso Interno</div>
                <div>© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</div>
                <div className="normal-case text-text-secondary font-medium tracking-normal text-xs">R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</div>
              </div>
            </div>
          </footer>
        </main>

        {/* Issue Detail Modal */}
        {selectedIssueForDetail && (() => {
          const modalIdx = modalIssueList.findIndex(i => i.key === selectedIssueForDetail.key);
          const hasList = modalIssueList.length > 1;
          const goPrev = () => modalIdx > 0 && openIssueDetail(modalIssueList[modalIdx - 1], modalIssueList);
          const goNext = () => modalIdx < modalIssueList.length - 1 && openIssueDetail(modalIssueList[modalIdx + 1], modalIssueList);
          return (
          <div role="dialog" aria-modal="true" aria-label="Detalhes da Tarefa" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-line rounded w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 md:p-6 border-b border-line flex justify-between items-start bg-sidebar">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedIssueForDetail.key}</span>
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wide truncate">{selectedIssueForDetail.projectName}</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-text leading-tight">{selectedIssueForDetail.summary}</h2>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  {hasList && (
                    <>
                      <span className="text-xs text-text-secondary font-bold mr-1">{modalIdx + 1}/{modalIssueList.length}</span>
                      <button onClick={goPrev} disabled={modalIdx <= 0} aria-label="Issue anterior" className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-sidebar-active transition-colors text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={goNext} disabled={modalIdx >= modalIssueList.length - 1} aria-label="Próxima issue" className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-sidebar-active transition-colors text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedIssueForDetail(null)} aria-label="Fechar modal" className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-sidebar-active rounded transition-colors text-text-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Status", value: selectedIssueForDetail.status },
                    { label: "Prioridade", value: selectedIssueForDetail.priority },
                    { label: "Responsável", value: selectedIssueForDetail.assignee || "Não Atribuído" },
                    { label: "Data de Entrega", value: selectedIssueForDetail.dueDate ? format(parseISO(selectedIssueForDetail.dueDate), "dd/MM/yyyy") : "Não definida" },
                    { label: "Tipo", value: selectedIssueForDetail.issueType },
                    { label: "Sprint", value: selectedIssueForDetail.sprintName || "Não vinculado" },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 bg-sidebar rounded border border-line">
                      <div className="text-xs font-bold text-text-secondary uppercase mb-1">{label}</div>
                      <div className="text-xs font-bold text-text uppercase">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-sidebar rounded border border-line">
                  <div className="text-xs font-bold text-text-secondary uppercase mb-2">Score de Completude</div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-lg font-bold",
                      selectedIssueForDetail.completenessScore >= 0.8 ? "text-success" :
                      selectedIssueForDetail.completenessScore >= 0.5 ? "text-warning" : "text-error"
                    )}>{(selectedIssueForDetail.completenessScore * 100).toFixed(0)}%</span>
                    <div className="flex-1 h-1.5 bg-line overflow-hidden">
                      <div
                        className={cn("h-full transition-all",
                          selectedIssueForDetail.completenessScore >= 0.8 ? "bg-success" :
                          selectedIssueForDetail.completenessScore >= 0.5 ? "bg-warning" : "bg-error"
                        )}
                        style={{ width: `${(selectedIssueForDetail.completenessScore * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary font-bold">{selectedIssueForDetail.missingFields.length} pendência(s)</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-line"></div>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wide">Guia de Correção</h3>
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
                  <button onClick={() => setSelectedIssueForDetail(null)} className="px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase text-text-secondary hover:text-text transition-colors">Fechar</button>
                  <button
                    onClick={() => copyLinkToIssueDetail(selectedIssueForDetail.key)}
                    className={cn("px-6 py-2.5 min-h-[44px] rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border",
                      modalCopySuccess ? "bg-success/10 border-success text-success" : "bg-sidebar border-line text-text hover:bg-sidebar-active"
                    )}
                  >
                    {modalCopySuccess ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {modalCopySuccess ? "Link Copiado!" : "Copiar Link"}
                  </button>
                  <button onClick={() => window.open(`https://jira.casahacker.org/browse/${selectedIssueForDetail.key}`, "_blank")} className="bg-primary hover:opacity-90 text-white px-6 py-2.5 min-h-[44px] rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                    Corrigir no Jira <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Documenso Modal */}
        {showDocumensoModal && (
          <div role="dialog" aria-modal="true" aria-label="Assinar Relatório" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card border border-line rounded p-4 md:p-6 w-full max-w-md">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text mb-4 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-success" /> Assinar Relatório com Documenso
              </h2>
              {!documensoSigningUrl ? (
                <>
                  <p className="text-xs text-text-secondary mb-4">Informe os dados do signatário. Um e-mail com o link de assinatura será enviado automaticamente.</p>

                  {/* Step indicator */}
                  {documensoLoading && (
                    <div className="mb-4 p-3 bg-sidebar border border-line rounded space-y-2">
                      {[
                        { key: "generating", label: "Gerando PDF..." },
                        { key: "uploading",  label: "Enviando documento..." },
                        { key: "signing",    label: "Criando envelope..." },
                      ].map(({ key, label }) => (
                        <div key={key} className={cn("flex items-center gap-2 text-xs font-bold",
                          docStep === key ? "text-primary" : "text-text-secondary/40"
                        )}>
                          {docStep === key
                            ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                            : <div className="w-3 h-3 rounded-full border border-current shrink-0" />
                          }
                          {label}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 mb-5">
                    <input value={docSignatoryName} onChange={e => setDocSignatoryName(e.target.value)} placeholder="Nome completo" className="bg-sidebar border border-line rounded px-3 py-2.5 min-h-[44px] text-xs text-text placeholder:text-text-secondary/40 outline-none focus:border-primary transition-colors" />
                    <input value={docSignatoryEmail} onChange={e => setDocSignatoryEmail(e.target.value)} placeholder="E-mail" type="email" className="bg-sidebar border border-line rounded px-3 py-2.5 min-h-[44px] text-xs text-text placeholder:text-text-secondary/40 outline-none focus:border-primary transition-colors" />
                  </div>
                  {documensoError && <p className="text-xs text-error mb-3">{documensoError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowDocumensoModal(false)} className="px-4 py-2.5 min-h-[44px] text-xs text-text-secondary hover:text-text transition-colors">Cancelar</button>
                    <button onClick={handleDocumensoSign} disabled={!docSignatoryName || !docSignatoryEmail || documensoLoading} className="px-5 py-2.5 min-h-[44px] rounded text-xs font-bold uppercase tracking-wider bg-success hover:opacity-90 text-white disabled:opacity-50 flex items-center gap-2">
                      {documensoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine className="w-3 h-3" />}
                      {documensoLoading ? "Processando…" : "Enviar para Assinatura"}
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
                    <button onClick={() => window.open(documensoSigningUrl, "_blank")} className="px-4 py-2.5 min-h-[44px] text-xs text-text border border-line rounded hover:bg-sidebar-active transition-colors">Reabrir Link</button>
                    <button onClick={() => setShowDocumensoModal(false)} className="px-5 py-2.5 min-h-[44px] rounded text-xs font-bold bg-sidebar-active text-text hover:bg-line transition-colors">Fechar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
