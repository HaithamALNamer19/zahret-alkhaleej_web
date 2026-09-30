import { User } from "../../domain/User";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  createAuthUser(username: string, password: string,displayName: string): Promise<string>;
  setUserPassword(authUid: string, newPassword: string): Promise<void>;
  revokeTokens(authUid: string): Promise<void>;
}
