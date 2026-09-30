import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminFirestore } from "@/core/infrastructure/firebase/admin";
import { UserRole } from "@/core/application/authorization/Role";

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

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie via Firebase Admin
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!decodedClaims || !decodedClaims.uid) {
      return null;
    }

    // Retrieve user document from Firestore to ensure active status and latest role
    const userDoc = await adminFirestore.collection("users").doc(decodedClaims.uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData || userData.active === false) {
      return null;
    }

    return {
      id: userDoc.id,
      authUid: decodedClaims.uid,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      role: userData.role as UserRole,
      active: true,
    };
  } catch (error) {
    return null;
  }
}

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
