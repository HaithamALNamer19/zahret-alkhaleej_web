export type UserRole = "EMPLOYEE" | "WAREHOUSE_MANAGER" | "GENERAL_MANAGER";

export const USER_ROLES: Record<UserRole, { labelAr: string; role: UserRole }> = {
  EMPLOYEE: {
    role: "EMPLOYEE",
    labelAr: "موظف مستودع",
  },
  WAREHOUSE_MANAGER: {
    role: "WAREHOUSE_MANAGER",
    labelAr: "مدير مستودعات",
  },
  GENERAL_MANAGER: {
    role: "GENERAL_MANAGER",
    labelAr: "المدير العام",
  },
};
