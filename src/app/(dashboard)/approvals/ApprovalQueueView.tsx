"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { reviewApprovalAction } from "@/server/actions/approvalActions";
import { FileCheck2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface ApprovalQueueViewProps {
  requests: any[];
  isManager: boolean;
  currentUserId: string;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({
  requests,
  isManager,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!selectedRequest) return;
    setError(null);

    if (decision === "REJECT" && !comment.trim()) {
      setError("يرجى كتابة سبب الرفض.");
      return;
    }

    setIsLoading(true);
    const res = await reviewApprovalAction({
      approvalId: selectedRequest.id,
      decision,
      comment,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل معالجة الطلب.");
      return;
    }

    setSelectedRequest(null);
    setComment("");
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "FIFO_OVERRIDE":
        return "تجاوز قاعدة FIFO";
      case "BACKDATED_TRANSACTION":
        return "حركة بتاريخ سابق";
      case "CANCEL_SENSITIVE_OPERATION":
        return "إلغاء عملية حساسة";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">طابور الموافقات الإدارية</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مراجعة واعتماد طلبات تجاوز FIFO والحركات الاستثنائية
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <FileCheck2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            لا توجد طلبات موافقة معلقة أو مسجلة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                  <th className="p-3.5">نوع الطلب</th>
                  <th className="p-3.5">مقدم الطلب</th>
                  <th className="p-3.5">تاريخ التقديم</th>
                  <th className="p-3.5">السبب والمبرر</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">المراجعة والبت</th>
                  {isManager && <th className="p-3.5 text-center">الإجراء</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900">
                      {getTypeName(r.type)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{r.requestedByName}</td>
                    <td className="p-3.5 text-slate-500">{r.requestedAt}</td>
                    <td className="p-3.5 text-slate-700 max-w-sm truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {r.status === "APPROVED"
                          ? "معتمد"
                          : r.status === "REJECTED"
                          ? "مرفوض"
                          : "قيد الانتظار"}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500 text-xs">
                      {r.reviewedByName ? (
                        <div>
                          <span className="font-semibold text-slate-700 block">
                            {r.reviewedByName}
                          </span>
                          <span className="text-slate-400 block">{r.reviewedAt}</span>
                          {r.reviewComment && (
                            <span className="text-slate-600 italic block mt-0.5">
                              "{r.reviewComment}"
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    {isManager && (
                      <td className="p-3.5 text-center">
                        {r.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setDecision("APPROVE");
                                setComment("معتمد بعد المراجعة");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setDecision("REJECT");
                                setComment("");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">مكتمل</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={decision === "APPROVE" ? "اعتماد طلب الموافقة" : "رفض طلب الموافقة"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-100">
            <div>
              <span className="text-slate-400">الطلب:</span>{" "}
              <strong>{getTypeName(selectedRequest?.type)}</strong>
            </div>
            <div>
              <span className="text-slate-400">مقدم الطلب:</span>{" "}
              <strong>{selectedRequest?.requestedByName}</strong>
            </div>
            <div>
              <span className="text-slate-400">السبب:</span> {selectedRequest?.reason}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {decision === "APPROVE" ? "ملاحظات الاعتماد (اختياري)" : "سبب الرفض الإداري *"}
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب توجيهاتك أو سبب القرار..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              required={decision === "REJECT"}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRequest(null)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              variant={decision === "APPROVE" ? "primary" : "danger"}
              isLoading={isLoading}
              onClick={handleReview}
            >
              {decision === "APPROVE" ? "تأكيد الاعتماد" : "تأكيد الرفض"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
