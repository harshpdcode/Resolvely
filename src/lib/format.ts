export const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const CATEGORY_LABEL: Record<string, string> = {
  billing: "Billing",
  technical: "Technical",
  service: "Service",
  product: "Product",
  delivery: "Delivery",
  account: "Account",
  other: "Other",
};

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "open": return "bg-info/15 text-info border-info/30";
    case "in_progress": return "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning";
    case "resolved": return "bg-success/15 text-success border-success/30";
    case "closed": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground";
  }
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent": return "bg-destructive/15 text-destructive border-destructive/30";
    case "high": return "bg-warning/20 text-warning-foreground border-warning/40 dark:text-warning";
    case "medium": return "bg-info/15 text-info border-info/30";
    case "low": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground";
  }
}

export function formatDate(v: string | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
