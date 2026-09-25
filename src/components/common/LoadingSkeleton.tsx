import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  type?: "card" | "table" | "list";
  count?: number;
}

export function LoadingSkeleton({ className, type = "card", count = 3 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (type === "table") {
    return (
      <div className={cn("rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]", className)}>
        <div className="h-14 border-b border-[var(--border)] bg-[var(--background)]/50 px-6 flex items-center">
          <div className="h-4 w-1/4 bg-[var(--border)] rounded-md animate-pulse"></div>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {items.map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-2 w-1/2">
                <div className="h-4 w-3/4 bg-[var(--surface-hover)] rounded-md animate-pulse"></div>
                <div className="h-3 w-1/2 bg-[var(--surface-hover)] rounded-md animate-pulse"></div>
              </div>
              <div className="h-8 w-24 bg-[var(--surface-hover)] rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {items.map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {items.map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"></div>
      ))}
    </div>
  );
}
