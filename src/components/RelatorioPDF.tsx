import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

// react-pdf built-in fonts — no external fetch, zero network dependency
// Regular text → Helvetica | Bold text → Helvetica-Bold
const FONT_REG  = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ─── IBM Carbon tokens ───────────────────────────────────────
const C = {
  ink:         "#161616",
  text:        "#393939",
  subtle:      "#525252",
  disabled:    "#8d8d8d",
  border:      "#e0e0e0",
  bg:          "#f4f4f4",
  white:       "#ffffff",
  blue:        "#0f62fe",
  green:       "#198038",
  greenDark:   "#0e6027",
  greenBg:     "#defbe6",
  greenBorder: "#a7f0ba",
  red:         "#da1e28",
  redDark:     "#750e13",
  redBg:       "#fff1f1",
  redBorder:   "#ffd7d9",
  yellow:      "#f1c21b",
  yellowDark:  "#8e6a00",
};

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_REG, fontSize: 9, color: C.ink,
    backgroundColor: C.white,
    paddingTop: 40, paddingBottom: 52, paddingHorizontal: 42,
  },
  pageNumber: {
    position: "absolute", fontSize: 7, fontFamily: FONT_BOLD,
    bottom: 18, right: 42, color: C.disabled, textTransform: "uppercase",
  },

  // ── Header
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottomWidth: 2, borderBottomColor: C.ink, borderBottomStyle: "solid",
    paddingBottom: 12, marginBottom: 16,
  },
  headerLeft:   { flexDirection: "column" },
  headerAccent: { width: 28, height: 3, backgroundColor: C.blue, marginBottom: 8 },
  orgName: {
    fontSize: 7, fontFamily: FONT_BOLD, color: C.ink,
    textTransform: "uppercase", marginBottom: 1,
  },
  orgSub: {
    fontSize: 6, fontFamily: FONT_REG, color: C.subtle,
    textTransform: "uppercase", marginBottom: 8,
  },
  reportTitle: {
    fontSize: 22, fontFamily: FONT_BOLD, color: C.ink, marginBottom: 2,
  },
  projectSubtitle: { fontSize: 8, fontFamily: FONT_REG, color: C.subtle },
  refNumber:       { fontSize: 6.5, fontFamily: FONT_REG, color: C.disabled, marginTop: 3 },
  headerRight:     { flexDirection: "column", alignItems: "flex-end" },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, marginBottom: 5 },
  statusText:      { fontSize: 7, fontFamily: FONT_BOLD, textTransform: "uppercase" },
  cycleText:       { fontSize: 7, fontFamily: FONT_BOLD, color: C.disabled, textTransform: "uppercase" },
  emissionText:    { fontSize: 6, fontFamily: FONT_REG, color: C.disabled, marginTop: 2 },

  // ── Section bar
  sectionBar:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionBarAccent: { width: 3, height: 12, backgroundColor: C.blue, marginRight: 6 },
  sectionBarText:   { fontSize: 7, fontFamily: FONT_BOLD, color: C.ink, textTransform: "uppercase" },
  sectionBarCount:  { fontSize: 7, fontFamily: FONT_REG, color: C.subtle, marginLeft: 4 },

  // ── Issue lists
  listsRow:     { flexDirection: "row", marginBottom: 12 },
  listCol:      { flex: 1 },
  listColLeft:  { marginRight: 6 },
  listColRight: { marginLeft: 6 },
  listBox:      { padding: 10, borderWidth: 1, borderStyle: "solid" },
  listBoxGreen: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  listBoxRose:  { backgroundColor: C.redBg,   borderColor: C.redBorder   },
  listHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingBottom: 5, marginBottom: 6,
    borderBottomWidth: 1, borderBottomStyle: "solid",
  },
  listHeaderGreen:     { borderBottomColor: C.greenBorder },
  listHeaderRose:      { borderBottomColor: C.redBorder   },
  listHeaderText:      { fontSize: 7, fontFamily: FONT_BOLD, textTransform: "uppercase" },
  listHeaderGreenText: { color: C.greenDark },
  listHeaderRoseText:  { color: C.redDark   },
  issueRow: {
    flexDirection: "row",
    paddingBottom: 4, marginBottom: 3,
    borderBottomWidth: 0.5, borderBottomStyle: "solid",
  },
  issueRowGreen:   { borderBottomColor: C.greenBorder },
  issueRowRose:    { borderBottomColor: C.redBorder   },
  issueKey:        { fontSize: 7, fontFamily: FONT_BOLD, width: 56, flexShrink: 0 },
  issueKeyGreen:   { color: C.greenDark },
  issueKeyRose:    { color: C.redDark   },
  issueContent:    { flex: 1 },
  issueSummary:    { fontSize: 8, fontFamily: FONT_REG, color: C.text, lineHeight: 1.3 },
  issueMeta:       { fontSize: 6.5, fontFamily: FONT_REG, color: C.subtle, marginTop: 2, lineHeight: 1.2 },
  issueBottleneck: { fontSize: 6.5, fontFamily: FONT_BOLD, color: C.red, textTransform: "uppercase", marginTop: 2 },
  emptyText:       { fontSize: 8, fontFamily: FONT_REG, color: C.disabled, textAlign: "center", paddingTop: 12, paddingBottom: 12 },

  // ── Bottleneck legend
  legendBox:  { marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.redBorder, borderTopStyle: "solid" },
  legendTitle: { fontSize: 6, fontFamily: FONT_BOLD, color: C.redDark, textTransform: "uppercase", marginBottom: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 2.5 },
  legendDot:  { width: 5, height: 5, marginRight: 5 },
  legendText: { fontSize: 6.5, fontFamily: FONT_REG, color: C.text },

  // ── KPI box
  kpiBox: {
    backgroundColor: C.bg, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.blue, borderLeftStyle: "solid",
    marginBottom: 12,
  },
  kpiTitle:   { fontSize: 7, fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.ink, marginBottom: 10 },
  kpiDivider: { width: "100%", height: 0.5, backgroundColor: C.border, marginBottom: 10 },
  kpiGrid:    { flexDirection: "row" },
  kpiItem:    { flex: 1 },
  kpiLabel:   { fontSize: 6.5, fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.subtle, marginBottom: 2 },
  kpiValue:   { fontSize: 22, fontFamily: FONT_BOLD, marginBottom: 2 },
  kpiValueBlack: { color: C.ink  },
  kpiValueRed:   { color: C.red  },
  kpiValueBlue:  { color: C.blue },
  kpiUnit:    { fontSize: 8, fontFamily: FONT_REG, color: C.subtle },
  kpiDesc:    { fontSize: 7, fontFamily: FONT_REG, color: C.disabled, lineHeight: 1.4, maxWidth: 130 },

  // ── Observations + Signature
  obsSignRow:  { flexDirection: "row", marginBottom: 16 },
  obsCol:      { flex: 1, marginRight: 14 },
  signCol:     { flex: 1, marginLeft: 14 },
  fieldTitle: {
    fontSize: 7, fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.border, borderBottomStyle: "solid",
    paddingBottom: 4, marginBottom: 6,
  },
  obsArea:        { minHeight: 56, borderWidth: 0.5, borderColor: C.border, borderStyle: "solid", backgroundColor: C.bg, padding: 7 },
  obsText:        { fontSize: 8, fontFamily: FONT_REG, color: C.text, lineHeight: 1.4 },
  obsPlaceholder: { fontSize: 8, fontFamily: FONT_REG, color: C.disabled, lineHeight: 1.4 },
  signNameBox:    { borderWidth: 0.5, borderColor: C.border, borderStyle: "solid", backgroundColor: C.bg, padding: 6, marginBottom: 4 },
  signNameText:   { fontSize: 9,  fontFamily: FONT_BOLD, color: C.ink  },
  signRoleText:   { fontSize: 7,  fontFamily: FONT_REG,  color: C.subtle, marginTop: 1 },
  signLineSpacer: { flex: 1 },
  signLine:       { borderTopWidth: 1, borderTopColor: C.ink, borderTopStyle: "solid", paddingTop: 4, marginTop: 12, alignItems: "center" },
  signLineLabel:  { fontSize: 7, fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.ink, textAlign: "center" },
  signLineOrg:    { fontSize: 6, fontFamily: FONT_REG, textTransform: "uppercase", color: C.subtle, textAlign: "center", marginTop: 2 },

  // ── Footer
  footer:      { borderTopWidth: 1, borderTopColor: C.border, borderTopStyle: "solid", paddingTop: 8 },
  footerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  footerLeft:          { flexDirection: "column" },
  footerTitle:         { fontSize: 7,   fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.ink,    marginBottom: 2 },
  footerProject:       { fontSize: 6.5, fontFamily: FONT_REG,  textTransform: "uppercase", color: C.subtle, marginBottom: 2 },
  footerConfidential:  { fontSize: 6,   fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.red },
  footerRight:         { flexDirection: "column", alignItems: "flex-end" },
  footerOrg:           { fontSize: 7,   fontFamily: FONT_BOLD, color: C.ink,    textAlign: "right", marginBottom: 2 },
  footerAddr:          { fontSize: 6,   fontFamily: FONT_REG,  color: C.subtle, textAlign: "right" },
  legalBox: {
    backgroundColor: C.bg, paddingVertical: 6, paddingHorizontal: 10,
    borderLeftWidth: 2, borderLeftColor: C.ink, borderLeftStyle: "solid", marginBottom: 6,
  },
  legalText:   { fontSize: 6.5, fontFamily: FONT_REG, color: C.subtle, lineHeight: 1.5 },
  footerMeta:  { flexDirection: "row", justifyContent: "space-between" },
  metaText:    { fontSize: 6, fontFamily: FONT_BOLD, textTransform: "uppercase", color: C.disabled },
});

// ─── Status helpers ──────────────────────────────────────────
function statusLabel(st: RelatorioPDFProps["reportStatus"]) {
  if (st === "approved") return "Execução Aprovada";
  if (st === "warning")  return "Aprovada com Ressalvas";
  if (st === "rejected") return "Execução Rejeitada";
  return "Pendente de Avaliação";
}
function statusColor(st: RelatorioPDFProps["reportStatus"]) {
  if (st === "approved") return C.green;
  if (st === "warning")  return C.yellowDark;
  if (st === "rejected") return C.red;
  return C.border;
}

// ─── Bottleneck legend config ─────────────────────────────────
const BOTTLENECK_DOTS: [string, string, string][] = [
  ["Atraso:",              "Tarefa com prazo vencido",                                       C.red      ],
  ["Impedimento:",         "Tarefa bloqueada por dependência externa",                        C.yellow   ],
  ["Inativo:",             "Sem movimentação na Tarefa e/ou Subtarefa por mais de 15 dias",  C.yellow   ],
  ["Aguardando Alocação:", "Tarefa no fluxo do mês aguardando execução",                     C.disabled ],
];

// ─── Types ───────────────────────────────────────────────────
export interface CompletedIssueRow { key: string; summary: string; }
export interface PendingIssueRow   { key: string; summary: string; bottleneckReason: string; assignee?: string; sprintName?: string; }

export interface RelatorioPDFProps {
  completedIssues:  CompletedIssueRow[];
  pendingIssues:    PendingIssueRow[];
  reportStatus:     "approved" | "warning" | "rejected" | undefined;
  reportMonth:      number;
  reportYear:       number;
  selectedProject:  string;
  projectName:      string;
  kpis:             { total: number; overdue: number; avgCompleteness: number };
  observationsText?: string;
  signatoryName?:   string;
  signatoryRole?:   string;
}

// ─── Document ────────────────────────────────────────────────
export function RelatorioPDF({
  completedIssues, pendingIssues,
  reportStatus, reportMonth, reportYear,
  selectedProject, projectName, kpis,
  observationsText, signatoryName, signatoryRole,
}: RelatorioPDFProps) {
  const color        = statusColor(reportStatus);
  const now          = new Date();
  const projectLabel = selectedProject === "All" ? "Todos os Projetos Ativos" : (projectName || selectedProject);
  const monthStr     = String(reportMonth + 1).padStart(2, "0");
  const refNumber    = `PMO-REL-${selectedProject}-${reportYear}${monthStr}`;

  return (
    <Document title={`Relatório de Execução — ${projectLabel} — ${MONTHS[reportMonth]}/${reportYear}`}>
      <Page size="A4" style={s.page}>

        {/* Page number — fixed on every page */}
        <Text
          style={s.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerAccent} />
            <Text style={s.orgName}>Associação Casa Hacker</Text>
            <Text style={s.orgSub}>PMO Data Analytics</Text>
            <Text style={s.reportTitle}>RELATÓRIO DE EXECUÇÃO</Text>
            <Text style={s.projectSubtitle}>Projeto: {projectLabel}</Text>
            <Text style={s.refNumber}>Ref: {refNumber}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={[s.statusBadge, { borderColor: color }]}>
              <Text style={[s.statusText, { color }]}>{statusLabel(reportStatus)}</Text>
            </View>
            <Text style={s.cycleText}>Ciclo: {MONTHS[reportMonth]} / {reportYear}</Text>
            <Text style={s.emissionText}>Emitido em {format(now, "dd/MM/yyyy HH:mm")} BRT</Text>
          </View>
        </View>

        {/* ── ISSUE LISTS ── */}
        <View style={s.listsRow}>

          {/* Concluídas */}
          <View style={[s.listCol, s.listColLeft]}>
            <View style={s.sectionBar}>
              <View style={s.sectionBarAccent} />
              <Text style={s.sectionBarText}>Concluídas no Período</Text>
              <Text style={s.sectionBarCount}>({completedIssues.length})</Text>
            </View>
            <View style={[s.listBox, s.listBoxGreen]}>
              <View style={[s.listHeader, s.listHeaderGreen]}>
                <Text style={[s.listHeaderText, s.listHeaderGreenText]}>Entregas Realizadas</Text>
                <Text style={[s.listHeaderText, s.listHeaderGreenText]}>{completedIssues.length} itens</Text>
              </View>
              {completedIssues.length === 0
                ? <Text style={s.emptyText}>Nenhuma entrega concluída no período.</Text>
                : completedIssues.map(issue => (
                  <View key={issue.key} style={[s.issueRow, s.issueRowGreen]} wrap={false}>
                    <Text style={[s.issueKey, s.issueKeyGreen]}>{issue.key}</Text>
                    <Text style={s.issueSummary}>{issue.summary}</Text>
                  </View>
                ))
              }
            </View>
          </View>

          {/* Pendentes */}
          <View style={[s.listCol, s.listColRight]}>
            <View style={s.sectionBar}>
              <View style={[s.sectionBarAccent, { backgroundColor: C.red }]} />
              <Text style={s.sectionBarText}>Pendentes / Em Aberto</Text>
              <Text style={s.sectionBarCount}>({pendingIssues.length})</Text>
            </View>
            <View style={[s.listBox, s.listBoxRose]}>
              <View style={[s.listHeader, s.listHeaderRose]}>
                <Text style={[s.listHeaderText, s.listHeaderRoseText]}>Itens em Aberto</Text>
                <Text style={[s.listHeaderText, s.listHeaderRoseText]}>{pendingIssues.length} itens</Text>
              </View>
              {pendingIssues.length === 0
                ? <Text style={s.emptyText}>Fila de execução limpa.</Text>
                : pendingIssues.map(issue => (
                  <View key={issue.key} style={[s.issueRow, s.issueRowRose]} wrap={false}>
                    <Text style={[s.issueKey, s.issueKeyRose]}>{issue.key}</Text>
                    <View style={s.issueContent}>
                      <Text style={s.issueSummary}>{issue.summary}</Text>
                      {(issue.assignee || issue.sprintName) && (
                        <Text style={s.issueMeta}>
                          {[issue.assignee, issue.sprintName].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                      <Text style={s.issueBottleneck}>Gargalo: {issue.bottleneckReason}</Text>
                    </View>
                  </View>
                ))
              }
              {/* Legenda de severidade */}
              <View style={s.legendBox}>
                <Text style={s.legendTitle}>Significado dos Status de Gargalo</Text>
                {BOTTLENECK_DOTS.map(([label, desc, dotColor]) => (
                  <View key={label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: dotColor }]} />
                    <Text style={s.legendText}>
                      <Text style={{ fontFamily: FONT_BOLD }}>{label}</Text>{" "}{desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── INDICADORES DE DESEMPENHO ── */}
        <View style={s.kpiBox}>
          <Text style={s.kpiTitle}>Indicadores de Desempenho do Ciclo</Text>
          <View style={s.kpiDivider} />
          <View style={s.kpiGrid}>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Score de Qualidade</Text>
              <Text style={[s.kpiValue, s.kpiValueBlack]}>
                {(kpis.avgCompleteness * 100).toFixed(0)}<Text style={s.kpiUnit}> pts</Text>
              </Text>
              <Text style={s.kpiDesc}>Completude média dos campos obrigatórios de tarefas e subtarefas.</Text>
            </View>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Impacto em Atraso</Text>
              <Text style={[s.kpiValue, s.kpiValueRed]}>
                {kpis.overdue}<Text style={s.kpiUnit}> issues</Text>
              </Text>
              <Text style={s.kpiDesc}>Entregas com cronograma comprometido ou prazo vencido no ciclo.</Text>
            </View>
            <View style={s.kpiItem}>
              <Text style={s.kpiLabel}>Capacidade Operacional</Text>
              <Text style={[s.kpiValue, s.kpiValueBlue]}>
                {kpis.total}<Text style={s.kpiUnit}> total</Text>
              </Text>
              <Text style={s.kpiDesc}>Demandas monitoradas neste ciclo de status.</Text>
            </View>
          </View>
        </View>

        {/* ── OBSERVAÇÕES + ASSINATURA ── */}
        <View style={s.obsSignRow}>
          <View style={s.obsCol}>
            <Text style={s.fieldTitle}>Observações</Text>
            <View style={s.obsArea}>
              {observationsText
                ? <Text style={s.obsText}>{observationsText}</Text>
                : <Text style={s.obsPlaceholder}>Sem observações adicionais para este ciclo.</Text>
              }
            </View>
          </View>
          <View style={s.signCol}>
            <Text style={s.fieldTitle}>Assinatura</Text>
            {(signatoryName || signatoryRole) && (
              <View style={s.signNameBox}>
                {signatoryName && <Text style={s.signNameText}>{signatoryName}</Text>}
                {signatoryRole && <Text style={s.signRoleText}>{signatoryRole}</Text>}
              </View>
            )}
            <View style={s.signLineSpacer} />
            <View style={s.signLine}>
              <Text style={s.signLineLabel}>{signatoryName || "Assinatura Responsável Técnico"}</Text>
              <Text style={s.signLineOrg}>{signatoryRole || "Associação Casa Hacker"}</Text>
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
            <Text style={s.metaText}>Ref: {refNumber}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
