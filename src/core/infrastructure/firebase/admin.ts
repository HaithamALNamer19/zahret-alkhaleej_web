import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

interface FirebaseAdminServices {
  auth: admin.auth.Auth;
  firestore: admin.firestore.Firestore;
}

function initFirebaseAdmin(): FirebaseAdminServices {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zahret-alkhaleej";
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    const localKeyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(localKeyPath)) {
      try {
        const fileContent = fs.readFileSync(localKeyPath, "utf8");
        const serviceAccount = JSON.parse(fileContent);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
      } catch (err) {
        admin.initializeApp({ projectId });
      }
    } else if (clientEmail && privateKey && !privateKey.includes("...")) {
      const formattedKey = privateKey.replace(/\\n/g, "\n");
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formattedKey,
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
