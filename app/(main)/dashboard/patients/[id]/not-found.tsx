import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4 max-w-md mx-auto">
      <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground font-mono text-lg font-bold">
        ?
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">Patient Not Found</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The requested patient record could not be found or has been archived from Supabase.
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href="/dashboard/patients">
          <ArrowLeft className="size-3.5" />
          Back to Patient Registry
        </Link>
      </Button>
    </div>
  );
}
