import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { ApprovalQueueView } from "./ApprovalQueueView";

export default async function ApprovalsPage() {
  const user = await requireAuth();

  const requests = await container.approvalRepository.findAll();
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  return (
    <ApprovalQueueView
      requests={requests.map((r) => ({
        id: r.getId(),
        type: r.getType(),
        status: r.getStatus(),
        requestedBy: r.getRequestedBy(),
        requestedByName: r.getRequestedByName(),
        requestedAt: r.getRequestedAt().toLocaleDateString("ar-YE"),
        reviewedBy: r.getReviewedBy(),
        reviewedByName: r.getReviewedByName(),
        reviewedAt: r.getReviewedAt() ? r.getReviewedAt()!.toLocaleDateString("ar-YE") : undefined,
        reason: r.getReason(),
        reviewComment: r.getReviewComment(),
        payload: r.getPayload(),
      }))}
      isManager={isManager}
      currentUserId={user.id}
    />
  );
}
