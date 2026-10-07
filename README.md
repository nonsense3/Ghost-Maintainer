# Ghost Maintainer

AI agent that scores **maintainer burnout / hijack risk** (0–100) from public GitHub activity — linguistic (Gemma) + behavioral (SQL).

**Stack (per your direction):** Next.js dashboard (`web/`), **Supabase** auth + Postgres, secrets **server-only** in env. UI follows [`DESIGN-apple.md`](./DESIGN-apple.md).

## Quick start

1. Create a [Supabase](https://supabase.com) project; enable Email and (optional) GitHub auth.
2. Apply `supabase/migrations/20260307180000_init.sql` in the SQL editor (or use Supabase CLI).
3. Copy env templates:
   - `web/.env.example` → `web/.env.local`
   - `fetcher/.env.example` → `fetcher/.env` (for Python batch jobs)
4. Set **server-only** keys in `web/.env.local` (never `NEXT_PUBLIC_` except Supabase URL + anon key):

   | Variable | Where used |
   |----------|------------|
   | `SUPABASE_SERVICE_ROLE_KEY` | Route handlers / admin ingest |
   | `GITHUB_TOKEN` | GitHub API fetch |
   | `OLLAMA_HOST`, `GEMMA_MODEL` | Local Gemma scoring (upcoming) |

5. Run the app:

   ```bash
   cd web
   npm install
   npm run dev
   ```

6. Sign in at `/login`, then `POST /api/repos/ingest` with `{ "owner": "...", "name": "..." }` (session cookie required).

Progress and next steps: [`memory.md`](./memory.md).
