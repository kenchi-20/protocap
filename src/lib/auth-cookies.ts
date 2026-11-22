import { setCookie, getCookie, deleteCookie } from "cookies-next";
import type { User } from "@/types";

const SESSION_KEY = "one_id_session";

export function saveSessionCookie(user: User) {
  setCookie(SESSION_KEY, JSON.stringify(user), {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getSessionCookie(): User | null {
  const raw = getCookie(SESSION_KEY) as string | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  deleteCookie(SESSION_KEY);
}
