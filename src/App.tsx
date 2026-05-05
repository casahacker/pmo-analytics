import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
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
  TrendingUp,
  Share2,
  FileDown,
  Copy,
  Check,
  Bell,
  FileText,
  Printer,
  FileCheck,
  FileX,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  PenLine
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { KPIWidget } from "./components/KPIWidget";
import { normalizeIssues, NormalizedIssue } from "./lib/dataProcessor";
import {
  getKPISummary,
  getIssuesByStatus,
  getIssuesByType,
  getIssuesByPriority,
  getTrentData,
  getIssuesByProject,
  getOverdueByProject,
  getQualityByProject,
  getMissingFieldsFrequency,
  getWorkloadByAssignee,
  getHealthByAssignee,
  getResolutionTimeByProject
} from "./lib/analytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";
import { cn } from "./lib/utils";

const COLORS = ["#0f62fe", "#198038", "#da1e28", "#f1c21b", "#8a3ffc", "#ff7eb6"];
const STATUS_COLORS: Record<string, string> = {
  "new": "#0f62fe",
  "indeterminate": "#f1c21b",
  "done": "#198038",
  "undefined": "#8d8d8d"
};

export default function App() {
  const [loading, setLoading] = useState(true);
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
  const typeData = useMemo(() => getIssuesByType(filteredIssues), [filteredIssues]);
  const priorityData = useMemo(() => getIssuesByPriority(filteredIssues), [filteredIssues]);
  const trendData = useMemo(() => getTrentData(filteredIssues), [filteredIssues]);
  const projectDist = useMemo(() => getIssuesByProject(filteredIssues), [filteredIssues]);
  const overdueDist = useMemo(() => getOverdueByProject(filteredIssues), [filteredIssues]);
  const qualityDist = useMemo(() => getQualityByProject(filteredIssues), [filteredIssues]);
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

  const handleRefresh = async () => { await axios.post("/api/refresh"); fetchData(); };

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

  const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

  const tooltipStyle = { backgroundColor: '#ffffff', borderColor: '#e0e0e0', borderRadius: '4px', fontSize: '11px', color: '#161616' };

  return (
    <div className="flex bg-bg min-h-screen text-text font-sans selection:bg-primary/20">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onRefresh={handleRefresh}
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
                className="h-10 w-auto invert opacity-90"
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
                        <Tooltip contentStyle={tooltipStyle} />
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
                        <Tooltip contentStyle={tooltipStyle} />
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
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f4f4' }} />
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
                            <div className="h-full bg-primary/50" style={{ width: `${Math.min(100, (item.value / filteredIssues.length) * 100)}%` }}></div>
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
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f4f4' }} />
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
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#198038' }} />
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
            ) : currentTab === "notifications" ? (
              <div className="col-span-12 space-y-6">
                {selectedProject === "All" ? (
                  <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4">
                    <Bell className="w-12 h-12 text-line" />
                    <h3 className="text-lg font-bold text-text">Seleção Requerida</h3>
                    <p className="text-sm text-text-secondary max-w-sm">Para elaborar uma notificação formal, selecione um projeto específico no menu lateral.</p>
                  </div>
                ) : (
                  <div className="bento-card p-12 bg-white text-slate-900 shadow-2xl relative overflow-hidden print:p-0 print:shadow-none print:bg-transparent">
                    <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-8 bg-slate-900"></div>
                          <h1 className="font-black text-2xl tracking-tighter italic">Notificações</h1>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Alertas Tempestivos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase">Ref: NOTIF-{selectedProject}-{format(new Date(), "yyyyMMdd")}</p>
                        <p className="text-xs text-slate-500 font-medium">{format(new Date(), "dd 'de' MMMM 'de' yyyy")}</p>
                      </div>
                    </div>
                    <div className="space-y-6 max-w-3xl mx-auto text-left">
                      <div>
                        <p className="text-sm font-bold mb-1">Prezada Equipe de Gestão,</p>
                        <p className="text-sm italic font-serif">Projeto: {projectData.find(p => p.key === selectedProject)?.name} ({selectedProject})</p>
                      </div>
                      <p className="text-sm leading-relaxed">
                        Serve a presente notificação para informar os indicadores analíticos de integridade e diligência de dados do projeto supracitado, conforme monitoramento realizado em tempo real via PMO Analytics.
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden my-8">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="p-4 uppercase font-bold text-slate-900">Indicador de Performance</th>
                              <th className="p-4 uppercase font-bold text-center text-slate-900">Este Projeto</th>
                              <th className="p-4 uppercase font-bold text-center text-slate-900">Média Global (Benchmark)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <td className="p-4 font-medium italic text-slate-800">Taxa de Completude de Dados</td>
                              <td className={cn("p-4 text-center font-bold", (kpis.avgCompleteness * 100) < (globalStats.avgCompleteness * 100) ? "text-rose-600" : "text-emerald-600")}>{(kpis.avgCompleteness * 100).toFixed(1)}%</td>
                              <td className="p-4 text-center text-slate-500">{(globalStats.avgCompleteness * 100).toFixed(1)}%</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-4 font-medium italic text-slate-800">Taxa de Itens em Atraso (Overdue)</td>
                              <td className={cn("p-4 text-center font-bold", ((kpis.overdue / kpis.total) * 100) > globalStats.overdueRate ? "text-rose-600" : "text-emerald-600")}>{((kpis.overdue / kpis.total) * 100 || 0).toFixed(1)}%</td>
                              <td className="p-4 text-center text-slate-500">{globalStats.overdueRate.toFixed(1)}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 font-sans text-left">
                        <div className="mb-4 pb-4 border-b border-slate-200">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Preview do E-mail</p>
                          <div className="flex gap-2 text-sm">
                            <span className="font-bold text-slate-700">Assunto:</span>
                            <span className="text-slate-900">Diligência {format(new Date(), "dd/MM/yyyy - HH:mm")} - {selectedProject === "All" ? "Global" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</span>
                          </div>
                        </div>
                        <div className="bg-white p-8 shadow-sm rounded border border-slate-100 select-all">
                          <p className="text-sm text-slate-800 mb-6 font-medium">Prezado(a) Gerente de Projeto,</p>
                          <p className="text-sm text-slate-800 mb-4 leading-relaxed">
                            Identificamos pendências impactam a integridade dos dados e o acompanhamento do projeto <span className="font-bold">{selectedProject === "All" ? "Global" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</span>.
                          </p>
                          <p className="text-sm text-slate-800 mb-6 italic underline decoration-rose-200">Favor regularizar os itens abaixo em até 7 dias úteis:</p>
                          <div className="space-y-3 mb-8 text-left">
                            {diligenceAnomalies.slice(0, 15).map(issue => (
                              <div key={issue.key} className="text-sm flex gap-3">
                                <span className="font-mono font-bold text-rose-600 shrink-0">[{issue.key}]</span>
                                <span className="text-slate-700">{issue.summary}</span>
                              </div>
                            ))}
                            {diligenceAnomalies.length > 15 && (
                              <p className="text-xs text-slate-500 italic mt-2">... e outras {diligenceAnomalies.length - 15} issues listadas no relatório completo.</p>
                            )}
                          </div>
                          <div className="py-6 border-t border-slate-100 mb-6 text-left">
                            <p className="text-sm font-bold text-slate-900 mb-3">Link para acompanhamento detalhado:</p>
                            <a href={`https://pmo-analytics.casahacker.org/?project=${selectedProject}`} className="text-blue-600 font-bold underline text-sm break-all">
                              https://pmo-analytics.casahacker.org/?project={selectedProject}
                            </a>
                          </div>
                          <p className="text-sm text-slate-800 mb-8 text-left">Em caso de dúvidas, favor contatar o Analista do PMO no canal do Slack <span className="font-bold">#Escritório de Projetos</span>.</p>
                          <div className="pt-6 border-t border-slate-100 text-[9px] text-slate-400 uppercase leading-relaxed text-left">
                            <p className="font-black text-slate-500 mb-1">Confidencial - Uso Interno</p>
                            <p>© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</p>
                            <p>R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <p className="text-[10px] text-slate-400 font-medium">Dica: Clique sobre o texto acima para selecionar tudo e copiar.</p>
                          <button
                            className="bg-text text-card text-xs px-4 py-2 rounded font-bold hover:opacity-90 transition-colors flex items-center gap-2"
                            onClick={() => { const t = document.querySelector('.select-all')?.textContent; if (t) navigator.clipboard.writeText(t); }}
                          >
                            <Copy className="w-3 h-3" /> Copiar E-mail
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                      <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-text text-card rounded text-xs font-bold shadow-lg hover:opacity-90 transition-all">
                        <Printer className="w-4 h-4" /> Imprimir / PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentTab === "reports" ? (
              <div className="col-span-12 space-y-6">
                <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-line">
                  <div className="flex gap-4 items-end">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-text uppercase tracking-widest">RELATÓRIO DE EXECUÇÃO</h3>
                      <p className="text-[10px] text-text-secondary font-bold uppercase">Status de Entregas por Mês e Ano</p>
                    </div>
                    <div className="flex gap-2 mb-0.5 ml-4">
                      <select value={reportMonth} onChange={(e) => setReportMonth(parseInt(e.target.value))} className="bg-sidebar border border-line text-[10px] font-bold uppercase text-text rounded px-2 py-1 outline-none focus:border-primary transition-colors">
                        {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
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
                        <button onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "approved"}))} className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border", reportStatus[selectedProject] === "approved" ? "bg-success/20 border-success text-success" : "bg-sidebar border-line text-text-secondary hover:border-success/50")}>
                          <FileCheck className="w-3 h-3" /> Aprovada
                        </button>
                        <button onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "warning"}))} className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border", reportStatus[selectedProject] === "warning" ? "bg-warning/20 border-warning text-warning" : "bg-sidebar border-line text-text-secondary hover:border-warning/50")}>
                          <AlertTriangle className="w-3 h-3" /> Ressalvas
                        </button>
                        <button onClick={() => setReportStatus(prev => ({...prev, [selectedProject]: "rejected"}))} className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border", reportStatus[selectedProject] === "rejected" ? "bg-error/20 border-error text-error" : "bg-sidebar border-line text-text-secondary hover:border-error/50")}>
                          <FileX className="w-3 h-3" /> Rejeitada
                        </button>
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
                      <button onClick={() => { setShowDocumensoModal(true); setDocumensoSigningUrl(null); setDocumensoError(null); }} disabled={!reportStatus[selectedProject]} className="flex items-center gap-2 px-4 py-2 bg-success hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-xs font-bold border border-success transition-all">
                        <PenLine className="w-4 h-4" /> Assinar com Documenso
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Document (white) */}
                <div className="bg-white text-slate-900 rounded-xl p-8 print:p-0 print:shadow-none min-h-[800px] text-left flex flex-col border border-line">
                  <header className="flex justify-between border-b-2 border-slate-900 pb-6 mb-8 items-end">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <img src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg" alt="Casa Hacker" className="h-8 w-auto grayscale brightness-0" referrerPolicy="no-referrer" />
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 tracking-tighter uppercase">Associação Casa Hacker</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">PMO Data Analytics</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-black italic tracking-tighter">RELATÓRIO DE EXECUÇÃO</h2>
                      <p className="text-xs font-serif font-bold italic text-slate-600">Projeto: {selectedProject === "All" ? "Todos os Projetos Ativos" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border-2",
                        reportStatus[selectedProject] === "approved" ? "border-emerald-600 text-emerald-600" :
                        reportStatus[selectedProject] === "warning" ? "border-amber-600 text-amber-600" :
                        reportStatus[selectedProject] === "rejected" ? "border-rose-600 text-rose-600" : "border-slate-300 text-slate-300"
                      )}>
                        {reportStatus[selectedProject] === "approved" ? "Execução Aprovada" : reportStatus[selectedProject] === "warning" ? "Aprovada com Ressalvas" : reportStatus[selectedProject] === "rejected" ? "Execução Rejeitada" : "Pendente de Avaliação"}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">Ciclo Monitorado: {MONTHS_PT[reportMonth]} / {reportYear}</span>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-lg">
                        <h5 className="text-[10px] font-bold uppercase text-emerald-700 mb-4 border-b border-emerald-200 pb-2 flex justify-between">
                          Concluídas no Período <span>{reportIssues.filter(i => i.statusCategory === "done").length} Items</span>
                        </h5>
                        <div className="space-y-2">
                          {reportIssues.filter(i => i.statusCategory === "done").map(issue => (
                            <div key={issue.key} className="flex gap-3 items-start border-b border-emerald-100 pb-2">
                              <span className="text-[9px] font-mono font-bold text-emerald-500 shrink-0">{issue.key}</span>
                              <p className="text-[10px] font-medium leading-tight text-slate-700">{issue.summary}</p>
                            </div>
                          ))}
                          {reportIssues.filter(i => i.statusCategory === "done").length === 0 && (
                            <p className="text-[10px] italic text-slate-400 text-center py-4">Nenhuma entrega concluída no período.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-rose-50 p-4 border border-rose-100 rounded-lg h-full flex flex-col">
                        <h5 className="text-[10px] font-bold uppercase text-rose-700 mb-4 border-b border-rose-200 pb-2 flex justify-between">
                          Pendentes / Em Aberto <span>{reportIssues.filter(i => i.statusCategory !== "done").length} Items</span>
                        </h5>
                        <div className="space-y-2 flex-grow">
                          {reportIssues.filter(i => i.statusCategory !== "done").map(issue => (
                            <div key={issue.key} className="flex gap-3 items-start border-b border-rose-100 pb-2">
                              <span className="text-[9px] font-mono font-bold text-rose-500 shrink-0">{issue.key}</span>
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-medium leading-tight text-slate-700">{issue.summary}</p>
                                <p className="text-[8px] font-bold uppercase text-rose-500 italic text-left"><span className="text-rose-600 not-italic">Gargalo:</span> {getBottleneckReason(issue)}</p>
                              </div>
                            </div>
                          ))}
                          {reportIssues.filter(i => i.statusCategory !== "done").length === 0 && (
                            <p className="text-[10px] italic text-slate-400 text-center py-4">Fila de execução limpa.</p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-rose-200/50">
                          <p className="text-[8px] font-black text-rose-800 uppercase tracking-widest mb-1.5 opacity-60">Significado dos Status de Gargalo:</p>
                          <div className="grid grid-cols-1 gap-y-1.5">
                            {[["Atraso", "Task com prazo original do Jira vencido"], ["Impedimento", "Task bloqueada por dependência externa"], ["Inativo", "Sem movimentação no Ticket por mais de 15 dias"], ["Aguardando Alocação", "Task no fluxo do mês aguardando execução"]].map(([label, desc]) => (
                              <div key={label} className="flex items-center gap-1.5 grayscale">
                                <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
                                <span className="text-[7px] text-rose-900 font-bold leading-none uppercase"><span className="text-rose-600">{label}:</span> {desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-12">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 text-left">Análise Qualitativa da Notificação</h5>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Score de Qualidade</span>
                        <p className="text-xl font-black tracking-tighter text-slate-900">{(kpis.avgCompleteness * 100).toFixed(0)} <span className="text-xs font-normal">pts</span></p>
                        <p className="text-[10px] text-slate-400 leading-tight">Métrica baseada na completude das informações de tarefas e subtarefas.</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Impacto em Atraso</span>
                        <p className="text-xl font-black tracking-tighter text-rose-600">{kpis.overdue} <span className="text-xs font-normal">Issues</span></p>
                        <p className="text-[10px] text-slate-400 leading-tight">Volume de entregas com cronograma comprometido ou vencido.</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-bold uppercase text-slate-500">Capacidade Operacional</span>
                        <p className="text-xl font-black tracking-tighter text-blue-600">{kpis.total} <span className="text-xs font-normal">Total</span></p>
                        <p className="text-[10px] text-slate-400 leading-tight">Total de demandas monitoradas neste ciclo de status.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-12 grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 text-left">Observações</h5>
                      <div className="h-24 w-full border border-slate-100 bg-slate-50/50 rounded p-3 text-[10px] text-slate-400 italic">Insira notas adicionais sobre o progresso, riscos ou decisões tomadas no período monitorado...</div>
                    </div>
                    <div className="flex flex-col justify-end items-center pb-2">
                      <div className="w-full border-t border-slate-900 pt-2 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-900">Assinatura Responsável Técnico</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ASSOCIAÇÃO CASA HACKER</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-16 border-t border-slate-200 flex flex-col gap-6 text-slate-400">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black uppercase text-slate-900 leading-none">PMO Data Analytics</p>
                        <p className="text-[9px] font-bold uppercase text-slate-600">{selectedProject === "All" ? "Relatório Global" : (projectData.find(p => p.key === selectedProject)?.name)} - {selectedProject}</p>
                        <p className="text-[8px] font-black tracking-widest text-rose-500 uppercase">Confidencial - Uso Interno</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-bold text-slate-900 leading-tight">© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</p>
                        <p className="text-[8px] font-medium text-slate-500 leading-tight">R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-l-4 border-slate-900 italic text-[9px] leading-relaxed text-slate-600 font-serif">
                      Este documento só é válido se assinado eletronicamente por pessoa autorizada pela Diretoria Executiva por meio da plataforma de assinatura eletrônica exclusiva da Associação Casa Hacker com Certificado ICP-Brasil da Casa Hacker. A emissão do documento sem assinatura não tem validade.
                    </div>
                    <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-400">
                      <p>Emitido em {format(new Date(), "dd/MM/yyyy HH:mm")} BRT (GMT -3)</p>
                      <p></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentTab === "planning" ? (
              <div className="col-span-12 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-line gap-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Período de Planejamento</span>
                      <div className="flex gap-2">
                        <select value={planningMonth} onChange={(e) => setPlanningMonth(parseInt(e.target.value))} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors">
                          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                          ))}
                        </select>
                        <select value={planningYear} onChange={(e) => setPlanningYear(parseInt(e.target.value))} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors">
                          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="h-10 w-px bg-line hidden md:block"></div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Projeto Alvo</span>
                      <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="bg-sidebar text-xs font-bold py-2 px-3 rounded border border-line text-text outline-none focus:border-primary transition-colors max-w-[240px]">
                        <option value="All">Visão Geral (Top 10)</option>
                        {projectData.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-secondary font-bold uppercase mb-1">Total de Itens Planejados</p>
                    <p className="text-2xl font-black text-text leading-none">{planningKPIS.total}</p>
                  </div>
                </div>

                {planningKPIS.projectHasAnomalies && (
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex gap-4 items-center animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase text-warning tracking-wider mb-0.5">Aviso de Integridade de Planejamento</p>
                      <p className="text-xs text-text leading-relaxed font-medium">
                        Este projeto possui itens sob <span className="font-bold text-warning">diligência (campos obrigatórios ausentes ou atrasos)</span>. Os dados de planejamento acima podem estar imprecisos.
                      </p>
                    </div>
                    <button onClick={() => setCurrentTab("diligence")} className="bg-warning text-text px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors shrink-0">Ver Diligências</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bento-card p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-1">Tarefas (Tasks)</p>
                      <p className="text-2xl font-black text-text">{planningKPIS.tasks}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black italic">T</div>
                  </div>
                  <div className="bento-card p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-1">Subtarefas</p>
                      <p className="text-2xl font-black text-text">{planningKPIS.subtasks}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black italic">S</div>
                  </div>
                  <div className="bento-card p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-error font-bold uppercase tracking-widest mb-1">Itens sob Diligência</p>
                      <p className="text-2xl font-black text-error">{planningKPIS.itemsWithAnomalies}</p>
                    </div>
                    <div className="h-12 w-12 bg-error/10 rounded-full flex items-center justify-center">
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
                          <tr className="text-[10px] uppercase text-text-secondary border-b border-line font-bold tracking-widest pb-3">
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
                                <p className="text-[9px] text-text-secondary uppercase font-bold tracking-tight">{issue.issueType}</p>
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sidebar border border-line text-text-secondary italic">{issue.assignee || "Pendente"}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="font-mono font-bold text-text-secondary">{issue.dueDate ? format(parseISO(issue.dueDate), "dd/MM/yy") : "--"}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                  issue.statusCategory === "done" ? "bg-success/10 text-success" :
                                  issue.statusCategory === "indeterminate" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                                )}>{issue.status}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex justify-center">
                                  {issue.isDiligence ? (
                                    <div className="w-2 h-2 bg-error rounded-full animate-pulse" title="Issue com inconformidade de dados"></div>
                                  ) : (
                                    <div className="w-2 h-2 bg-success/30 rounded-full"></div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setSelectedIssueForDetail(issue)} className="p-1.5 rounded bg-sidebar border border-line text-text-secondary hover:bg-sidebar-active hover:text-text transition-colors" title="Ver Detalhes">
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <a href={`https://jira.casahacker.org/browse/${issue.key}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Abrir no Jira">
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
            ) : currentTab === "diligence" ? (
              <div className="col-span-12 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded-xl border border-line gap-4">
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
                        <span className="text-[10px] text-text-secondary font-bold uppercase hidden md:inline">Página {currentPage} de {totalPages || 1}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 bg-sidebar hover:bg-sidebar-active border border-line disabled:opacity-30 disabled:cursor-not-allowed rounded text-[10px] font-bold text-text transition-colors">Anterior</button>
                          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 bg-sidebar hover:bg-sidebar-active border border-line disabled:opacity-30 disabled:cursor-not-allowed rounded text-[10px] font-bold text-text transition-colors">Próxima</button>
                        </div>
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
                                  {issue.isOverdue && <span className="text-[8px] text-error font-black uppercase tracking-tighter">Atrasada</span>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-line rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex justify-between items-start bg-sidebar">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedIssueForDetail.key}</span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{selectedIssueForDetail.projectName}</span>
                </div>
                <h2 className="text-lg font-bold text-text leading-tight">{selectedIssueForDetail.summary}</h2>
              </div>
              <button onClick={() => setSelectedIssueForDetail(null)} className="p-2 hover:bg-sidebar-active rounded-full transition-colors text-text-secondary hover:text-text">
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
                    <div className="group p-4 bg-error/10 border border-error/30 rounded-xl flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-error animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-error uppercase tracking-tight italic flex items-center gap-2">
                          ATENÇÃO: ITEM EM ATRASO <span className="px-1.5 py-0.5 bg-error/20 rounded text-[9px]">CRÍTICO</span>
                        </div>
                        <p className="text-[11px] text-text leading-relaxed font-bold">Esta issue ultrapassou a Data de Entrega (Due Date). Entrega obrigatória imediata para evitar impacto no cronograma geral do projeto. Atualize o status ou repactue a data se houver justificativa.</p>
                      </div>
                    </div>
                  )}
                  {selectedIssueForDetail.missingFields.length > 0 ? (
                    selectedIssueForDetail.missingFields.map((field) => (
                      <div key={field} className="group p-4 bg-warning/5 border border-warning/20 rounded-xl flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 text-warning" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-warning uppercase tracking-tight">Pendência: {field}</div>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                            {field === "Responsável" && "Ação Requerida: Atribuir um responsável direto. Vá ao Jira, clique no campo 'Responsável' e selecione o membro da equipe encarregado."}
                            {field === "Data de Entrega" && "Ação Requerida: Definir data de entrega. Clique no campo 'Data de Entrega' (customfield_10501) e selecione a data final prevista."}
                            {field === "Sprint" && "Ação Requerida: Vincular a uma Sprint. No Jira, arraste a issue para o quadro da Sprint ativa ou selecione no campo 'Sprint'."}
                            {(field === "Prioridade" || field === "Prioridade Indispensável") && "Ação Requerida: Definir criticidade. Clique no ícone de prioridade e selecione o nível conforme o protocolo."}
                            {field === "Data de Início" && "Ação Requerida: Informar data de início. Preencha o campo customizado 'Data de Início' para tracking de lead time."}
                            {field === "Link do Epic" && "Ação Requerida: Vincular a um Epic. Use o campo 'Link do Epic' para associar esta tarefa ao seu projeto guarda-chuva."}
                            {field === "Descrição" && "Ação Requerida: Adicionar detalhamento. Escreva o escopo da tarefa para garantir que a equipe entenda os requisitos."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : !selectedIssueForDetail.isOverdue ? (
                    <div className="p-8 bg-success/5 border border-success/20 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-success uppercase tracking-widest">Conformidade Total</div>
                        <p className="text-[10px] text-text-secondary font-medium">Esta issue atende a todos os critérios do protocolo de diligência de dados.</p>
                      </div>
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
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
