import type { AuthError } from "@supabase/supabase-js";

// "This email already has an account", whether Supabase reports it with the
// `email_exists` / `user_already_exists` code or only in the message (the
// wording differs between signUp and updateUser, and between versions).
export function isEmailTaken(error: AuthError) {
  return (
    error.code === "email_exists" ||
    error.code === "user_already_exists" ||
    /already (been )?registered/i.test(error.message)
  );
}

// Supabase's own messages for the failures a person can actually hit while
// signing up, reworded so they say what to do next. Anything else passes
// through unchanged.
export function friendlyAuthMessage(error: AuthError) {
  // The resend cooldown shares the rate-limit error code, so tell it apart by
  // its message and check it first.
  if (/only request this after/i.test(error.message)) {
    return "We just sent a confirmation email to that address. Check your inbox, or try again in a minute.";
  }
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Too many sign-up emails were sent recently. Please wait a few minutes and try again.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "weak_password":
      return "That password is too easy to guess. Try a longer one, or mix in numbers and symbols.";
    case "email_address_invalid":
      return "That email address can't be used. Check it and try again.";
    case "signup_disabled":
      return "New sign-ups are turned off right now.";
  }
  return error.message;
}
