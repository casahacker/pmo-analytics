import { format, parseISO, isAfter, differenceInDays } from "date-fns";

export interface NormalizedIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  issueType: string;
  priority: string;
  assignee: string | null;
  reporter: string;
  created: string;
  updated: string;
  dueDate: string | null;
  dateStart: string | null;
  sprintName: string | null;
  sprintState: string | null;
  epicLink: string | null;
  storyPoints: number | null;
  hasDescription: boolean;
  labels: string[];
  components: string[];
  projectKey: string;
  projectName: string;
  isSubtask: boolean;
  parentKey: string | null;
  isOverdue: boolean;
  completenessScore: number;
  healthStatus: "critical" | "warning" | "ok";
  missingFields: string[];
  anomalies: string[];
  isDiligence: boolean;
  resolvedAt: string | null;
}

function parseSprint(sprintArray: any[] | null): { name: string | null; state: string | null } {
  if (!sprintArray || sprintArray.length === 0) return { name: null, state: null };
  const lastSprint = sprintArray[sprintArray.length - 1];
  
  // Example string: "com.atlassian.greenhopper.service.sprint.Sprint@78049610[id=214,rapidViewId=55,state=ACTIVE,name=Sprint 3,goal=,startDate=2024-03-18T12:00:00.000Z,endDate=2024-04-01T12:00:00.000Z,completeDate=<null>,sequence=214]"
  const nameMatch = lastSprint.match(/name=([^,\]]+)/);
  const stateMatch = lastSprint.match(/state=([^,\]]+)/);
  
  return {
    name: nameMatch ? nameMatch[1] : null,
    state: stateMatch ? stateMatch[1] : null,
  };
}

const FIELD_WEIGHTS = {
  assignee: 0.25,
  dueDate: 0.25,
  sprintName: 0.20,
  dateStart: 0.15,
  epicLink: 0.10,
  hasDescription: 0.05,
};

export function normalizeIssues(rawIssues: any[]): NormalizedIssue[] {
  return rawIssues
    .filter((issue) => {
      const projectName = issue.fields?.project?.name || "";
      return !projectName.includes("Modelo Padrão de Projeto MP");
    })
    .map((issue) => {
    const f = issue.fields;
    const { name: sprintName, state: sprintState } = parseSprint(f.customfield_10108);
    
    // Canonical Due Date is customfield_10501
    const dueDate = f.customfield_10501 || null;
    const dateStart = f.customfield_10500 || null;
    const statusCategory = f.status?.statusCategory?.key || "undefined";
    const issueType = f.issuetype?.name || "Task";
    const isOverdue = dueDate && statusCategory !== "done" && isAfter(new Date(), parseISO(dueDate));
    
    const missingFields: string[] = [];
    let score = 0;

    // Weight calculation
    if (f.assignee) {
      score += FIELD_WEIGHTS.assignee;
    } else {
      missingFields.push("Responsável");
    }

    if (dueDate || issueType === "Epic") {
      if (dueDate) score += FIELD_WEIGHTS.dueDate;
    } else {
      missingFields.push("Data de Entrega");
    }

    if (sprintName || issueType === "Epic" || statusCategory === "done") {
      if (sprintName) score += FIELD_WEIGHTS.sprintName;
    } else {
      missingFields.push("Sprint");
    }

    if (dateStart) {
      score += FIELD_WEIGHTS.dateStart;
    } else {
      missingFields.push("Data de Início");
    }

    if (f.customfield_10109 || ["Epic", "Subtask"].includes(issueType)) {
      if (f.customfield_10109 || issueType === "Subtask") score += FIELD_WEIGHTS.epicLink;
    } else {
      missingFields.push("Link do Epic");
    }

    const hasDescription = !!(f.description && f.description.trim().length > 0);
    if (hasDescription) {
      score += FIELD_WEIGHTS.hasDescription;
    } else {
      missingFields.push("Descrição");
    }

    // Health Status
    let healthStatus: NormalizedIssue["healthStatus"] = "ok";
    if (score < 0.50 || isOverdue) {
      healthStatus = "critical";
    } else if (score < 0.80) {
      healthStatus = "warning";
    }

    return {
      key: issue.key,
      summary: f.summary,
      status: f.status?.name || "Backlog",
      statusCategory,
      issueType,
      priority: f.priority?.name || "Medium",
      assignee: f.assignee?.displayName || null,
      reporter: f.reporter?.displayName || "Unknown",
      created: f.created,
      updated: f.updated,
      dueDate,
      dateStart,
      sprintName,
      sprintState,
      epicLink: f.customfield_10109 || null,
      storyPoints: f.customfield_10111 || null,
      hasDescription,
      labels: f.labels || [],
      components: (f.components || []).map((c: any) => c.name),
      projectKey: f.project?.key || "UNKNOWN",
      projectName: f.project?.name || "Unknown Project",
      isSubtask: !!f.parent,
      parentKey: f.parent?.key || null,
      isOverdue: !!isOverdue,
      completenessScore: score,
      healthStatus,
      missingFields,
      anomalies: [
        ...(isOverdue ? ["Prazo Vencido"] : []),
        ...missingFields
      ],
      isDiligence: (missingFields.length > 0 || !!isOverdue) && issueType !== "Epic",
      resolvedAt: f.resolutiondate || null,
    };
  });
}
