/**
 * Vantage Wealth Fiduciary Security
 * Cloudflare Turnstile Server-Side Verification Engine
 */

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured in development, bypass with notice
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("WARNING: TURNSTILE_SECRET_KEY is not set in production. Bypassing Turnstile.");
    }
    return { success: true };
  }

  // If token is missing
  if (!token) {
    // If testing with dummy test secret in dev
    if (secretKey === "1x0000000000000000000000000000000AA") {
      return { success: true };
    }
    return {
      success: false,
      error: "Human verification failed. Please complete the security check.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp && remoteIp !== "unknown") {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data: TurnstileVerifyResponse = await res.json();

    if (!data.success) {
      console.warn("Turnstile verification failed with error codes:", data["error-codes"]);
      return {
        success: false,
        error: "Security verification could not be validated. Please refresh and try again.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Turnstile verification network error:", error);
    // In case of network downtime with Cloudflare API, allow graceful degradation if not strictly blocked
    return {
      success: true,
    };
  }
}
