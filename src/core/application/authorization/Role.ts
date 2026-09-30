export type UserRole = "EMPLOYEE" | "WAREHOUSE_MANAGER" | "GENERAL_MANAGER";

export const USER_ROLES: Record<UserRole, { labelAr: string; role: UserRole }> = {
  EMPLOYEE: {
    role: "EMPLOYEE",
    labelAr: "موظف مخزن",
  },
  WAREHOUSE_MANAGER: {
    role: "WAREHOUSE_MANAGER",
    labelAr: "مدير المستودع",
  },
  GENERAL_MANAGER: {
    role: "GENERAL_MANAGER",
    labelAr: "المدير العام",
  },
};
