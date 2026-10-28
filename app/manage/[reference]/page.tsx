import { ManageDetail } from "@/pages/manage-booking";

export default async function ManageDetailRoute({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <ManageDetail reference={reference} />
    </div>
  );
}
