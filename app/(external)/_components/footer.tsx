import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="pt-2">
      <div className="text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-primary" />
          <span>MedServe Oncology Network &copy; {new Date().getFullYear()}</span>
        </div>
        <p className="text-muted-foreground/80">
          Lagos (MLCC) · Kano (MKDC) · Umuahia (MUDC)
        </p>
      </div>
    </footer>
  );
}
