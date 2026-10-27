import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import { friendlyAuthMessage, isEmailTaken } from "@/lib/auth/auth-errors";

// Account-entry endpoint: anonymous guest entry, fresh signup, and claiming
// an existing anonymous session with an email/password all land here. See
// docs/saket/APP_FLOW.md "Guest -> claimed account". Returning-user login
// lives in /api/login instead.
const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("anonymous") }),
  z.object({
    mode: z.literal("email"),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      // Say what is wrong ("Password must be at least 8 characters.") rather
      // than a generic message the player can't act on.
      return apiError(
        "validation_failed",
        parsed.error.issues[0]?.message ?? "Invalid sign-in request.",
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

    // Where the confirmation email's link lands (see api/signin/callback).
    const emailRedirectTo = `${request.nextUrl.origin}/api/signin/callback`;

    // Already signed in as a guest -> this is a claim, not a fresh signup.
    // Same user id, so the guest's children and progress carry over.
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser?.is_anonymous) {
      const { data, error } = await supabase.auth.updateUser(
        { email, password },
        { emailRedirectTo },
      );
      if (error) {
        // An existing account's email: tell the client so it falls back to
        // logging in (which replaces the guest session) instead of dead-ending.
        if (isEmailTaken(error)) {
          return apiError(
            "validation_failed",
            "An account with this email already exists.",
            { reason: "email_already_registered" },
          );
        }
        return apiError("validation_failed", friendlyAuthMessage(error));
      }
      // With email confirmation on, the new address is only pending and the
      // guest session stays active until the link is clicked. With it off,
      // the address is applied immediately and this is already a full account.
      const pending = Boolean(data.user?.new_email);
      return apiSuccess(
        pending
          ? { userId: currentUser.id, isAnonymous: true, claimPending: true }
          : { userId: currentUser.id, isAnonymous: false },
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

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

    if (error) return apiError("validation_failed", friendlyAuthMessage(error));

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
