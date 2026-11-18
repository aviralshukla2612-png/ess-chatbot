import React from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, children, className = "" }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div
      className={cn(
        "px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 rounded-b-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
