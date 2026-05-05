import { NormalizedIssue } from "./dataProcessor";
import { format, parseISO, startOfWeek, startOfMonth, startOfDay, differenceInDays } from "date-fns";

export function getKPISummary(issues: NormalizedIssue[]) {
  const total = issues.length;
  const openIssues = issues.filter(i => i.statusCategory !== "done").length;
  const overdue = issues.filter(i => i.isOverdue).length;
  const scorableIssues = issues.filter(i => i.issueType !== "Epic");
  const avgCompleteness = scorableIssues.length > 0
    ? scorableIssues.reduce((acc, i) => acc + i.completenessScore, 0) / scorableIssues.length
    : 0;

  return { total, openIssues, overdue, avgCompleteness };
}

export function getIssuesByStatus(issues: NormalizedIssue[]) {
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    counts[i.status] = (counts[i.status] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getIssuesByType(issues: NormalizedIssue[]) {
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    counts[i.issueType] = (counts[i.issueType] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getIssuesByPriority(issues: NormalizedIssue[]) {
  const priorityOrder = ["Highest", "High", "Medium", "Low", "Lowest"];
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    counts[i.priority] = (counts[i.priority] || 0) + 1;
  });
  
  return priorityOrder
    .map(name => ({ name, value: counts[name] || 0 }))
    .filter(p => p.value > 0);
}

export function getTrendData(issues: NormalizedIssue[], freq: 'D' | 'W' | 'M' = 'W') {
  const created: Record<string, number> = {};
  const completed: Record<string, number> = {};

  issues.forEach(i => {
    const createdDate = parseISO(i.created);
    let key = "";
    if (freq === 'D') key = format(startOfDay(createdDate), "yyyy-MM-dd");
    else if (freq === 'W') key = format(startOfWeek(createdDate), "yyyy-MM-dd");
    else key = format(startOfMonth(createdDate), "yyyy-MM-dd");
    
    created[key] = (created[key] || 0) + 1;

    if (i.statusCategory === "done") {
      // For simplicity using 'updated' as completion date if in 'done' category
      const resolvedDate = parseISO(i.updated);
      let rKey = "";
      if (freq === 'D') rKey = format(startOfDay(resolvedDate), "yyyy-MM-dd");
      else if (freq === 'W') rKey = format(startOfWeek(resolvedDate), "yyyy-MM-dd");
      else rKey = format(startOfMonth(resolvedDate), "yyyy-MM-dd");
      completed[rKey] = (completed[rKey] || 0) + 1;
    }
  });

  const allKeys = Array.from(new Set([...Object.keys(created), ...Object.keys(completed)])).sort();
  return allKeys.map(key => ({
    date: key,
    created: created[key] || 0,
    completed: completed[key] || 0,
  }));
}

export function getIssuesByProject(issues: NormalizedIssue[]) {
  const projects: Record<string, { name: string; key: string; todo: number; inProgress: number; done: number }> = {};
  
  issues.forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { name: i.projectName, key: i.projectKey, todo: 0, inProgress: 0, done: 0 };
    }
    if (i.statusCategory === "new") projects[i.projectKey].todo++;
    else if (i.statusCategory === "indeterminate") projects[i.projectKey].inProgress++;
    else if (i.statusCategory === "done") projects[i.projectKey].done++;
  });

  return Object.values(projects);
}

export function getOverdueByProject(issues: NormalizedIssue[]) {
  const projects: Record<string, { name: string; key: string; overdue: number; total: number }> = {};
  
  issues.forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { name: i.projectName, key: i.projectKey, overdue: 0, total: 0 };
    }
    projects[i.projectKey].total++;
    if (i.isOverdue) projects[i.projectKey].overdue++;
  });

  return Object.values(projects).map(p => ({
    ...p,
    rate: Math.round((p.overdue / p.total) * 100) || 0
  })).sort((a, b) => b.rate - a.rate);
}

export function getQualityByProject(issues: NormalizedIssue[]) {
  const projects: Record<string, { name: string; key: string; totalScore: number; count: number }> = {};

  issues.filter(i => i.issueType !== "Epic").forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { name: i.projectName, key: i.projectKey, totalScore: 0, count: 0 };
    }
    projects[i.projectKey].totalScore += i.completenessScore;
    projects[i.projectKey].count++;
  });

  return Object.values(projects).map(p => ({
    name: p.name,
    key: p.key,
    avgScore: p.totalScore / p.count
  })).sort((a,b) => a.avgScore - b.avgScore);
}

export function getMissingFieldsFrequency(issues: NormalizedIssue[]) {
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    i.missingFields.forEach(field => {
      counts[field] = (counts[field] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);
}

export function getWorkloadByAssignee(issues: NormalizedIssue[]) {
  const users: Record<string, number> = {};
  issues.forEach(i => {
    if (i.assignee) {
      users[i.assignee] = (users[i.assignee] || 0) + 1;
    }
  });
  return Object.entries(users)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 10);
}

export function getHealthByAssignee(issues: NormalizedIssue[]) {
  const users: Record<string, { totalScore: number; count: number }> = {};
  issues.filter(i => i.issueType !== "Epic").forEach(i => {
    if (i.assignee) {
      if (!users[i.assignee]) users[i.assignee] = { totalScore: 0, count: 0 };
      users[i.assignee].totalScore += i.completenessScore;
      users[i.assignee].count++;
    }
  });
  return Object.entries(users)
    .map(([name, data]) => ({ 
      name, 
      score: (data.totalScore / data.count) * 100 
    }))
    .sort((a,b) => a.score - b.score)
    .slice(0, 10);
}

export function getResolutionTimeByProject(issues: NormalizedIssue[]) {
  const projects: Record<string, { totalDays: number; count: number; name: string }> = {};

  issues.filter(i => i.issueType !== "Epic").forEach(i => {
    const startDateStr = i.dateStart || i.created; // Prioritize custom start date

    if (i.statusCategory === "done" && (i.resolvedAt || i.updated)) {
      const start = parseISO(startDateStr);
      const end = parseISO(i.resolvedAt || i.updated);
      const days = Math.max(0, differenceInDays(end, start));

      if (!projects[i.projectKey]) {
        projects[i.projectKey] = { totalDays: 0, count: 0, name: i.projectName };
      }
      projects[i.projectKey].totalDays += days;
      projects[i.projectKey].count++;
    }
  });

  return Object.entries(projects)
    .map(([key, data]) => ({
      key,
      name: data.name,
      avgDays: data.count > 0 ? Math.round(data.totalDays / data.count) : 0
    }))
    .sort((a,b) => b.avgDays - a.avgDays);
}

export function getSankeyFlowData(issues: NormalizedIssue[]) {
  const STATUS_LABEL: Record<string, string> = {
    done: "Concluída", indeterminate: "Em Andamento", new: "Backlog", undefined: "Sem Status"
  };
  const counts: Record<string, number> = {};
  const issueTypeArr: string[] = [];
  const statusArr: string[] = [];

  issues.forEach(i => {
    const src = i.issueType;
    const dst = STATUS_LABEL[i.statusCategory] ?? "Sem Status";
    const key = `${src}|||${dst}`;
    counts[key] = (counts[key] || 0) + 1;
    if (!issueTypeArr.includes(src)) issueTypeArr.push(src);
    if (!statusArr.includes(dst)) statusArr.push(dst);
  });

  if (issueTypeArr.length === 0) return { nodes: [], links: [] };

  const nodes = [
    ...issueTypeArr.map(name => ({ name })),
    ...statusArr.map(name => ({ name }))
  ];

  const links = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => {
      const [src, dst] = key.split("|||");
      const source = issueTypeArr.indexOf(src);
      const target = issueTypeArr.length + statusArr.indexOf(dst);
      return { source, target, value };
    })
    .filter(l => l.source >= 0 && l.target >= issueTypeArr.length);

  return { nodes, links };
}

export function getCalendarActivityData(issues: NormalizedIssue[]): Record<string, number> {
  const counts: Record<string, number> = {};
  issues.forEach(i => {
    if (i.created) {
      const day = format(parseISO(i.created), "yyyy-MM-dd");
      counts[day] = (counts[day] || 0) + 1;
    }
    if (i.updated) {
      const day = format(parseISO(i.updated), "yyyy-MM-dd");
      counts[day] = (counts[day] || 0) + 1;
    }
  });
  return counts;
}

export function getRiskBubbleData(issues: NormalizedIssue[]) {
  const projects: Record<string, { name: string; key: string; total: number; overdue: number; totalScore: number; scorable: number }> = {};

  issues.filter(i => i.issueType !== "Epic").forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { name: i.projectName, key: i.projectKey, total: 0, overdue: 0, totalScore: 0, scorable: 0 };
    }
    const p = projects[i.projectKey];
    p.total++;
    if (i.isOverdue) p.overdue++;
    p.totalScore += i.completenessScore;
    p.scorable++;
  });

  return Object.values(projects).map(p => ({
    name: p.key,
    fullName: p.name,
    x: Math.round((p.overdue / Math.max(p.total, 1)) * 100),
    y: Math.round((p.totalScore / Math.max(p.scorable, 1)) * 100),
    z: p.total
  }));
}

export function getTreemapByProject(issues: NormalizedIssue[]) {
  const projects: Record<string, { name: string; key: string; value: number; overdue: number }> = {};

  issues.forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { name: i.projectKey, key: i.projectKey, value: 0, overdue: 0 };
    }
    projects[i.projectKey].value++;
    if (i.isOverdue) projects[i.projectKey].overdue++;
  });

  return Object.values(projects)
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getRadarHealthData(issues: NormalizedIssue[]) {
  const projects: Record<string, { key: string; total: number; done: number; overdue: number; withSprint: number; totalScore: number; scorable: number; withAssignee: number }> = {};

  issues.filter(i => i.issueType !== "Epic").forEach(i => {
    if (!projects[i.projectKey]) {
      projects[i.projectKey] = { key: i.projectKey, total: 0, done: 0, overdue: 0, withSprint: 0, totalScore: 0, scorable: 0, withAssignee: 0 };
    }
    const p = projects[i.projectKey];
    p.total++;
    if (i.statusCategory === "done") p.done++;
    if (i.isOverdue) p.overdue++;
    if (i.sprintName) p.withSprint++;
    p.totalScore += i.completenessScore;
    p.scorable++;
    if (i.assignee) p.withAssignee++;
  });

  const top5 = Object.values(projects).sort((a, b) => b.total - a.total).slice(0, 5);
  const axes = ["Completude", "Pontualidade", "Conclusão", "Alocação", "Sprint"];

  const data = axes.map(axis => {
    const entry: Record<string, any> = { subject: axis };
    top5.forEach(p => {
      if (axis === "Completude") entry[p.key] = Math.round((p.totalScore / Math.max(p.scorable, 1)) * 100);
      else if (axis === "Pontualidade") entry[p.key] = Math.round((1 - p.overdue / Math.max(p.total, 1)) * 100);
      else if (axis === "Conclusão") entry[p.key] = Math.round((p.done / Math.max(p.total, 1)) * 100);
      else if (axis === "Alocação") entry[p.key] = Math.round((p.withAssignee / Math.max(p.total, 1)) * 100);
      else if (axis === "Sprint") entry[p.key] = Math.round((p.withSprint / Math.max(p.total, 1)) * 100);
    });
    return entry;
  });

  return { data, series: top5.map(p => p.key) };
}

export function getFunnelData(issues: NormalizedIssue[]) {
  const total = issues.length;
  const withAssignee = issues.filter(i => i.assignee).length;
  const withDueDate = issues.filter(i => i.dueDate).length;
  const withSprint = issues.filter(i => i.sprintName).length;
  const done = issues.filter(i => i.statusCategory === "done").length;

  return [
    { name: "Total", value: total, fill: "#0f62fe" },
    { name: "Com Responsável", value: withAssignee, fill: "#8a3ffc" },
    { name: "Com Prazo", value: withDueDate, fill: "#f1c21b" },
    { name: "Em Sprint", value: withSprint, fill: "#ff7eb6" },
    { name: "Concluídas", value: done, fill: "#198038" },
  ];
}

export function getLeadTimeDistribution(issues: NormalizedIssue[]) {
  const projects: Record<string, { key: string; days: number[] }> = {};

  issues.filter(i => i.statusCategory === "done" && i.issueType !== "Epic").forEach(i => {
    const startStr = i.dateStart || i.created;
    const endStr = i.resolvedAt || i.updated;
    if (!startStr || !endStr) return;
    try {
      const days = Math.max(0, differenceInDays(parseISO(endStr), parseISO(startStr)));
      if (!projects[i.projectKey]) projects[i.projectKey] = { key: i.projectKey, days: [] };
      projects[i.projectKey].days.push(days);
    } catch {
      // skip invalid dates
    }
  });

  return Object.values(projects)
    .filter(p => p.days.length >= 2)
    .map(p => {
      const sorted = [...p.days].sort((a, b) => a - b);
      const q = (pct: number) => sorted[Math.floor((sorted.length - 1) * pct)];
      return {
        key: p.key,
        min: sorted[0],
        q1: q(0.25),
        median: q(0.5),
        q3: q(0.75),
        max: sorted[sorted.length - 1],
        count: sorted.length
      };
    })
    .sort((a, b) => b.median - a.median);
}

export function getContributorMatrix(issues: NormalizedIssue[]) {
  const matrix: Record<string, Record<string, number>> = {};

  issues.filter(i => i.reporter && i.assignee && i.reporter !== i.assignee).forEach(i => {
    if (!matrix[i.reporter!]) matrix[i.reporter!] = {};
    matrix[i.reporter!][i.assignee!] = (matrix[i.reporter!][i.assignee!] || 0) + 1;
  });

  const allReporters = Object.keys(matrix);
  const allAssignees = new Set<string>();
  allReporters.forEach(r => Object.keys(matrix[r]).forEach(a => allAssignees.add(a)));

  const reporters = allReporters
    .sort((a, b) => {
      const totalA = Object.values(matrix[a]).reduce((s, v) => s + v, 0);
      const totalB = Object.values(matrix[b]).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    })
    .slice(0, 8);

  const assignees = Array.from(allAssignees)
    .sort((a, b) => {
      const cA = reporters.reduce((s, r) => s + (matrix[r]?.[a] ?? 0), 0);
      const cB = reporters.reduce((s, r) => s + (matrix[r]?.[b] ?? 0), 0);
      return cB - cA;
    })
    .slice(0, 8);

  return { reporters, assignees, matrix };
}
