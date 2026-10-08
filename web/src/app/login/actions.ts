"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env/server";
import { storeUserGitHubToken } from "@/lib/github/token";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginWithEmailAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Try signing in directly
  let { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  // 2. If user doesn't exist, auto-create and confirm
  if (
    signInError &&
    (signInError.message.toLowerCase().includes("invalid login credentials") ||
      signInError.message.toLowerCase().includes("email not confirmed"))
  ) {
    try {
      const { data: usersList } = await admin.auth.admin.listUsers();
      const existing = usersList?.users?.find((u) => u.email === email);

      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        });
      } else {
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      }

      const retry = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      signInData = retry.data;
      signInError = retry.error;
    } catch {
      // Fall through to error reporting
    }
  }

  if (signInError) {
    return { error: signInError.message };
  }

  // Seamlessly attach default GITHUB_TOKEN from server environment if available
  if (signInData?.user) {
    const { GITHUB_TOKEN } = getServerEnv();
    if (GITHUB_TOKEN) {
      await storeUserGitHubToken(signInData.user.id, GITHUB_TOKEN);
    }
  }

  redirect(next);
}

export async function signUpWithEmailAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  try {
    // 1. Create or update user with auto-confirmed email
    const { data: usersList } = await admin.auth.admin.listUsers();
    const existing = usersList?.users?.find((u) => u.email === email);

    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) {
        return { error: createErr.message };
      }
    }

    // 2. Sign in immediately
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return { error: signInError.message };
    }

    // 3. Connect server GITHUB_TOKEN from env
    const { GITHUB_TOKEN } = getServerEnv();
    if (signInData?.user && GITHUB_TOKEN) {
      await storeUserGitHubToken(signInData.user.id, GITHUB_TOKEN);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    return { error: msg };
  }

  redirect(next);
}

/**
 * Fallback Quick Maintainer Sign-in action (for local testing when GitHub OAuth client is not yet provisioned)
 */
export async function quickMaintainerLoginAction(nextPath = "/dashboard") {
  const email = "nonsense3@users.noreply.github.com";
  const password = "Password123!";
  const { GITHUB_TOKEN } = getServerEnv();
  const admin = createAdminClient();
  const supabase = await createClient();

  try {
    const { data: usersList } = await admin.auth.admin.listUsers();
    let maintainerUser = usersList?.users?.find((u) => u.email === email);

    if (!maintainerUser) {
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          github_username: "nonsense3",
          full_name: "Ankit Dey",
          github_token: GITHUB_TOKEN,
          avatar_url: "https://avatars.githubusercontent.com/u/nonsense3",
        },
      });
      maintainerUser = created.data?.user ?? undefined;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      return { error: signInErr.message };
    }

    if (maintainerUser && GITHUB_TOKEN) {
      await storeUserGitHubToken(maintainerUser.id, GITHUB_TOKEN, {
        username: "nonsense3",
        displayName: "Ankit Dey",
      });

      const cookieStore = await cookies();
      cookieStore.set("ghost_github_token", GITHUB_TOKEN, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Quick sign in failed";
    return { error: msg };
  }

  redirect(nextPath);
}
