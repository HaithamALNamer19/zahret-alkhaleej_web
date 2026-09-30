import { UserRole } from "./Role";
import { Permission } from "./Permission";

export class AuthorizationService {
  private static readonly ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
    EMPLOYEE: new Set<Permission>([
      "INBOUND_CREATE",
      "INBOUND_VIEW",
      "INBOUND_PRINT",
      "OUTBOUND_CREATE",
      "OUTBOUND_VIEW",
      "OUTBOUND_PRINT",
      "INVENTORY_VIEW",
      "CATALOG_VIEW",
      "COMPANIES_VIEW_BASIC",
      "WAREHOUSES_VIEW",
      "FIFO_OVERRIDE_REQUEST",
      "BACKDATED_REQUEST",
    ]),

    WAREHOUSE_MANAGER: new Set<Permission>([
      // All employee permissions
      "INBOUND_CREATE",
      "INBOUND_VIEW",
      "INBOUND_PRINT",
      "INBOUND_CANCEL",
      "OUTBOUND_CREATE",
      "OUTBOUND_VIEW",
      "OUTBOUND_PRINT",
      "OUTBOUND_CANCEL",
      "INVENTORY_VIEW",
      "INVENTORY_MANAGE",
      "CATALOG_VIEW",
      "CATALOG_MANAGE",
      "PRICE_VIEW",
      "PRICE_MANAGE",
      "COMPANIES_VIEW_BASIC",
      "COMPANIES_VIEW_FINANCIAL",
      "WAREHOUSES_VIEW",
      "WAREHOUSES_MANAGE",
      "PAYMENTS_VIEW",
      "PAYMENTS_CREATE",
      "PAYMENTS_CANCEL",
      "DISCOUNTS_VIEW",
      "DISCOUNTS_CREATE",
      "STATEMENTS_VIEW",
      "FIFO_OVERRIDE_REQUEST",
      "FIFO_OVERRIDE_APPROVE",
      "BACKDATED_REQUEST",
      "BACKDATED_APPROVE",
      "AUDIT_VIEW_OPERATIONAL",
      "REPORTS_VIEW",
    ]),

    GENERAL_MANAGER: new Set<Permission>([
      // Complete permissions
      "INBOUND_CREATE",
      "INBOUND_VIEW",
      "INBOUND_PRINT",
      "INBOUND_CANCEL",
      "OUTBOUND_CREATE",
      "OUTBOUND_VIEW",
      "OUTBOUND_PRINT",
      "OUTBOUND_CANCEL",
      "INVENTORY_VIEW",
      "INVENTORY_MANAGE",
      "CATALOG_VIEW",
      "CATALOG_MANAGE",
      "PRICE_VIEW",
      "PRICE_MANAGE",
      "COMPANIES_VIEW_BASIC",
      "COMPANIES_VIEW_FINANCIAL",
      "COMPANIES_MANAGE",
      "WAREHOUSES_VIEW",
      "WAREHOUSES_MANAGE",
      "PAYMENTS_VIEW",
      "PAYMENTS_CREATE",
      "PAYMENTS_CANCEL",
      "DISCOUNTS_VIEW",
      "DISCOUNTS_CREATE",
      "STATEMENTS_VIEW",
      "FIFO_OVERRIDE_REQUEST",
      "FIFO_OVERRIDE_APPROVE",
      "BACKDATED_REQUEST",
      "BACKDATED_APPROVE",
      "USERS_VIEW",
      "USERS_MANAGE",
      "USERS_RESET_PASSWORD",
      "SETTINGS_MANAGE",
      "AUDIT_VIEW_ALL",
      "AUDIT_VIEW_OPERATIONAL",
      "REPORTS_VIEW",
    ]),
  };

  public static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.has(permission);
  }

  public static canAccessFinancialData(role: UserRole): boolean {
    return this.hasPermission(role, "COMPANIES_VIEW_FINANCIAL");
  }

  public static canManageUsers(role: UserRole): boolean {
    return this.hasPermission(role, "USERS_MANAGE");
  }

  public static canApproveFifoOverride(role: UserRole): boolean {
    return this.hasPermission(role, "FIFO_OVERRIDE_APPROVE");
  }

  public static canApproveBackdated(role: UserRole): boolean {
    return this.hasPermission(role, "BACKDATED_APPROVE");
  }
}
