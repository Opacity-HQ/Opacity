import { NextRequest } from "next/server";
import { z } from "zod";
import { requireChildAccess } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import type { Json } from "@/lib/db/types";
import {
  clinicalSectionKeys,
  clinicalSections,
  normalizeClinicalProfile,
} from "@/lib/profile/clinical";

// A child's optional clinical profile (see lib/profile/clinical.ts). Access
// goes through requireChildAccess + the owner-only RLS policy on
// child_clinical_profiles, so only the child's owner can read or write it.

const childIdSchema = z.string().uuid();

export async function GET(request: NextRequest) {
  try {
    const childId = childIdSchema.safeParse(
      request.nextUrl.searchParams.get("childId"),
    );
    if (!childId.success) {
      return apiError("validation_failed", "A valid childId is required.");
    }
    const { supabase } = await requireChildAccess(childId.data);

    const { data, error } = await supabase
      .from("child_clinical_profiles")
      .select("data, updated_at")
      .eq("child_id", childId.data)
      .maybeSingle();
    if (error) throw error;

    return apiSuccess({
      profile: normalizeClinicalProfile(data?.data),
      updatedAt: data?.updated_at ?? null,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

const putSchema = z.object({
  childId: z.string().uuid(),
  section: z.enum(clinicalSectionKeys as [string, ...string[]]),
  value: z.unknown(),
});

// PUT replaces exactly one section, leaving the others untouched.
export async function PUT(request: NextRequest) {
  try {
    const body = putSchema.safeParse(await request.json());
    if (!body.success) {
      return apiError("validation_failed", "Invalid request.", body.error.flatten());
    }
    const { childId, value } = body.data;
    const section = body.data.section as keyof typeof clinicalSections;

    const parsedValue = clinicalSections[section].safeParse(value);
    if (!parsedValue.success) {
      return apiError(
        "validation_failed",
        "Invalid details for this section.",
        parsedValue.error.flatten(),
      );
    }

    const { supabase } = await requireChildAccess(childId);

    const { data: existing, error: readError } = await supabase
      .from("child_clinical_profiles")
      .select("data")
      .eq("child_id", childId)
      .maybeSingle();
    if (readError) throw readError;

    const current =
      existing?.data &&
      typeof existing.data === "object" &&
      !Array.isArray(existing.data)
        ? (existing.data as Record<string, Json>)
        : {};
    const next = { ...current, [section]: parsedValue.data } as Json;

    const { error: writeError } = await supabase
      .from("child_clinical_profiles")
      .upsert({
        child_id: childId,
        data: next,
        updated_at: new Date().toISOString(),
      });
    if (writeError) throw writeError;

    return apiSuccess({ profile: normalizeClinicalProfile(next) });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

// DELETE removes the whole clinical profile for the child.
export async function DELETE(request: NextRequest) {
  try {
    const childId = childIdSchema.safeParse(
      request.nextUrl.searchParams.get("childId"),
    );
    if (!childId.success) {
      return apiError("validation_failed", "A valid childId is required.");
    }
    const { supabase } = await requireChildAccess(childId.data);

    const { error } = await supabase
      .from("child_clinical_profiles")
      .delete()
      .eq("child_id", childId.data);
    if (error) throw error;

    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
