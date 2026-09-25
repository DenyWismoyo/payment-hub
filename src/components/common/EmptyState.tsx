import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-20 px-4", className)}>
      <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
        <Icon className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto text-sm leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
