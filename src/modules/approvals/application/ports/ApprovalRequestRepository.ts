import { ApprovalRequest, ApprovalStatus } from "../../domain/ApprovalRequest";

export interface ApprovalRequestRepository {
  findById(id: string): Promise<ApprovalRequest | null>;
  findPending(): Promise<ApprovalRequest[]>;
  findAll(status?: ApprovalStatus): Promise<ApprovalRequest[]>;
  save(request: ApprovalRequest): Promise<void>;
}
