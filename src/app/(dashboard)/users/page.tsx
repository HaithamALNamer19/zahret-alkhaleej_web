import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { UsersManagerView } from "./UsersManagerView";

export default async function UsersPage() {
  const user = await requireAuth(["GENERAL_MANAGER"]);
  const users = await container.userRepository.findAll();

  return (
    <UsersManagerView
      users={users.map((u) => ({
        id: u.getId(),
        username: u.getUsername().getValue(),
        displayName: u.getDisplayName(),
        role: u.getRole(),
        active: u.isActive(),
        createdAt: u.getCreatedAt().toLocaleDateString("ar-YE"),
      }))}
      currentUserId={user.id}
    />
  );
}
