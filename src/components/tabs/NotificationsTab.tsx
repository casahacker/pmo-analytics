import React from "react";
import { Bell, Copy, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { NormalizedIssue } from "../../lib/dataProcessor";

interface KPISummary {
  total: number;
  overdue: number;
  avgCompleteness: number;
}

interface GlobalStats {
  avgCompleteness: number;
  overdueRate: number;
}

interface NotificationsTabProps {
  selectedProject: string;
  projectData: { key: string; name: string }[];
  kpis: KPISummary;
  globalStats: GlobalStats;
  diligenceAnomalies: NormalizedIssue[];
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  selectedProject,
  projectData,
  kpis,
  globalStats,
  diligenceAnomalies,
}) => {
  return (
    <div className="col-span-12 space-y-6">
      {selectedProject === "All" ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4">
          <Bell className="w-12 h-12 text-line" />
          <h3 className="text-lg font-bold text-text">Seleção Requerida</h3>
          <p className="text-sm text-text-secondary max-w-sm">Para elaborar uma notificação formal, selecione um projeto específico no menu lateral.</p>
        </div>
      ) : (
        <div className="bento-card p-12 bg-white text-text relative overflow-hidden print:p-0 print:shadow-none print:bg-transparent">
          <div className="flex justify-between items-start mb-12 border-b-2 border-text pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-8 bg-text"></div>
                <h1 className="font-bold text-2xl tracking-tight">Notificações</h1>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Alertas Tempestivos</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase">Ref: NOTIF-{selectedProject}-{format(new Date(), "yyyyMMdd")}</p>
              <p className="text-xs text-text-secondary font-medium">{format(new Date(), "dd 'de' MMMM 'de' yyyy")}</p>
            </div>
          </div>
          <div className="space-y-6 max-w-3xl mx-auto text-left">
            <div>
              <p className="text-sm font-bold mb-1">Prezada Equipe de Gestão,</p>
              <p className="text-sm font-medium">Projeto: {projectData.find(p => p.key === selectedProject)?.name} ({selectedProject})</p>
            </div>
            <p className="text-sm leading-relaxed">
              Serve a presente notificação para informar os indicadores analíticos de integridade e diligência de dados do projeto supracitado, conforme monitoramento realizado em tempo real via PMO Analytics.
            </p>
            <div className="bg-bg border border-line rounded overflow-hidden my-8">
              <table className="w-full text-xs text-left">
                <thead className="bg-sidebar-active border-b border-line">
                  <tr>
                    <th className="p-4 uppercase font-bold text-text">Indicador de Performance</th>
                    <th className="p-4 uppercase font-bold text-center text-text">Este Projeto</th>
                    <th className="p-4 uppercase font-bold text-center text-text">Média Global (Benchmark)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <td className="p-4 font-medium text-text">Taxa de Completude de Dados</td>
                    <td className={cn("p-4 text-center font-bold", (kpis.avgCompleteness * 100) < (globalStats.avgCompleteness * 100) ? "text-error" : "text-success")}>{(kpis.avgCompleteness * 100).toFixed(1)}%</td>
                    <td className="p-4 text-center text-text-secondary">{(globalStats.avgCompleteness * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="p-4 font-medium text-text">Taxa de Itens em Atraso (Overdue)</td>
                    <td className={cn("p-4 text-center font-bold", ((kpis.overdue / kpis.total) * 100) > globalStats.overdueRate ? "text-error" : "text-success")}>{((kpis.overdue / kpis.total) * 100 || 0).toFixed(1)}%</td>
                    <td className="p-4 text-center text-text-secondary">{globalStats.overdueRate.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-bg p-6 rounded border border-line font-sans text-left">
              <div className="mb-4 pb-4 border-b border-line">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-1">Preview do E-mail</p>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-text">Assunto:</span>
                  <span className="text-slate-900">Diligência {format(new Date(), "dd/MM/yyyy - HH:mm")} - {selectedProject === "All" ? "Global" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</span>
                </div>
              </div>
              <div className="bg-card p-8 rounded border border-line select-all">
                <p className="text-sm text-text mb-6 font-medium">Prezado(a) Gerente de Projeto,</p>
                <p className="text-sm text-text mb-4 leading-relaxed">
                  Identificamos pendências impactam a integridade dos dados e o acompanhamento do projeto <span className="font-bold">{selectedProject === "All" ? "Global" : (projectData.find(p => p.key === selectedProject)?.name || selectedProject)}</span>.
                </p>
                <p className="text-sm text-text mb-6 underline decoration-error/30">Favor regularizar os itens abaixo em até 7 dias úteis:</p>
                <div className="space-y-3 mb-8 text-left">
                  {diligenceAnomalies.slice(0, 15).map(issue => (
                    <div key={issue.key} className="text-sm flex gap-3">
                      <span className="font-mono font-bold text-error shrink-0">[{issue.key}]</span>
                      <span className="text-text">{issue.summary}</span>
                    </div>
                  ))}
                  {diligenceAnomalies.length > 15 && (
                    <p className="text-xs text-text-secondary mt-2">... e outras {diligenceAnomalies.length - 15} issues listadas no relatório completo.</p>
                  )}
                </div>
                <div className="py-6 border-t border-line mb-6 text-left">
                  <p className="text-sm font-bold text-text mb-3">Link para acompanhamento detalhado:</p>
                  <a href={`https://pmo-analytics.casahacker.org/?project=${selectedProject}`} className="text-blue-600 font-bold underline text-sm break-all">
                    https://pmo-analytics.casahacker.org/?project={selectedProject}
                  </a>
                </div>
                <p className="text-sm text-text mb-8 text-left">Em caso de dúvidas, favor contatar o Analista do PMO no canal do Slack <span className="font-bold">#Escritório de Projetos</span>.</p>
                <div className="pt-6 border-t border-line text-[9px] text-text-secondary uppercase leading-relaxed text-left">
                  <p className="font-bold text-text-secondary mb-1">Confidencial - Uso Interno</p>
                  <p>© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</p>
                  <p>R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-text-secondary font-medium">Dica: Clique sobre o texto acima para selecionar tudo e copiar.</p>
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
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-text text-card rounded text-xs font-bold hover:opacity-90 transition-all">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
