import React from "react";
import { cn } from "../lib/utils";

type ButtonKind = "primary" | "secondary" | "tertiary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const kindStyles: Record<ButtonKind, string> = {
  primary: "bg-primary text-white border border-primary hover:bg-primary/90 focus:ring-primary",
  secondary: "bg-text text-white border border-text hover:bg-text/90 focus:ring-text",
  tertiary: "bg-transparent text-primary border border-primary hover:bg-primary/10 focus:ring-primary",
  danger: "bg-error text-white border border-error hover:bg-error/90 focus:ring-error",
  ghost: "bg-transparent text-text border border-transparent hover:bg-sidebar-active focus:ring-text-secondary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px] h-8",
  md: "px-4 py-2 text-xs h-10",
  lg: "px-5 py-2.5 text-sm h-12",
};

export const Button: React.FC<ButtonProps> = ({
  kind = "primary",
  size = "md",
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-tight rounded transition-all focus:outline-none focus:ring-2 focus:ring-offset-1",
        kindStyles[kind],
        sizeStyles[size],
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
