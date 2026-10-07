"use server";

import { createClient } from "@/lib/supabase/server";
import { storeUserGitHubToken } from "@/lib/github/token";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveUserGitHubToken(formData: FormData) {
  const token = formData.get("github_token") as string;
  if (!token || !token.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await storeUserGitHubToken(user.id, token.trim());
  revalidatePath("/dashboard");
}
