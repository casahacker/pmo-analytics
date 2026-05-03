import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export interface CompletedIssueRow { key: string; summary: string; }
export interface PendingIssueRow   { key: string; summary: string; bottleneckReason: string; }

export interface RelatorioPDFProps {
  completedIssues: CompletedIssueRow[];
  pendingIssues:   PendingIssueRow[];
  reportStatus:    "approved" | "warning" | "rejected" | undefined;
  reportMonth:     number;
  reportYear:      number;
  selectedProject: string;
  projectName:     string;
  kpis: { total: number; overdue: number; avgCompleteness: number };
}

// ─── Palette ────────────────────────────────────────────────
const C = {
  slate900: "#0f172a", slate700: "#334155", slate600: "#475569",
  slate500: "#64748b", slate400: "#94a3b8", slate300: "#cbd5e1",
  slate200: "#e2e8f0", slate100: "#f1f5f9", slate50:  "#f8fafc",
  emerald700: "#047857", emerald600: "#059669",
  emerald100: "#d1fae5", emerald50:  "#ecfdf5",
  rose700: "#be123c",   rose600:    "#e11d48",
  rose200: "#fecdd3",   rose100:    "#ffe4e6", rose50: "#fff1f2",
  amber600: "#d97706",  blue600:    "#2563eb",
  white: "#ffffff",
};

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica", fontSize: 9, color: C.slate900,
    backgroundColor: C.white,
    paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48,
  },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottomWidth: 2, borderBottomColor: C.slate900, borderBottomStyle: "solid",
    paddingBottom: 14, marginBottom: 20,
  },
  headerLeft: { flexDirection: "column" },
  orgName: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.slate900,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 1,
  },
  orgSub: {
    fontSize: 6, fontFamily: "Helvetica-Bold", color: C.slate400,
    textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
  },
  reportTitle: {
    fontSize: 22, fontFamily: "Helvetica-BoldOblique", color: C.slate900, marginBottom: 2,
  },
  projectSubtitle: {
    fontSize: 8, fontFamily: "Helvetica-Oblique", color: C.slate500,
  },
  headerRight: { flexDirection: "column", alignItems: "flex-end" },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1.5, marginBottom: 4,
  },
  statusText: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", letterSpacing: 1,
  },
  cycleText: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.slate400,
    textTransform: "uppercase", letterSpacing: 1,
  },

  // Issue lists
  listsRow: { flexDirection: "row", marginBottom: 14 },
  listCol: { flex: 1 },
  listColLeft:  { marginRight: 7 },
  listColRight: { marginLeft: 7 },
  listBox: { borderRadius: 6, padding: 10 },
  listBoxGreen: {
    backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: C.emerald100, borderStyle: "solid",
  },
  listBoxRose: {
    backgroundColor: C.rose50,
    borderWidth: 1, borderColor: C.rose100, borderStyle: "solid",
  },
  listHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingBottom: 5, marginBottom: 7,
    borderBottomWidth: 1, borderBottomStyle: "solid",
  },
  listHeaderGreen: { borderBottomColor: C.emerald100 },
  listHeaderRose:  { borderBottomColor: C.rose100 },
  listHeaderText: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", letterSpacing: 1,
  },
  listHeaderGreenText: { color: C.emerald700 },
  listHeaderRoseText:  { color: C.rose700 },
  issueRow: {
    flexDirection: "row",
    paddingBottom: 4, marginBottom: 3,
    borderBottomWidth: 0.5, borderBottomStyle: "solid",
  },
  issueRowGreen: { borderBottomColor: C.emerald100 },
  issueRowRose:  { borderBottomColor: C.rose100 },
  issueKey: { fontSize: 7, fontFamily: "Helvetica-Bold", width: 60, flexShrink: 0 },
  issueKeyGreen: { color: C.emerald600 },
  issueKeyRose:  { color: C.rose600 },
  issueContent: { flex: 1 },
  issueSummary: {
    fontSize: 8, fontFamily: "Helvetica", color: C.slate700, lineHeight: 1.3,
  },
  issueBottleneck: {
    fontSize: 6.5, fontFamily: "Helvetica-Bold",
    color: C.rose600, textTransform: "uppercase", marginTop: 2,
  },
  emptyText: {
    fontSize: 8, fontFamily: "Helvetica-Oblique", color: C.slate400,
    textAlign: "center", paddingTop: 12, paddingBottom: 12,
  },

  // Legend
  legendBox: {
    marginTop: 8, paddingTop: 6,
    borderTopWidth: 0.5, borderTopColor: C.rose200, borderTopStyle: "solid",
  },
  legendTitle: {
    fontSize: 6, fontFamily: "Helvetica-Bold", color: C.rose700,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  legendDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.rose600, marginRight: 5,
  },
  legendText: { fontSize: 6, fontFamily: "Helvetica", color: C.slate700 },

  // KPI box
  kpiBox: {
    backgroundColor: C.slate50, borderRadius: 8, padding: 14,
    borderLeftWidth: 3, borderLeftColor: C.slate900, borderLeftStyle: "solid",
    marginBottom: 14,
  },
  kpiTitle: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", letterSpacing: 1.5,
    color: C.slate900, marginBottom: 10,
  },
  kpiGrid: { flexDirection: "row" },
  kpiItem: { flex: 1 },
  kpiLabel: {
    fontSize: 6.5, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.slate500,
    letterSpacing: 0.5, marginBottom: 2,
  },
  kpiValue:      { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  kpiValueBlack: { color: C.slate900 },
  kpiValueRose:  { color: C.rose600 },
  kpiValueBlue:  { color: C.blue600 },
  kpiUnit: { fontSize: 8, fontFamily: "Helvetica", color: C.slate500 },
  kpiDesc: {
    fontSize: 7, fontFamily: "Helvetica", color: C.slate400,
    lineHeight: 1.4, maxWidth: 140,
  },

  // Obs + Signature
  obsSignRow: { flexDirection: "row", marginBottom: 20 },
  obsCol:     { flex: 1, marginRight: 16 },
  obsTitle: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", letterSpacing: 1, color: C.slate900,
    borderBottomWidth: 1, borderBottomColor: C.slate200, borderBottomStyle: "solid",
    paddingBottom: 4, marginBottom: 6,
  },
  obsArea: {
    height: 56,
    borderWidth: 0.5, borderColor: C.slate200, borderStyle: "solid",
    borderRadius: 4, backgroundColor: C.slate50,
  },
  signCol: {
    flex: 1, marginLeft: 16,
    flexDirection: "column", justifyContent: "flex-end", alignItems: "center",
    paddingTop: 24,
  },
  signLine: {
    width: "100%",
    borderTopWidth: 1, borderTopColor: C.slate900, borderTopStyle: "solid",
    paddingTop: 4, alignItems: "center",
  },
  signName: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.slate900, textAlign: "center",
  },
  signOrg: {
    fontSize: 6, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.slate400,
    letterSpacing: 1.5, textAlign: "center", marginTop: 2,
  },

  // Footer
  footer: {
    borderTopWidth: 1, borderTopColor: C.slate200, borderTopStyle: "solid",
    paddingTop: 10,
  },
  footerTopRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 8,
  },
  footerLeft:         { flexDirection: "column" },
  footerTitle: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.slate900, marginBottom: 2,
  },
  footerProject: {
    fontSize: 6.5, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.slate500, marginBottom: 2,
  },
  footerConfidential: {
    fontSize: 6, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: C.rose600, letterSpacing: 0.5,
  },
  footerRight: { flexDirection: "column", alignItems: "flex-end" },
  footerOrg: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.slate900, textAlign: "right", marginBottom: 2,
  },
  footerAddr: {
    fontSize: 6, fontFamily: "Helvetica", color: C.slate500, textAlign: "right",
  },
  legalBox: {
    backgroundColor: C.slate50, paddingVertical: 6, paddingHorizontal: 10,
    borderLeftWidth: 3, borderLeftColor: C.slate900, borderLeftStyle: "solid",
    marginBottom: 8,
  },
  legalText: {
    fontSize: 6.5, fontFamily: "Helvetica-Oblique", color: C.slate500, lineHeight: 1.5,
  },
  footerMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: {
    fontSize: 6, fontFamily: "Helvetica-Bold",
    textTransform: "uppercase", color: "#94a3b8",
  },
});

// ─── Status helpers ──────────────────────────────────────────
function statusLabel(s: RelatorioPDFProps["reportStatus"]) {
  if (s === "approved") return "Execução Aprovada";
  if (s === "warning")  return "Aprovada com Ressalvas";
  if (s === "rejected") return "Execução Rejeitada";
  return "Pendente de Avaliação";
}
function statusColor(s: RelatorioPDFProps["reportStatus"]) {
  if (s === "approved") return C.emerald600;
  if (s === "warning")  return C.amber600;
  if (s === "rejected") return C.rose600;
  return C.slate300;
}

// ─── Document ───────────────────────────────────────────────
export function RelatorioPDF({
  completedIssues, pendingIssues,
  reportStatus, reportMonth, reportYear,
  selectedProject, projectName, kpis,
}: RelatorioPDFProps) {
  const color = statusColor(reportStatus);
  const now = new Date();
  const projectLabel = selectedProject === "All" ? "Todos os Projetos Ativos" : (projectName || selectedProject);

  return (
    <Document title={`Relatório de Execução — ${projectLabel} — ${MONTHS[reportMonth]}/${reportYear}`}>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.orgName}>Associação Casa Hacker</Text>
            <Text style={s.orgSub}>PMO Data Analytics</Text>
            <Text style={s.reportTitle}>RELATÓRIO DE EXECUÇÃO</Text>
            <Text style={s.projectSubtitle}>Projeto: {projectLabel}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={[s.statusBadge, { borderColor: color }]}>
              <Text style={[s.statusText, { color }]}>{statusLabel(reportStatus)}</Text>
            </View>
            <Text style={s.cycleText}>
              Ciclo: {MONTHS[reportMonth]} / {reportYear}
            </Text>
          </View>
        </View>

        {/* ── ISSUE LISTS ── */}
        <View style={s.listsRow}>
          {/* Concluídas */}
          <View style={[s.listCol, s.listColLeft]}>
            <View style={[s.listBox, s.listBoxGreen]}>
              <View style={[s.listHeader, s.listHeaderGreen]}>
                <Text style={[s.listHeaderText, s.listHeaderGreenText]}>Concluídas no Período</Text>
                <Text style={[s.listHeaderText, s.listHeaderGreenText]}>{completedIssues.length} Items</Text>
              </View>
              {completedIssues.length === 0 ? (
                <Text style={s.emptyText}>Nenhuma entrega concluída no período.</Text>
              ) : (
                completedIssues.map(issue => (
                  <View key={issue.key} style={[s.issueRow, s.issueRowGreen]} wrap={false}>
                    <Text style={[s.issueKey, s.issueKeyGreen]}>{issue.key}</Text>
                    <Text style={s.issueSummary}>{issue.summary}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Pendentes */}
          <View style={[s.listCol, s.listColRight]}>
            <View style={[s.listBox, s.listBoxRose]}>
              <View style={[s.listHeader, s.listHeaderRose]}>
                <Text style={[s.listHeaderText, s.listHeaderRoseText]}>Pendentes / Em Aberto</Text>
                <Text style={[s.listHeaderText, s.listHeaderRoseText]}>{pendingIssues.length} Items</Text>
              </View>
              {pendingIssues.length === 0 ? (
                <Text style={s.emptyText}>Fila de execução limpa.</Text>
              ) : (
                pendingIssues.map(issue => (
                  <View key={issue.key} style={[s.issueRow, s.issueRowRose]} wrap={false}>
                    <Text style={[s.issueKey, s.issueKeyRose]}>{issue.key}</Text>
                    <View style={s.issueContent}>
                      <Text style={s.issueSummary}>{issue.summary}</Text>
                      <Text style={s.issueBottleneck}>Gargalo: {issue.bottleneckReason}</Text>
                    </View>
                  </View>
                ))
              )}
              {/* Legenda */}
              <View style={s.legendBox}>
                <Text style={s.legendTitle}>Significado dos Status de Gargalo</Text>
                {[
                  ["Atraso:",             "Tarefa com prazo vencido"],
                  ["Impedimento:",        "Tarefa bloqueada por dependência externa"],
                  ["Inativo:",            "Sem movimentação na Tarefa e/ou Subtarefa por mais de 15 dias"],
                  ["Aguardando Alocação:","Tarefa no fluxo do mês aguardando execução"],
                ].map(([label, desc]) => (
                  <View key={label} style={s.legendItem}>
                    <View style={s.legendDot} />
                    <Text style={s.legendText}><Text style={{ fontFamily: "Helvetica-Bold" }}>{label}</Text> {desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── ANÁLISE QUALITATIVA ── */}
        <View style={s.kpiBox}>
          <Text style={s.kpiTitle}>Análise Qualitativa</Text>
          <View style={s.kpiGrid}>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Score de Qualidade</Text>
              <Text style={[s.kpiValue, s.kpiValueBlack]}>
                {(kpis.avgCompleteness * 100).toFixed(0)}<Text style={s.kpiUnit}> pts</Text>
              </Text>
              <Text style={s.kpiDesc}>Métrica baseada na completude das informações de tarefas e subtarefas.</Text>
            </View>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Impacto em Atraso</Text>
              <Text style={[s.kpiValue, s.kpiValueRose]}>
                {kpis.overdue}<Text style={s.kpiUnit}> Issues</Text>
              </Text>
              <Text style={s.kpiDesc}>Volume de entregas com cronograma comprometido ou vencido.</Text>
            </View>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Capacidade Operacional</Text>
              <Text style={[s.kpiValue, s.kpiValueBlue]}>
                {kpis.total}<Text style={s.kpiUnit}> Total</Text>
              </Text>
              <Text style={s.kpiDesc}>Total de demandas monitoradas neste ciclo de status.</Text>
            </View>
          </View>
        </View>

        {/* ── OBSERVAÇÕES + ASSINATURA ── */}
        <View style={s.obsSignRow}>
          <View style={s.obsCol}>
            <Text style={s.obsTitle}>Observações</Text>
            <View style={s.obsArea} />
          </View>
          <View style={s.signCol}>
            <View style={s.signLine}>
              <Text style={s.signName}>Assinatura Responsável Técnico</Text>
              <Text style={s.signOrg}>Associação Casa Hacker</Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <View style={s.footerTopRow}>
            <View style={s.footerLeft}>
              <Text style={s.footerTitle}>PMO Data Analytics</Text>
              <Text style={s.footerProject}>{projectLabel} — {selectedProject}</Text>
              <Text style={s.footerConfidential}>Confidencial — Uso Interno</Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.footerOrg}>© 2026 Associação Casa Hacker • CNPJ 36.038.079/0001-97</Text>
              <Text style={s.footerAddr}>R. DR. RENATO PAES DE BARROS, 618 – ITAIM BIBI, SÃO PAULO – SP, 04530-000</Text>
            </View>
          </View>
          <View style={s.legalBox}>
            <Text style={s.legalText}>
              Este documento só é válido se assinado eletronicamente por pessoa autorizada pela Diretoria Executiva
              por meio da plataforma de assinatura eletrônica exclusiva da Associação Casa Hacker com Certificado
              ICP-Brasil da Casa Hacker. A emissão do documento sem assinatura não tem validade.
            </Text>
          </View>
          <View style={s.footerMeta}>
            <Text style={s.metaText}>Emitido em {format(now, "dd/MM/yyyy HH:mm")} BRT (GMT -3)</Text>
            <Text style={s.metaText}>Versão 2.4.1.2026.PROD</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
