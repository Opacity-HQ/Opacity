import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/types";

// Cookie-bound Supabase client for Server Components, Server Functions, and
// Route Handlers. RLS-scoped to whichever user's cookies are attached to the
// request — this is the client every route handler should reach for by
// default. Only fall back to lib/supabase/admin.ts when an operation
// genuinely cannot be expressed under RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render, where cookies() is
            // read-only. Session refresh for that request is handled by
            // proxy.ts instead, so this is safe to ignore here.
          }
        },
      },
    },
  );
}
