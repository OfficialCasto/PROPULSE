import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@propulse/database";

export function readConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function appOrigin() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").origin;
}

export async function supabase(writable = false) {
  const config = readConfig();
  if (!config) redirect("/setup");
  const jar = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" && appOrigin().startsWith("https:") },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        if (!writable) return; // Read-only render. Proxy owns request-time refresh.
        for (const { name, value, options } of values) jar.set(name, value, options);
      },
    },
  });
}

export async function requireUser(writable = false, next?: string) {
  const client = await supabase(writable);
  const { data, error } = await client.auth.getUser();
  if (error && error.status !== 401 && error.status !== 403 && error.name !== "AuthSessionMissingError") throw error;
  if (!data.user) redirect(next ? `/access/login?next=${encodeURIComponent(next)}` : "/access/login");
  return { client, user: data.user };
}
