import { requireEnv, optionalEnv } from "@wpbot/shared";
import type { UsersRepository } from "./modules/users/service";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const COOKIE_NAME = "wpbot_session";
const OAUTH_STATE_COOKIE = "wpbot_oauth_state";

function getConfig() {
  return {
    googleClientId: requireEnv("AUTH_GOOGLE_ID"),
    googleClientSecret: requireEnv("AUTH_GOOGLE_SECRET"),
    secret: requireEnv("AUTH_SECRET"),
    webUrl: optionalEnv("WEB_URL", `http://localhost:${Bun.env.WEB_PORT ?? "4001"}`),
    adminEmails: (Bun.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
  };
}

// --- HMAC-signed session cookie ---

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(payload: Record<string, unknown>): Promise<string> {
  const { secret } = getConfig();
  const key = await getKey(secret);
  const data = btoa(JSON.stringify(payload));
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

export async function verifySession(token: string): Promise<Record<string, unknown> | null> {
  const { secret } = getConfig();
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sigB64] = parts;
  try {
    const key = await getKey(secret);
    const sig = Uint8Array.from(atob(sigB64!), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!valid) return null;
    return JSON.parse(atob(data!));
  } catch {
    return null;
  }
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie") ?? "";
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  }
  return cookies;
}

function setCookie(name: string, value: string, options: { maxAge?: number; path?: string } = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

function clearCookie(name: string): string {
  return setCookie(name, "", { maxAge: 0 });
}

// --- OAuth handlers ---

export async function handleGoogleRedirect(): Promise<Response> {
  const { googleClientId, webUrl } = getConfig();
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${webUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GOOGLE_AUTH_URL}?${params}`,
      "Set-Cookie": setCookie(OAUTH_STATE_COOKIE, state, { maxAge: 600 }),
    },
  });
}

export async function handleGoogleCallback(req: Request, usersService: UsersRepository): Promise<Response> {
  const { googleClientId, googleClientSecret, webUrl, adminEmails } = getConfig();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(req);
  const savedState = cookies[OAUTH_STATE_COOKIE];

  if (!code || !state || state !== savedState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: `${webUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return new Response("Failed to exchange code", { status: 502 });
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  // Get user info
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return new Response("Failed to fetch user info", { status: 502 });
  }

  const googleUser = (await userRes.json()) as {
    email: string;
    name: string;
    picture: string;
  };

  // Sync user with our DB
  const user = await usersService.getOrCreateByEmail(googleUser.email, googleUser.name);

  // Add google identity (idempotent)
  await usersService.addIdentity(user.id!, 'google', googleUser.email);

  // Auto-promote to admin if email is in ADMIN_EMAILS
  let role = user.role ?? 'client';
  if (adminEmails.includes(googleUser.email.toLowerCase()) && role !== 'admin') {
    await usersService.update(user.id!, { role: 'admin' });
    role = 'admin';
  }

  const session = await signSession({
    email: googleUser.email,
    name: googleUser.name,
    image: googleUser.picture,
    dbUserId: user.id,
    role,
  });

  const headers = new Headers();
  headers.set("Location", `${webUrl}/admin`);
  headers.append("Set-Cookie", setCookie(COOKIE_NAME, session, { maxAge: 60 * 60 * 24 * 30 }));
  headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE));

  return new Response(null, { status: 302, headers });
}

export async function handleGetSession(req: Request): Promise<Response> {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return Response.json({ user: null }, { status: 401 });
  }
  const payload = await verifySession(token);
  if (!payload) {
    return Response.json({ user: null }, { status: 401 });
  }
  return Response.json({
    user: {
      email: payload.email,
      name: payload.name,
      image: payload.image,
      dbUserId: payload.dbUserId,
      role: payload.role,
    },
  });
}

export async function handleLogout(): Promise<Response> {
  const { webUrl } = getConfig();
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${webUrl}/`,
      "Set-Cookie": clearCookie(COOKIE_NAME),
    },
  });
}
