import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminFirestore } from "@/core/infrastructure/firebase/admin";
import { UserRole } from "@/core/application/authorization/Role";
import { cache } from "react";

export interface SessionUser {
  id: string;
  authUid: string;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "zak_wms_session";
const EXPIRES_IN_DAYS = 5;
const EXPIRES_IN_MS = EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

// High performance in-memory user cache (60 seconds TTL) to prevent repeated Firestore network hits
interface CachedUser {
  user: SessionUser;
  expiresAt: number;
}
const userProfileCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateUserSessionCache(userId?: string) {
  if (userId) {
    userProfileCache.delete(userId);
  } else {
    userProfileCache.clear();
  }
}

/**
 * Deduplicated per-request session verification using React cache()
 * and fast local JWT cryptographic verification (sub-millisecond).
 */
export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Fast cryptographic verification in-memory without blocking remote HTTP check
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
    if (!decodedClaims || !decodedClaims.uid) {
      return null;
    }

    const uid = decodedClaims.uid;
    const now = Date.now();
    const cached = userProfileCache.get(uid);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    // Retrieve user document from Firestore
    const userDoc = await adminFirestore.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData || userData.active === false) {
      return null;
    }

    const sessionUser: SessionUser = {
      id: userDoc.id,
      authUid: uid,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      role: userData.role as UserRole,
      active: true,
    };

    userProfileCache.set(uid, {
      user: sessionUser,
      expiresAt: now + CACHE_TTL_MS,
    });

    return sessionUser;
  } catch (error) {
    return null;
  }
});

export async function createSessionCookie(idToken: string): Promise<string> {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionCookie, {
    maxAge: EXPIRES_IN_DAYS * 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  return sessionCookie;
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      if (decoded?.uid) {
        invalidateUserSessionCache(decoded.uid);
      }
    } catch {
      // Ignore error during logout
    }
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
