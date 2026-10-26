import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the link in the confirmation email (set as
// `emailRedirectTo` in /api/signin). Supabase confirms the address on its own
// server, then redirects here with a one-time `?code=`. Exchanging it for a
// session signs the person in straight away, so confirming an email feels
// like finishing sign-up rather than dropping them logged-out on the home page.
//
// The code can only be exchanged in the browser that started the sign-up (the
// PKCE verifier lives in its cookie). If someone opens the email on another
// device the exchange fails, but the address is already confirmed, so we send
// them home and they sign in normally.
//
// This URL must be listed under Redirect URLs in the Supabase dashboard
// (Authentication -> URL Configuration), for every origin the app runs on.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // The onboarding gate takes over from here for a first-time user.
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/?confirmed=1`);
}
