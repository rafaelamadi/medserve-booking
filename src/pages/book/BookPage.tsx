import { BookingWizard } from "@/features/book-appointment";
import { prisma } from "@/shared/api/prisma";

/** /book — query params prefill centre/service (follow-up links, marketing site). */
export async function BookPage({
  centreCode,
  serviceSlug,
}: {
  centreCode?: string;
  serviceSlug?: string;
}) {
  let initialCentreId: string | undefined;
  let initialServiceId: string | undefined;
  if (centreCode) {
    const centre = await prisma.centre.findFirst({
      where: { code: centreCode.toUpperCase(), isActive: true },
      select: { id: true },
    });
    if (centre) {
      initialCentreId = centre.id;
      if (serviceSlug) {
        const link = await prisma.centreService.findFirst({
          where: {
            centreId: centre.id,
            isActive: true,
            service: { slug: serviceSlug.toLowerCase(), isActive: true },
          },
          select: { id: true },
        });
        if (link) initialServiceId = link.id;
      }
    }
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="mt-1 text-sm text-zinc-500">Choose a centre, service, date and time.</p>
      </div>
      <BookingWizard initialCentreId={initialCentreId} initialServiceId={initialServiceId} />
    </div>
  );
}
