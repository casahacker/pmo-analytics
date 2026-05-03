import { NormalizedIssue } from "./dataProcessor";
import { format, parseISO, startOfWeek, startOfMonth, startOfDay, differenceInDays } from "date-fns";

export function getKPISummary(issues: NormalizedIssue[]) {
  const total = issues.length;
  const openIssues = issues.filter(i => i.statusCategory !== "done").length;
  const overdue = issues.filter(i => i.isOverdue).length;
  const avgCompleteness = issues.length > 0
    ? issues.reduce((acc, i) => acc + i.completenessScore, 0) / issues.length
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

export function getTrentData(issues: NormalizedIssue[], freq: 'D' | 'W' | 'M' = 'W') {
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
  
  issues.forEach(i => {
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
  issues.forEach(i => {
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
  
  issues.forEach(i => {
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
