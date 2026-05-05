import React from "react";
import {
  BarChart3,
  ShieldCheck,
  RefreshCcw,
  Bell,
  FileText,
  Layers,
  Users,
  Calendar
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
    <aside className="w-[180px] bg-sidebar border-r border-line h-screen flex flex-col sticky top-0 overflow-y-auto">
      <div className="pt-6 pb-8 px-5 border-b border-line">
        <div className="flex flex-col gap-3">
          <img
            src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg"
            alt="Casa Hacker"
            className="h-10 w-auto self-start"
            referrerPolicy="no-referrer"
          />
          <p className="text-[10px] font-light text-text-secondary uppercase tracking-[0.2em]">
            PMO Data Analytics
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-secondary px-5 pt-4 pb-2">
          Dashboards
        </div>
        {[
          { id: "analytics", label: "Análise", icon: BarChart3 },
          { id: "planning", label: "Planejamento", icon: Calendar },
          { id: "diligence", label: "Diligências", icon: ShieldCheck },
          { id: "reports", label: "Relatórios", icon: FileText },
          { id: "notifications", label: "Notificações", icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 text-[13px] transition-all duration-200 border-l-[3px]",
              currentTab === id
                ? "bg-sidebar-active text-primary border-l-primary"
                : "text-text-secondary hover:text-text hover:bg-sidebar-active border-l-transparent"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}

        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-secondary px-5 py-2">
            Filtros Globais
          </div>

          <div className="px-5 py-3 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Projeto
              </label>
              <select
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
                className="w-full bg-sidebar border border-line text-text rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="All">Todos os Projetos</option>
                {projects.map(p => (
                  <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Responsável
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => onAssigneeChange(e.target.value)}
                className="w-full bg-sidebar border border-line text-text rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="All">Todos</option>
                {assignees.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-line">
        <button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sidebar hover:bg-sidebar-active border border-line text-text text-[12px] font-semibold rounded transition-all"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Atualizar
        </button>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#198038] shadow-[0_0_8px_rgba(25,128,56,0.7)] animate-pulse"></div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Online</span>
        </div>
      </div>
    </aside>
  );
};
