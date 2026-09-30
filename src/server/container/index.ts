// Composition Root (Manual Dependency Injection Container)
// Instantiates Singletons and wires Use Cases with their Infrastructure Repositories.

import { ConsoleLogger } from "@/core/infrastructure/logging/ConsoleLogger";
import { FirestoreAuditLogger } from "@/core/infrastructure/audit/FirestoreAuditLogger";
import { FirestoreCounterService } from "@/core/infrastructure/counters/FirestoreCounterService";

import { FirebaseUserRepository } from "@/modules/users/infrastructure/FirebaseUserRepository";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/CreateUserUseCase";
import { DisableUserUseCase, ResetPasswordUseCase } from "@/modules/users/application/use-cases/UserAdminUseCases";

import { FirebaseCompanyRepository } from "@/modules/companies/infrastructure/FirebaseCompanyRepository";
import { CreateCompanyUseCase } from "@/modules/companies/application/use-cases/CreateCompanyUseCase";
import {
  ToggleCompanyWithdrawalBlockUseCase,
  UpdateCompanyUseCase,
} from "@/modules/companies/application/use-cases/CompanyUpdateUseCases";

import { FirebaseWarehouseRepository } from "@/modules/warehouses/infrastructure/FirebaseWarehouseRepository";
import {
  CreateWarehouseUseCase,
  UpdateWarehouseUseCase,
} from "@/modules/warehouses/application/use-cases/WarehouseUseCases";

import { FirebaseCatalogRepository } from "@/modules/catalog/infrastructure/FirebaseCatalogRepository";
import {
  CreateFishItemUseCase,
  UpdateFishPriceUseCase,
  CreateFishSizeUseCase,
} from "@/modules/catalog/application/use-cases/CatalogUseCases";

import { FirebaseSettingsRepository } from "@/modules/settings/infrastructure/FirebaseSettingsRepository";

import {
  FirebaseInboundReceiptRepository,
  FirebaseLotRepository,
  FirebaseStockLocationRepository,
  FirebaseOutboundReceiptRepository,
} from "@/modules/inventory/infrastructure/FirebaseInventoryRepositories";
import { CreateInboundReceiptUseCase } from "@/modules/inventory/application/use-cases/CreateInboundReceiptUseCase";
import { PreviewOutboundFifoAllocationUseCase } from "@/modules/inventory/application/use-cases/PreviewOutboundFifoAllocationUseCase";
import { CreateOutboundReceiptUseCase } from "@/modules/inventory/application/use-cases/CreateOutboundReceiptUseCase";
import {
  CancelOutboundReceiptUseCase,
  CancelInboundReceiptUseCase,
} from "@/modules/inventory/application/use-cases/CancelInventoryReceiptsUseCases";

import {
  FirebasePaymentRepository,
  FirebaseDiscountRepository,
} from "@/modules/finance/infrastructure/FirebaseFinanceRepositories";
import {
  RecordPaymentUseCase,
  RecordDiscountUseCase,
} from "@/modules/finance/application/use-cases/FinanceUseCases";
import { GetCompanyStatementUseCase } from "@/modules/billing/application/use-cases/GetCompanyStatementUseCase";

import { FirebaseApprovalRequestRepository } from "@/modules/approvals/infrastructure/FirebaseApprovalRequestRepository";
import {
  RequestFifoOverrideUseCase,
  ReviewApprovalUseCase,
} from "@/modules/approvals/application/use-cases/ApprovalUseCases";
import { HistoricalReplayService } from "@/modules/historical-replay/application/services/HistoricalReplayService";

class Container {
  // Core Infrastructure Singletons
  public readonly logger = new ConsoleLogger();
  public readonly auditLogger = new FirestoreAuditLogger();
  public readonly counterService = new FirestoreCounterService();

  // Repositories
  public readonly userRepository = new FirebaseUserRepository();
  public readonly companyRepository = new FirebaseCompanyRepository();
  public readonly warehouseRepository = new FirebaseWarehouseRepository();
  public readonly catalogRepository = new FirebaseCatalogRepository();
  public readonly settingsRepository = new FirebaseSettingsRepository();
  public readonly inboundRepository = new FirebaseInboundReceiptRepository();
  public readonly lotRepository = new FirebaseLotRepository();
  public readonly stockLocationRepository = new FirebaseStockLocationRepository();
  public readonly outboundRepository = new FirebaseOutboundReceiptRepository();
  public readonly paymentRepository = new FirebasePaymentRepository();
  public readonly discountRepository = new FirebaseDiscountRepository();
  public readonly approvalRepository = new FirebaseApprovalRequestRepository();

  // Use Cases: Users
  public readonly createUserUseCase = new CreateUserUseCase(
    this.userRepository,
    this.auditLogger
  );
  public readonly disableUserUseCase = new DisableUserUseCase(
    this.userRepository,
    this.auditLogger
  );
  public readonly resetPasswordUseCase = new ResetPasswordUseCase(
    this.userRepository,
    this.auditLogger
  );

  // Use Cases: Companies
  public readonly createCompanyUseCase = new CreateCompanyUseCase(
    this.companyRepository,
    this.counterService,
    this.auditLogger
  );
  public readonly updateCompanyUseCase = new UpdateCompanyUseCase(
    this.companyRepository,
    this.auditLogger
  );
  public readonly toggleCompanyWithdrawalBlockUseCase = new ToggleCompanyWithdrawalBlockUseCase(
    this.companyRepository,
    this.auditLogger
  );

  // Use Cases: Warehouses
  public readonly createWarehouseUseCase = new CreateWarehouseUseCase(
    this.warehouseRepository,
    this.auditLogger
  );
  public readonly updateWarehouseUseCase = new UpdateWarehouseUseCase(
    this.warehouseRepository,
    this.auditLogger
  );

  // Use Cases: Catalog & Pricing
  public readonly createFishItemUseCase = new CreateFishItemUseCase(
    this.catalogRepository,
    this.auditLogger
  );
  public readonly updateFishPriceUseCase = new UpdateFishPriceUseCase(
    this.catalogRepository,
    this.auditLogger
  );
  public readonly createFishSizeUseCase = new CreateFishSizeUseCase(
    this.catalogRepository,
    this.auditLogger
  );

  // Use Cases: Inventory (Inbound / Outbound / FIFO)
  public readonly createInboundReceiptUseCase = new CreateInboundReceiptUseCase(
    this.inboundRepository,
    this.companyRepository,
    this.catalogRepository,
    this.settingsRepository,
    this.counterService,
    this.auditLogger
  );
  public readonly previewOutboundFifoAllocationUseCase = new PreviewOutboundFifoAllocationUseCase(
    this.companyRepository,
    this.lotRepository,
    this.stockLocationRepository
  );
  public readonly createOutboundReceiptUseCase = new CreateOutboundReceiptUseCase(
    this.counterService,
    this.auditLogger
  );
  public readonly cancelOutboundReceiptUseCase = new CancelOutboundReceiptUseCase();
  public readonly cancelInboundReceiptUseCase = new CancelInboundReceiptUseCase();

  // Use Cases: Finance & Billing
  public readonly recordPaymentUseCase = new RecordPaymentUseCase(
    this.paymentRepository,
    this.companyRepository,
    this.counterService,
    this.auditLogger
  );
  public readonly recordDiscountUseCase = new RecordDiscountUseCase(
    this.discountRepository,
    this.companyRepository,
    this.counterService,
    this.auditLogger
  );
  public readonly getCompanyStatementUseCase = new GetCompanyStatementUseCase(
    this.companyRepository,
    this.lotRepository,
    this.outboundRepository,
    this.paymentRepository,
    this.discountRepository
  );

  // Use Cases: Approvals & Replay
  public readonly requestFifoOverrideUseCase = new RequestFifoOverrideUseCase(
    this.approvalRepository,
    this.auditLogger
  );
  public readonly reviewApprovalUseCase = new ReviewApprovalUseCase(
    this.approvalRepository,
    this.auditLogger
  );
  public readonly historicalReplayService = new HistoricalReplayService(
    this.auditLogger
  );
}

export const container = new Container();
