"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Badge } from "@/shared/ui/Badge";
import {
  createUserAction,
  disableUserAction,
  resetPasswordAction,
} from "@/server/actions/userActions";
import { USER_ROLES, UserRole } from "@/core/application/authorization/Role";
import { Users, Plus, KeyRound, UserX, AlertCircle } from "lucide-react";

interface UsersManagerViewProps {
  users: any[];
  currentUserId: string;
}

export const UsersManagerView: React.FC<UsersManagerViewProps> = ({
  users,
  currentUserId,
}) => {
  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");

  // Reset Password Modal
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [resetPass, setResetPass] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await createUserAction({
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      role: newRole,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل إنشاء المستخدم.");
      return;
    }

    setIsCreateModalOpen(false);
    setNewUsername("");
    setNewPassword("");
    setNewDisplayName("");
  };

  const handleDisable = async (userId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في إيقاف هذا الحساب؟")) return;
    setIsLoading(true);
    await disableUserAction(userId);
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setError(null);
    setIsLoading(true);

    const res = await resetPasswordAction(targetUser.id, resetPass);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل إعادة تعيين كلمة المرور.");
      return;
    }

    setTargetUser(null);
    setResetPass("");
    alert("تم إعادة تعيين كلمة المرور بنجاح.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            صلاحية خاصة بالمدير العام لإنشاء حسابات الموظفين وإعادة تعيين كلمات المرور
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>إنشاء مستخدم جديد</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                <th className="p-3.5">اسم العرض</th>
                <th className="p-3.5">اسم المستخدم</th>
                <th className="p-3.5">الدور والصلاحية</th>
                <th className="p-3.5">تاريخ الإنشاء</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">{u.displayName}</td>
                  <td className="p-3.5 font-mono text-slate-600" dir="ltr">
                    {u.username}
                  </td>
                  <td className="p-3.5 font-semibold text-primary-700">
                    {USER_ROLES[u.role as UserRole]?.labelAr || u.role}
                  </td>
                  <td className="p-3.5 text-slate-500">{u.createdAt}</td>
                  <td className="p-3.5">
                    <Badge variant={u.active ? "success" : "danger"}>
                      {u.active ? "نشط" : "موقوف"}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setTargetUser(u);
                          setResetPass("");
                        }}
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {u.id !== currentUserId && u.role !== "GENERAL_MANAGER" && u.active && (
                        <button
                          onClick={() => handleDisable(u.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="إيقاف الحساب"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء مستخدم نظام جديد"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="الاسم الكامل (للعرض) *"
            placeholder="مثال: أحمد سالم باحميد"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="اسم المستخدم (حروف إنجليزية وأرقام ونقاط فقط) *"
            placeholder="ahmed.salem"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            dir="ltr"
            className="text-right font-mono"
          />

          <Input
            label="كلمة المرور المؤقتة *"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            dir="ltr"
            className="text-right"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الدور الوظيفي *</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="EMPLOYEE">موظف مستودع (سندات ومخزون)</option>
              <option value="WAREHOUSE_MANAGER">مدير مستودعات (مخزون ومالية وموافقات)</option>
              <option value="GENERAL_MANAGER">المدير العام (الصلاحيات الكاملة)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              حفظ المستخدم
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!targetUser}
        onClose={() => setTargetUser(null)}
        title={`تعيين كلمة مرور جديدة للمستخدم: ${targetUser?.displayName}`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="كلمة المرور الجديدة *"
            type="password"
            placeholder="••••••••"
            value={resetPass}
            onChange={(e) => setResetPass(e.target.value)}
            required
            autoFocus
            dir="ltr"
            className="text-right"
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTargetUser(null)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              تحديث كلمة المرور
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
