import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface KPIWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  title, value, icon: Icon, description, trend, className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card border border-line rounded-xl p-5 flex flex-col justify-center transition-all hover:border-primary/20",
        className
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{title}</span>
        <Icon className="w-3.5 h-3.5 text-text-secondary" />
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-text tracking-tight">{value}</h3>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded",
            trend.positive ? "bg-success/10 text-success" : "bg-error/10 text-error"
          )}>
            {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {description && (
        <div className="mt-2 flex items-center gap-2">
           <div className="flex-grow h-1 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-warning"
                style={{ width: value.toString().includes('%') ? value.toString() : '50%' }}
              />
           </div>
           <p className="text-[9px] font-bold text-text-secondary uppercase whitespace-nowrap">{description}</p>
        </div>
      )}
    </motion.div>
  );
};
