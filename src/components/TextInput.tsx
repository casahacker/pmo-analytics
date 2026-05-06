import React from "react";
import { cn } from "../lib/utils";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "bg-sidebar border border-line text-text text-xs font-medium rounded px-3 py-1.5 outline-none",
          "placeholder:text-text-secondary/40 focus:border-primary transition-colors",
          className
        )}
        {...props}
      />
    </div>
  );
};
