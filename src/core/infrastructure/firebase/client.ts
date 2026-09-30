import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zahret-alkhaleej-wms",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "zahret-alkhaleej-wms.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
firestore = getFirestore(app);

// Connect to emulators if configured
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
  const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "localhost:8080";

  try {
    connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
    const [host, port] = firestoreEmulatorHost.split(":");
    connectFirestoreEmulator(firestore, host || "localhost", Number(port) || 8080);
  } catch (e) {
    // Emulator might already be connected in fast refresh
  }
}

export { app, auth, firestore };
