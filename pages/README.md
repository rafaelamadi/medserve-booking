# Pages Stub

This empty directory with a README exists to ensure Next.js does not treat `src/pages` as the legacy Pages Router.

In this FSD (Feature-Sliced Design) architecture:
- Next.js App Router routes live in `/app` (thin re-export files).
- FSD view compositions live in `src/pages/*`.
- This root `/pages` stub prevents Next.js from attempting to treat `src/pages` as Pages Router routes.
