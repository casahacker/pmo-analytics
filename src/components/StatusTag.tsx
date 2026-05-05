import React from "react";
import { cn } from "../lib/utils";

type StatusCategory = "done" | "indeterminate" | "new" | "undefined";

interface StatusTagProps {
  status: string;
  statusCategory?: StatusCategory;
  className?: string;
}

const categoryStyles: Record<StatusCategory, string> = {
  done: "bg-success/10 text-success",
  indeterminate: "bg-warning/10 text-warning",
  new: "bg-primary/10 text-primary",
  undefined: "bg-text-secondary/10 text-text-secondary",
};

export const StatusTag: React.FC<StatusTagProps> = ({ status, statusCategory, className }) => {
  const cat: StatusCategory = statusCategory ?? "undefined";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
        categoryStyles[cat],
        className
      )}
    >
      {status}
    </span>
  );
};
