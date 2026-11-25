# Agent instructions

## Architecture & Conventions
- **Features:** Telegram chat-export analyzer, Telegram sticker-set pages, URL short links, MDX posts, and an admin console.
- **UI & Queries:** Reuse primitives in `src/components/ui` and `cn` from `src/lib/utils.ts`. Use Drizzle helpers in `src/db/drizzle.ts` and actions in `src/lib/db/` rather than writing queries in components.
- **Schemas:** Main/auth tables live in `src/db/schema.ts`; Telegram tables live in `src/db/telegram-schema.ts`.
- **Posts:** MDX sources live in `_drafts/` and sync to the DB via `sync-posts.ts`.

## Critical Guardrails
- **Local-only Chat Analysis:** Telegram JSON exports are held in `src/lib/useFileStore.ts`, validated via `src/lib/chatSchema.ts`, and processed in `src/lib/parseData.ts` + `src/lib/calculateMessages.ts`. Never send uploaded chat data to the server. Keep export schemas, calculation helpers, chart types, and chart UI in sync.
- **Auth:** Better Auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`). Wrap protected API routes with `withAuth` from `src/lib/authenticate.ts` (specify admin or verified-email flags as needed).
- **Admin Dashboard:** Preserve the existing meanings of `app_last_updated` project IDs `0`–`4`.
- **Database Safety:** Generate migrations with `npx drizzle-kit generate --config drizzle.config.ts`. Never push or apply migrations unless explicitly asked and the target environment is confirmed.

## Commands
- `npm run dev` — Start dev server
- `npx tsc --noEmit` — Typecheck (no test suite exists; use this + lint before full builds)
- `npm run lint` — Run linter
- `npm run build` — Production build check
- `npm run sync:posts` / `npm run watch:posts` — Sync `_drafts/*.mdx` to database