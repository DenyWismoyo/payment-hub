import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = "draft" | "issued" | "sent" | "paid" | "pending" | "overdue" | "cancelled";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType | string;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/20" },
  issued: { label: "Diterbitkan", class: "bg-info/10 text-info hover:bg-info/20 border-info/20" },
  sent: { label: "Terkirim", class: "bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20" },
  paid: { label: "Lunas", class: "bg-success/10 text-success hover:bg-success/20 border-success/20" },
  pending: { label: "Menunggu", class: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20" },
  overdue: { label: "Jatuh Tempo", class: "bg-danger/10 text-danger hover:bg-danger/20 border-danger/20" },
  cancelled: { label: "Dibatalkan", class: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20" },
};

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status as string] || statusConfig.pending;
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", config.class, className)} 
      {...props}
    >
      {config.label}
    </Badge>
  );
}
