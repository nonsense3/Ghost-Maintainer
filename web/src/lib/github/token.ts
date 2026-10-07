import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env/server";

/**
 * Resolves the effective GitHub token for the current user or operation:
 * 1. HTTP-only secure cookie set during OAuth callback
 * 2. Supabase auth.users user_metadata (stored during OAuth or registration)
 * 3. public.profiles table (github_token column)
 * 4. Fallback: GITHUB_TOKEN from server environment (.env.local)
 */
export async function getUserGitHubToken(userId?: string): Promise<string | null> {
  // 1. Try reading HTTP-only cookie
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("ghost_github_token")?.value;
    if (cookieToken && cookieToken.trim().length > 0) {
      return cookieToken;
    }
  } catch {
    // cookies() unavailable in non-request contexts
  }

  // 2. Try current authenticated user session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetId = userId || user?.id;

    if (user && user.user_metadata?.github_token) {
      return user.user_metadata.github_token as string;
    }

    // 3. Try reading from public.profiles table
    if (targetId) {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("github_token")
        .eq("id", targetId)
        .maybeSingle();

      if (profile?.github_token) {
        return profile.github_token as string;
      }
    }
  } catch {
    // Database or auth query failure
  }

  // 4. Server environment fallback
  try {
    const { GITHUB_TOKEN } = getServerEnv();
    if (GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0) {
      return GITHUB_TOKEN;
    }
  } catch {
    // env not available
  }

  return null;
}

/**
 * Stores or updates a GitHub token for a user across all persistence layers:
 * - auth.users user_metadata (zero DDL required)
 * - public.profiles table (if column exists)
 */
export async function storeUserGitHubToken(
  userId: string,
  token: string,
  metadata?: { username?: string; avatarUrl?: string; displayName?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    // 1. Store in auth.users user_metadata
    const { error: userErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        github_token: token,
        ...(metadata?.username ? { github_username: metadata.username } : {}),
        ...(metadata?.avatarUrl ? { avatar_url: metadata.avatarUrl } : {}),
      },
    });

    if (userErr) {
      console.warn("Notice: user_metadata update:", userErr.message);
    }

    // 2. Attempt store in public.profiles table
    const profileRow: Record<string, unknown> = {
      id: userId,
      github_token: token,
      updated_at: new Date().toISOString(),
    };
    if (metadata?.displayName) profileRow.display_name = metadata.displayName;
    if (metadata?.username) profileRow.github_username = metadata.username;
    if (metadata?.avatarUrl) profileRow.avatar_url = metadata.avatarUrl;

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert(profileRow, { onConflict: "id" });

    if (profileErr && profileErr.message.includes("column")) {
      // Graceful fallback if github_token column not added to profiles yet
      await admin.from("profiles").upsert(
        {
          id: userId,
          display_name: metadata?.displayName ?? "Maintainer",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    }

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to store token";
    return { success: false, error: message };
  }
}
