import { UserRepository } from "../application/ports/UserRepository";
import { User } from "../domain/User";
import { Username } from "@/core/domain/value-objects/Username";
import { UserRole } from "@/core/application/authorization/Role";
import { adminAuth, adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseUserRepository implements UserRepository {
  private readonly collection = adminFirestore.collection("users");

  public async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToUser(doc.id, doc.data()!);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const snap = await this.collection
      .where("username", "==", username.trim().toLowerCase())
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToUser(doc.id, doc.data());
  }

  public async findAll(): Promise<User[]> {
    const snap = await this.collection.orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => this.mapDocToUser(doc.id, doc.data()));
  }

  public async save(user: User): Promise<void> {
    const data = {
      authUid: user.getAuthUid(),
      username: user.getUsername().getValue(),
      displayName: user.getDisplayName(),
      role: user.getRole(),
      active: user.isActive(),
      createdAt: admin.firestore.Timestamp.fromDate(user.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(user.getUpdatedAt()),
    };

    await this.collection.doc(user.getId()).set(data, { merge: true });
  }

  public async createAuthUser(username: string, password: string, displayName: string): Promise<string> {
    const uVo = Username.fromString(username);
    const email = uVo.toSyntheticEmail();

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    return userRecord.uid;
  }

  public async setUserPassword(authUid: string, newPassword: string): Promise<void> {
    await adminAuth.updateUser(authUid, {
      password: newPassword,
    });
  }

  public async revokeTokens(authUid: string): Promise<void> {
    await adminAuth.revokeRefreshTokens(authUid);
  }

  private mapDocToUser(id: string, data: admin.firestore.DocumentData): User {
    return User.reconstitute({
      id,
      authUid: data.authUid || id,
      username: Username.fromString(data.username),
      displayName: data.displayName || data.username,
      role: data.role as UserRole,
      active: data.active ?? true,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
