import * as admin from "firebase-admin";

interface FirebaseAdminServices {
  auth: admin.auth.Auth;
  firestore: admin.firestore.Firestore;
}

function initFirebaseAdmin(): FirebaseAdminServices {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zahret-alkhaleej-wms";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (privateKey) {
      // Format escaped newlines in environment variable
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (clientEmail && privateKey && !privateKey.includes("...")) {
      try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      } catch (err) {
        admin.initializeApp({ projectId });
      }
    } else {
      // Default / emulator initialization
      admin.initializeApp({
        projectId,
      });
    }
  }

  const firestore = admin.firestore();
  // Firestore emulator check
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    firestore.settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  }

  return {
    auth: admin.auth(),
    firestore,
  };
}

export const adminServices = initFirebaseAdmin();
export const adminAuth = adminServices.auth;
export const adminFirestore = adminServices.firestore;
