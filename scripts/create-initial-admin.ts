import { adminAuth, adminFirestore } from "../src/core/infrastructure/firebase/admin";
import { Username } from "../src/core/domain/value-objects/Username";
import * as admin from "firebase-admin";

async function createInitialAdmin() {
  const usernameStr = process.env.INITIAL_ADMIN_USERNAME || "admin";
  const password = process.env.INITIAL_ADMIN_PASSWORD || "Admin@Zahret2026";
  const displayName = process.env.INITIAL_ADMIN_DISPLAY_NAME || "المدير العام للنظام";

  console.log(`[INIT] Creating initial GENERAL_MANAGER account: "${usernameStr}"...`);

  try {
    const usernameVo = Username.fromString(usernameStr);
    const syntheticEmail = usernameVo.toSyntheticEmail();

    let authUid: string;
    try {
      const existingAuth = await adminAuth.getUserByEmail(syntheticEmail);
      authUid = existingAuth.uid;
      await adminAuth.updateUser(authUid, {
        password,
        displayName,
      });
      console.log(`[INFO] Existing Firebase Auth user found (${authUid}), password and name updated.`);
    } catch (err: unknown) {
      const newAuth = await adminAuth.createUser({
        email: syntheticEmail,
        password,
        displayName,
      });
      authUid = newAuth.uid;
      console.log(`[INFO] Created new Firebase Auth user (${authUid}).`);
    }

    const userDocRef = adminFirestore.collection("users").doc(authUid);
    await userDocRef.set(
      {
        authUid,
        username: usernameVo.getValue(),
        displayName,
        role: "GENERAL_MANAGER",
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[SUCCESS] Initial General Manager created successfully!`);
    console.log(`Username: ${usernameVo.getValue()}`);
    console.log(`Display Name: ${displayName}`);
    console.log(`Role: GENERAL_MANAGER`);
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Failed to create initial admin:", error);
    process.exit(1);
  }
}

createInitialAdmin();
