import React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
  onClear?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({ label, id, className, onClear, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={cn(
            "bg-sidebar border border-line text-text text-xs font-medium rounded px-3 py-1.5 outline-none",
            "placeholder:text-text-secondary/40 focus:border-primary transition-colors",
            onClear && props.value ? "pr-7" : "",
            className
          )}
          {...props}
        />
        {onClear && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
            tabIndex={-1}
            aria-label="Limpar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
