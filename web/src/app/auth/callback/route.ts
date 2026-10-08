import { createClient } from "@/lib/supabase/server";
import { storeUserGitHubToken } from "@/lib/github/token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin: fallbackOrigin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "") : fallbackOrigin);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      const { user, provider_token } = data.session;

      // Extract GitHub OAuth provider token and user profile
      if (user && provider_token) {
        const username =
          (user.user_metadata?.user_name as string | undefined) ??
          (user.user_metadata?.preferred_username as string | undefined);
        const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
        const displayName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          username ??
          user.email ??
          "Maintainer";

        // Store the token in Supabase user_metadata and public.profiles
        await storeUserGitHubToken(user.id, provider_token, {
          username,
          avatarUrl,
          displayName,
        });
      }

      const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/dashboard`;
      const response = NextResponse.redirect(redirectUrl);

      // Also set secure HTTP-only cookie for immediate SSR availability
      if (provider_token) {
        response.cookies.set("ghost_github_token", provider_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      return response;
    }

    if (error) {
      console.error("Supabase OAuth code exchange error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
