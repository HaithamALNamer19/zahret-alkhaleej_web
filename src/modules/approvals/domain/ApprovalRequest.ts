export type ApprovalType =
  | "FIFO_OVERRIDE"
  | "BACKDATED_TRANSACTION"
  | "CANCEL_SENSITIVE_OPERATION";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ApprovalRequestProps {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reason: string;
  reviewComment?: string;
  payload: Record<string, unknown>;
}

export class ApprovalRequest {
  private constructor(private readonly props: ApprovalRequestProps) {}

  public static create(
    props: Omit<ApprovalRequestProps, "status" | "requestedAt">
  ): ApprovalRequest {
    if (!props.reason || props.reason.trim().length === 0) {
      throw new Error("يجب كتابة سبب الطلب.");
    }
    return new ApprovalRequest({
      ...props,
      reason: props.reason.trim(),
      status: "PENDING",
      requestedAt: new Date(),
    });
  }

  public static reconstitute(props: ApprovalRequestProps): ApprovalRequest {
    return new ApprovalRequest(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getType(): ApprovalType {
    return this.props.type;
  }

  public getStatus(): ApprovalStatus {
    return this.props.status;
  }

  public getRequestedBy(): string {
    return this.props.requestedBy;
  }

  public getRequestedByName(): string {
    return this.props.requestedByName;
  }

  public getRequestedAt(): Date {
    return this.props.requestedAt;
  }

  public getReviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  public getReviewedByName(): string | undefined {
    return this.props.reviewedByName;
  }

  public getReviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  public getReason(): string {
    return this.props.reason;
  }

  public getReviewComment(): string | undefined {
    return this.props.reviewComment;
  }

  public getPayload(): Record<string, unknown> {
    return this.props.payload;
  }

  public approve(reviewerId: string, reviewerName: string, comment?: string): void {
    if (this.props.status !== "PENDING") {
      throw new Error("لا يمكن اعتماد طلب غير معلق.");
    }
    this.props.status = "APPROVED";
    this.props.reviewedBy = reviewerId;
    this.props.reviewedByName = reviewerName;
    this.props.reviewedAt = new Date();
    this.props.reviewComment = comment?.trim();
  }

  public reject(reviewerId: string, reviewerName: string, comment: string): void {
    if (this.props.status !== "PENDING") {
      throw new Error("لا يمكن رفض طلب غير معلق.");
    }
    if (!comment || comment.trim().length === 0) {
      throw new Error("يجب كتابة سبب الرفض.");
    }
    this.props.status = "REJECTED";
    this.props.reviewedBy = reviewerId;
    this.props.reviewedByName = reviewerName;
    this.props.reviewedAt = new Date();
    this.props.reviewComment = comment.trim();
  }

  public cancel(): void {
    if (this.props.status !== "PENDING") {
      throw new Error("لا يمكن إلغاء طلب تم البت فيه.");
    }
    this.props.status = "CANCELLED";
  }
}
