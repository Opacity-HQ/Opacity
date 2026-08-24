import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

// Service-role Supabase client. This key bypasses Row Level Security
// entirely, so this file must never be imported from a Client Component or
// any code that ships to the browser — the `server-only` import above makes
// that a build-time error rather than a runtime leak.
//
// Only reach for this client when an operation genuinely cannot be expressed
// under RLS via lib/supabase/server.ts. See backend/backend.md for the full
// rules on the service role key.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
