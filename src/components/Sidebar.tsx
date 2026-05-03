import React from "react";
import { 
  BarChart3, 
  ShieldCheck, 
  RefreshCcw, 
  LayoutDashboard,
  Bell,
  FileText,
  Filter,
  Users,
  Calendar,
  Layers
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  projects: { key: string; name: string }[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  assignees: string[];
  selectedAssignee: string;
  onAssigneeChange: (assignee: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onRefresh,
  projects,
  selectedProject,
  onProjectChange,
  assignees,
  selectedAssignee,
  onAssigneeChange
}) => {
  return (
    <aside className="w-72 bg-[#0c0e12] border-r border-slate-800 h-screen flex flex-col sticky top-0 overflow-y-auto">
      <div className="p-8 border-b border-slate-800/50 mb-2">
        <div className="flex flex-col gap-4">
          <img 
            src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg" 
            alt="Casa Hacker" 
            className="h-12 w-auto self-start"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <p className="text-[10px] font-light text-slate-500 uppercase tracking-[0.2em]">
              PMO Data Analytics
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 px-3 py-2">Dashboards</div>
        <button
          onClick={() => onTabChange("analytics")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            currentTab === "analytics" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Análise
        </button>
        <button
          onClick={() => onTabChange("planning")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            currentTab === "planning" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
          )}
        >
          <Calendar className="w-4 h-4" />
          Planejamento
        </button>
        <button
          onClick={() => onTabChange("diligence")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            currentTab === "diligence" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Diligências
        </button>
        <button
          onClick={() => onTabChange("reports")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            currentTab === "reports" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
          )}
        >
          <FileText className="w-4 h-4" />
          Relatórios
        </button>
        <button
          onClick={() => onTabChange("notifications")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            currentTab === "notifications" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
          )}
        >
          <Bell className="w-4 h-4" />
          Notificações
        </button>


        <div className="mt-8">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 px-3 py-2">Filtros Globais</div>
          
          <div className="px-3 py-3 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Projeto
              </label>
              <select
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value="All">Todos os Projetos</option>
                {projects.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Responsável
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value="All">Todos</option>
                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold rounded-lg transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Atualizar Dados
        </button>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>
    </aside>
  );
};
