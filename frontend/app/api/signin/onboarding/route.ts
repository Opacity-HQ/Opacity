import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import { getFirstName } from "@/lib/auth/first-name";

// Account-entry flow (see backend/backend.md "Auth API"): the one-time
// onboarding a confirmed, non-guest user completes on their first signed-in
// session. Email confirmation means there is no session at sign-up time, so
// this can't run then — the client gates on GET below instead.

// GET: "does this visitor still owe us onboarding?" Deliberately 200 for
// signed-out visitors (needsOnboarding: false) rather than 401 — the gate is
// mounted app-wide, so a 401 here would spam every logged-out page load.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guests never get a profile (docs/saket/BACKEND_SCHEMA.md) — they play
    // as "guest" and are asked for a name per-game, as before.
    if (!user || user.is_anonymous) {
      return apiSuccess({
        signedIn: Boolean(user),
        needsOnboarding: false,
        hasChildren: false,
        displayName: null,
      });
    }

    const [{ data: profile, error: profileError }, { count, error: countError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("children")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id),
      ]);

    if (profileError) throw profileError;
    if (countError) throw countError;

    return apiSuccess({
      signedIn: true,
      needsOnboarding: !profile?.display_name,
      hasChildren: (count ?? 0) > 0,
      displayName: profile?.display_name ?? null,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

const bodySchema = z.object({
  fullName: z.string().trim().min(1).max(80),
  // Only required when the account has no child yet — see the check below.
  birthYear: z.number().int().optional(),
  gradeLevel: z.string().trim().max(40).optional(),
});

// POST: saves the profile and, if this account has no child yet, creates the
// first one so every game can skip its own per-game setup form. A guest who
// already played and then claimed an email already has a child — keep it
// rather than creating a duplicate.
export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid onboarding details.",
        parsed.error.flatten(),
      );
    }

    const { user, supabase } = await requireUser();

    if (user.is_anonymous) {
      return apiError(
        "forbidden",
        "Guests don't have a profile. Create an account first.",
      );
    }

    const { fullName, birthYear, gradeLevel } = parsed.data;

    const { count, error: countError } = await supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id);
    if (countError) throw countError;

    const needsChild = (count ?? 0) === 0;

    // Validate before writing anything, so a bad birth year can't leave a
    // half-onboarded account (profile saved, no child).
    if (needsChild) {
      const currentYear = new Date().getFullYear();
      if (
        birthYear === undefined ||
        birthYear < 1990 ||
        birthYear > currentYear
      ) {
        return apiError("validation_failed", "Invalid birth year.", {
          fieldErrors: { birthYear: [`Enter a year between 1990 and ${currentYear}.`] },
        });
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: fullName }, { onConflict: "id" });
    if (profileError) throw profileError;

    if (needsChild && birthYear !== undefined) {
      const { error: childError } = await supabase.from("children").insert({
        owner_id: user.id,
        // Games greet the player by first name, matching what the header shows.
        display_name: getFirstName(fullName) ?? fullName,
        birth_year: birthYear,
        grade_level: gradeLevel || null,
      });
      if (childError) throw childError;
    }

    return apiSuccess({ displayName: fullName, childCreated: needsChild });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
