import { redirect } from "next/navigation";
import { getStaffSession } from "@/shared/lib/auth";
import { ResultsBoard } from "@/widgets/results-board";

export async function ResultsPage() {
  const s = await getStaffSession();
  if (!s) redirect("/hub/login");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Results</h1>
        <p className="text-sm text-zinc-500">Notification only — no result files are stored or sent.</p>
      </div>
      <ResultsBoard />
    </div>
  );
}
