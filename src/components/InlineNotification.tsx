import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "../lib/utils";

type NotificationKind = "error" | "success" | "warning" | "info";

interface InlineNotificationProps {
  kind: NotificationKind;
  title: string;
  subtitle?: string;
  className?: string;
}

const kindStyles: Record<NotificationKind, { container: string; icon: string; IconComponent: React.FC<{ className?: string }> }> = {
  error: {
    container: "bg-error/10 border border-error/30",
    icon: "text-error",
    IconComponent: ({ className }) => <AlertCircle className={className} />,
  },
  success: {
    container: "bg-success/10 border border-success/30",
    icon: "text-success",
    IconComponent: ({ className }) => <CheckCircle2 className={className} />,
  },
  warning: {
    container: "bg-warning/10 border border-warning/30",
    icon: "text-warning",
    IconComponent: ({ className }) => <AlertTriangle className={className} />,
  },
  info: {
    container: "bg-primary/10 border border-primary/30",
    icon: "text-primary",
    IconComponent: ({ className }) => <Info className={className} />,
  },
};

export const InlineNotification: React.FC<InlineNotificationProps> = ({
  kind,
  title,
  subtitle,
  className,
}) => {
  const { container, icon, IconComponent } = kindStyles[kind];
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg", container, className)} role="alert">
      <IconComponent className={cn("w-4 h-4 mt-0.5 shrink-0", icon)} />
      <div className="space-y-0.5">
        <p className={cn("text-xs font-bold uppercase tracking-tight", icon)}>{title}</p>
        {subtitle && <p className="text-[11px] text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
};
