import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";

// Returning-user login-session flows. Account creation and guest entry live
// in /api/signin instead — see backend/backend.md.
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid login request.",
        parsed.error.flatten(),
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(
      parsed.data,
    );

    if (error) {
      if (error.code === "email_not_confirmed") {
        return apiError(
          "unauthorized",
          "Please confirm your email before signing in.",
          { reason: "email_not_confirmed" },
        );
      }
      return apiError("unauthorized", "Incorrect email or password.");
    }

    return apiSuccess({ userId: data.user?.id, isAnonymous: false });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return apiError("internal_error", error.message);
    return apiSuccess({ signedOut: true });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
