import React from "react";
import {
  BarChart3,
  ShieldCheck,
  RefreshCcw,
  Bell,
  FileText,
  Layers,
  Users,
  Calendar,
  X,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Dropdown } from "./Dropdown";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  projects: { key: string; name: string }[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  assignees: string[];
  selectedAssignee: string;
  onAssigneeChange: (assignee: string) => void;
  diligenceCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  lastFetchedAt?: Date | null;
  availableStatuses?: string[];
  availablePriorities?: string[];
  availableTypes?: string[];
  filterStatus?: string[];
  filterPriority?: string[];
  filterType?: string[];
  onFilterStatusChange?: (v: string[]) => void;
  onFilterPriorityChange?: (v: string[]) => void;
  onFilterTypeChange?: (v: string[]) => void;
}

function FilterGroup({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  if (!options.length) return null;
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val]);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
        {selected.length > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {selected.length}
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded border transition-all",
              selected.includes(opt)
                ? "bg-primary text-white border-primary"
                : "bg-sidebar border-line text-text-secondary hover:border-primary/40"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onRefresh,
  isRefreshing = false,
  projects,
  selectedProject,
  onProjectChange,
  assignees,
  selectedAssignee,
  onAssigneeChange,
  diligenceCount = 0,
  isOpen = false,
  onClose,
  lastFetchedAt,
  availableStatuses = [],
  availablePriorities = [],
  availableTypes = [],
  filterStatus = [],
  filterPriority = [],
  filterType = [],
  onFilterStatusChange,
  onFilterPriorityChange,
  onFilterTypeChange,
}) => {
  const hasAdvancedFilters = availableStatuses.length > 0 || availablePriorities.length > 0 || availableTypes.length > 0;
  const activeFilterCount = filterStatus.length + filterPriority.length + filterType.length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-[220px] bg-sidebar border-r border-line h-screen flex flex-col sticky top-0 overflow-y-auto custom-scrollbar z-40 transition-transform duration-300",
          "max-lg:fixed max-lg:left-0 max-lg:top-0",
          isOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className="pt-6 pb-4 px-5 border-b border-line">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <img
                src="https://casahacker.org/wp-content/uploads/2023/07/logo_vertical-branco.svg"
                alt="Casa Hacker"
                className="h-10 w-auto self-start brightness-0 opacity-80"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded text-text-secondary hover:text-text hover:bg-sidebar-active transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-light text-text-secondary uppercase tracking-wide">
              PMO Data Analytics
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0">
          <div className="text-xs uppercase tracking-wide font-bold text-text-secondary px-5 pt-4 pb-2">
            Dashboards
          </div>
          {[
            { id: "analytics", label: "Análise", icon: BarChart3 },
            { id: "planning", label: "Planejamento", icon: Calendar },
            { id: "diligence", label: "Diligências", icon: ShieldCheck, badge: diligenceCount },
            { id: "reports", label: "Relatórios", icon: FileText },
            { id: "notifications", label: "Notificações", icon: Bell },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose?.(); }}
              aria-current={currentTab === id ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-3 text-[13px] transition-all duration-200 border-l-[3px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                currentTab === id
                  ? "bg-sidebar-active text-primary border-l-primary"
                  : "text-text-secondary hover:text-text hover:bg-sidebar-active border-l-transparent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && badge > 0 && (
                <span className="text-xs font-bold bg-error/20 text-error px-1.5 py-0.5 rounded leading-none">{badge}</span>
              )}
            </button>
          ))}

          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide font-bold text-text-secondary px-5 py-2">
              Filtros Globais
            </div>

            <div className="px-5 py-3 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                  <Layers className="w-3 h-3" /> Projeto
                </label>
                <Dropdown
                  value={selectedProject}
                  onChange={onProjectChange}
                  items={[
                    { value: "All", label: "Todos os Projetos" },
                    ...projects.map(p => ({ value: p.key, label: `${p.name} (${p.key})` }))
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Responsável
                </label>
                <Dropdown
                  value={selectedAssignee}
                  onChange={onAssigneeChange}
                  items={[
                    { value: "All", label: "Todos" },
                    ...assignees.map(a => ({ value: a, label: a }))
                  ]}
                />
              </div>
            </div>
          </div>

          {hasAdvancedFilters && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wide font-bold text-text-secondary px-5 py-2 flex items-center gap-1.5">
                Filtros Avançados
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="px-5 py-3 space-y-4">
                <FilterGroup
                  label="Status"
                  icon={ShieldCheck}
                  options={availableStatuses}
                  selected={filterStatus}
                  onChange={onFilterStatusChange ?? (() => {})}
                />
                <FilterGroup
                  label="Prioridade"
                  icon={Bell}
                  options={availablePriorities}
                  selected={filterPriority}
                  onChange={onFilterPriorityChange ?? (() => {})}
                />
                <FilterGroup
                  label="Tipo"
                  icon={FileText}
                  options={availableTypes}
                  selected={filterType}
                  onChange={onFilterTypeChange ?? (() => {})}
                />
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      onFilterStatusChange?.([]);
                      onFilterPriorityChange?.([]);
                      onFilterTypeChange?.([]);
                    }}
                    className="text-[10px] font-bold uppercase text-error hover:underline"
                  >
                    Limpar filtros avançados
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-line">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar dados"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sidebar hover:bg-sidebar-active border border-line text-text text-xs font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </button>
          <div className="mt-3 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded bg-[#198038]"></div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Online</span>
            </div>
            {lastFetchedAt && (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary/60">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {formatDistanceToNow(lastFetchedAt, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
