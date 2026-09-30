import { WarehouseRepository } from "../ports/WarehouseRepository";
import { Warehouse, WarehouseStatus } from "../../domain/Warehouse";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";

export interface CreateWarehouseInput {
  code: string;
  name: string;
  notes?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateWarehouseUseCase {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateWarehouseInput): Promise<Result<Warehouse, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إنشاء مستودعات جديدة."));
      }

      const existing = await this.warehouseRepository.findByCode(input.code);
      if (existing) {
        return Result.fail(new Error(`كود المستودع "${input.code}" مستخدم مسبقاً.`));
      }

      const id = input.code.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const warehouse = Warehouse.create({
        id,
        code: input.code,
        name: input.name,
        notes: input.notes,
      });

      await this.warehouseRepository.save(warehouse);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_WAREHOUSE",
        entityType: "Warehouse",
        entityId: warehouse.getId(),
        reference: warehouse.getCode(),
        after: {
          code: warehouse.getCode(),
          name: warehouse.getName(),
        },
      });

      return Result.ok(warehouse);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface UpdateWarehouseInput {
  id: string;
  name: string;
  notes?: string;
  status?: WarehouseStatus;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class UpdateWarehouseUseCase {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: UpdateWarehouseInput): Promise<Result<Warehouse, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تعديل المستودعات."));
      }

      const warehouse = await this.warehouseRepository.findById(input.id);
      if (!warehouse) {
        return Result.fail(new Error("المستودع غير موجود."));
      }

      warehouse.updateDetails(input.name, input.notes, input.status);
      await this.warehouseRepository.save(warehouse);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "UPDATE_WAREHOUSE",
        entityType: "Warehouse",
        entityId: warehouse.getId(),
        reference: warehouse.getCode(),
        after: {
          name: warehouse.getName(),
          status: warehouse.getStatus(),
        },
      });

      return Result.ok(warehouse);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
