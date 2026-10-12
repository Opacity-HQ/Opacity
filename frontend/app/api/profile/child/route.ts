import { NextRequest } from "next/server";
import { z } from "zod";
import { requireChildAccess } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";

const patchSchema = z.object({
  childId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(80),
  // Stored as birth_year; the DB only allows 1990 and later.
  age: z.number().int().min(0).max(120),
});

// Edits a child's name and age. Age is converted to a birth year. When this
// is the signed-in (non-guest) owner's first child, the account's profile
// name is kept in step, since that is the name the header greets them with.
export async function PATCH(request: NextRequest) {
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid details.", parsed.error.flatten());
    }
    const { childId, displayName, age } = parsed.data;

    const birthYear = new Date().getFullYear() - age;
    if (birthYear < 1990) {
      return apiError("validation_failed", "Age is out of the supported range.", {
        fieldErrors: { age: [`Enter an age of ${new Date().getFullYear() - 1990} or under.`] },
      });
    }

    const { supabase, user } = await requireChildAccess(childId);

    const { data, error } = await supabase
      .from("children")
      .update({ display_name: displayName, birth_year: birthYear })
      .eq("id", childId)
      .eq("owner_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return apiError("forbidden", "Only the owner can edit this child.");
    }

    if (!user.is_anonymous) {
      const { data: first } = await supabase
        .from("children")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (first?.id === childId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
        if (profileError) throw profileError;
      }
    }

    return apiSuccess({ displayName, birthYear });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

// Deletes one child and, through ON DELETE CASCADE, everything hanging off it
// (sessions, trials, scores, reports, clinical profile). Only the owner can
// delete: the owner_id filter makes a teacher's request match zero rows.
export async function DELETE(request: NextRequest) {
  try {
    const childId = z
      .string()
      .uuid()
      .safeParse(request.nextUrl.searchParams.get("childId"));
    if (!childId.success) {
      return apiError("validation_failed", "A valid childId is required.");
    }
    const { supabase, user } = await requireChildAccess(childId.data);

    const { data, error } = await supabase
      .from("children")
      .delete()
      .eq("id", childId.data)
      .eq("owner_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return apiError("forbidden", "Only the owner can delete this child.");
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
