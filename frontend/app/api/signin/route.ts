import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";

// Account-entry endpoint: anonymous guest entry, fresh signup, and claiming
// an existing anonymous session with an email/password all land here. See
// docs/saket/APP_FLOW.md "Guest -> claimed account". Returning-user login
// lives in /api/login instead.
const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("anonymous") }),
  z.object({
    mode: z.literal("email"),
    email: z.string().email(),
    password: z.string().min(8),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid sign-in request.",
        parsed.error.flatten(),
      );
    }

    const supabase = await createClient();

    if (parsed.data.mode === "anonymous") {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) return apiError("internal_error", error.message);
      return apiSuccess({ userId: data.user?.id, isAnonymous: true });
    }

    const { email, password } = parsed.data;

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Already signed in as a guest -> this is a claim, not a fresh signup.
    // Same user id; is_anonymous flips to false once the new email is
    // confirmed. Supabase keeps the current (still-anonymous) session active
    // in the meantime rather than issuing a new one.
    if (currentUser?.is_anonymous) {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) return apiError("validation_failed", error.message);
      return apiSuccess({
        userId: currentUser.id,
        isAnonymous: true,
        claimPending: true,
      });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    // Duplicate signups can come back as an explicit error OR as a "faux"
    // success with an empty identities array, depending on the project's
    // email-enumeration-protection setting — handle both.
    const isDuplicate =
      error?.code === "user_already_exists" ||
      error?.message?.toLowerCase().includes("already registered") ||
      (data.user && data.user.identities?.length === 0);

    if (isDuplicate) {
      return apiError(
        "validation_failed",
        "An account with this email already exists.",
        { reason: "email_already_registered" },
      );
    }

    if (error) return apiError("validation_failed", error.message);

    // signUp() only returns a session immediately when email confirmation is
    // off. With it on (Supabase's default), the account exists but there is
    // no session yet — the client must not treat this as a completed login.
    return apiSuccess({
      userId: data.user?.id,
      isAnonymous: false,
      confirmationRequired: data.session === null,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
