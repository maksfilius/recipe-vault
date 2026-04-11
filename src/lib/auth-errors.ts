export function getFriendlyAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in. Check your inbox for the verification link.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password is too short. Use at least 8 characters.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again.";
  }

  return message;
}

