import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient, createServerSupabaseClient } from "@/src/lib/supabase-server";
import { env } from "@/src/lib/env";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

export async function POST(request: Request) {
  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on the server." },
      { status: 501 },
    );
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const userClient = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const adminClient = createServiceRoleSupabaseClient();

  const { error: deleteFavoritesError } = await adminClient
    .from("favorite_recipes")
    .delete()
    .eq("user_id", user.id);

  if (deleteFavoritesError) {
    return NextResponse.json({ error: "Failed to delete favorites." }, { status: 500 });
  }

  const { error: deleteRecipesError } = await adminClient
    .from("recipes")
    .delete()
    .eq("user_id", user.id);

  if (deleteRecipesError) {
    return NextResponse.json({ error: "Failed to delete recipes." }, { status: 500 });
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

