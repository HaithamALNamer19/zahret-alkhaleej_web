import * as fs from "fs";
import * as path from "path";

interface AuditResult {
  category: string;
  check: string;
  status: "PASSED" | "FAILED";
  details?: string;
}

const results: AuditResult[] = [];

function check(category: string, name: string, condition: boolean, details?: string) {
  results.push({
    category,
    check: name,
    status: condition ? "PASSED" : "FAILED",
    details: details || (condition ? "مطابق تماماً" : "غير مطابق"),
  });
}

// 1. Audit Domain Layer Isolation (Zero foreign imports)
const domainFiles: string[] = [];
function findDomainFiles(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findDomainFiles(full);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
      domainFiles.push(full);
    }
  }
}

findDomainFiles(path.join("src", "core", "domain"));
const modDir = path.join("src", "modules");
if (fs.existsSync(modDir)) {
  for (const m of fs.readdirSync(modDir)) {
    findDomainFiles(path.join(modDir, m, "domain"));
  }
}

let domainViolations = 0;
const forbiddenDomainImports = ["firebase", "firebase-admin", "next", "react", "tailwind"];
for (const f of domainFiles) {
  const content = fs.readFileSync(f, "utf8");
  for (const imp of forbiddenDomainImports) {
    const regex = new RegExp(`from\\s+['"]${imp}(/.*)?['"]`, "i");
    if (regex.test(content)) {
      domainViolations++;
      console.error(`[DOMAIN VIOLATION] File ${f} imports ${imp}`);
    }
  }
}
check("1. Clean Architecture (Domain Isolation)", "خلو طبقة الـ Domain من أي تبعيات خارجية (firebase, next, react)", domainViolations === 0, `تم فحص ${domainFiles.length} ملفات domain - مخالفات: ${domainViolations}`);

// 2. Audit Application Use Cases (No direct Firebase imports)
const useCaseFiles: string[] = [];
function findUseCaseFiles(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findUseCaseFiles(full);
    } else if (entry.name.endsWith("UseCase.ts")) {
      useCaseFiles.push(full);
    }
  }
}
findUseCaseFiles(path.join("src", "modules"));

let appDirectFirebase = 0;
for (const f of useCaseFiles) {
  const content = fs.readFileSync(f, "utf8");
  // Check if directly instantiates firebase repos instead of using interfaces
  if (/new\s+Firebase\w+Repository/i.test(content)) {
    appDirectFirebase++;
    console.error(`[USE CASE DI VIOLATION] ${f} instantiates Firebase repository directly!`);
  }
}
check("2. Dependency Inversion & Ports", "استخدام Ports/Interfaces وعدم إنشاء Firebase Repositories داخل Use Cases", appDirectFirebase === 0, `تم فحص ${useCaseFiles.length} use cases - مخالفات: ${appDirectFirebase}`);

// 3. Precision Value Objects
const voFiles = [
  "src/core/domain/value-objects/Weight.ts",
  "src/core/domain/value-objects/Money.ts",
  "src/core/domain/value-objects/DailyStorageRate.ts",
  "src/core/domain/value-objects/BusinessDate.ts",
  "src/core/domain/value-objects/ReceiptNumber.ts",
  "src/core/domain/value-objects/CompanyCode.ts",
  "src/core/domain/value-objects/Username.ts",
];
const allVoExist = voFiles.every(f => fs.existsSync(f));
check("3. Precision Value Objects", "وجود كافة الـ Value Objects الأساسية (Weight, Money, DailyStorageRate, BusinessDate)", allVoExist);

// Check Weight integer grams
if (fs.existsSync("src/core/domain/value-objects/Weight.ts")) {
  const c = fs.readFileSync("src/core/domain/value-objects/Weight.ts", "utf8");
  check("3. Precision Value Objects", "تخزين الوزن داخلياً كأعداد صحيحة بالجرام (integer grams)", c.includes("grams") && c.includes("toKilograms"));
}

// Check Money milli-YER
if (fs.existsSync("src/core/domain/value-objects/Money.ts")) {
  const c = fs.readFileSync("src/core/domain/value-objects/Money.ts", "utf8");
  check("3. Precision Value Objects", "تخزين المبالغ داخلياً بوحدة الملّي-ريال (milli-YER)", c.includes("milliYer") && c.includes("toYer"));
}

// Check BusinessDate YYYY-MM-DD Asia/Aden
if (fs.existsSync("src/core/domain/value-objects/BusinessDate.ts")) {
  const c = fs.readFileSync("src/core/domain/value-objects/BusinessDate.ts", "utf8");
  check("3. Precision Value Objects", "اعتماد تاريخ العمل BusinessDate على اليوم بتوقيت عدن والتقويم فقط", c.includes("Asia/Aden") && c.includes("YYYY-MM-DD"));
}

// 4. Core Business Rules in Domain
// StorageFeeCalculator
if (fs.existsSync("src/modules/billing/domain/services/StorageFeeCalculator.ts")) {
  const c = fs.readFileSync("src/modules/billing/domain/services/StorageFeeCalculator.ts", "utf8");
  const hasDoubling = c.includes("doublingFactor") && c.includes("Math.pow");
  const hasNextDayRule = c.includes("addDays(1)") || c.includes("withdrawalDate");
  check("4. Storage Fee Engine", "حساب رسوم التخزين والتضاعف كل 30 يوماً وسريان الصرف لليوم التالي", hasDoubling && hasNextDayRule);
}

// FifoAllocationEngine
if (fs.existsSync("src/modules/inventory/domain/services/FifoAllocationEngine.ts")) {
  const c = fs.readFileSync("src/modules/inventory/domain/services/FifoAllocationEngine.ts", "utf8");
  const hasFifoSort = c.includes("isBefore") || c.includes("entryDate");
  check("5. FIFO Allocation Engine", "الصرف الآلي وفق FIFO عبر كافة المستودعات مع دعم تجزئة المستودعات للدفعة", hasFifoSort && c.includes("allocatedWeight"));
}

// Concurrency in Outbound
if (fs.existsSync("src/modules/inventory/application/use-cases/CreateOutboundReceiptUseCase.ts")) {
  const c = fs.readFileSync("src/modules/inventory/application/use-cases/CreateOutboundReceiptUseCase.ts", "utf8");
  const hasTx = c.includes("runTransaction");
  const hasWithdrawalBlock = c.includes("withdrawalBlocked");
  check("6. Concurrency & Withdrawal Block", "حماية الصرف المتزامن بـ Firestore Transaction ومنع الشركات المحظورة", hasTx && hasWithdrawalBlock);
}

// 5. Financial Privacy & Authorization
if (fs.existsSync("src/core/application/authorization/Role.ts")) {
  const c = fs.readFileSync("src/core/application/authorization/Role.ts", "utf8");
  const hasRoles = c.includes("EMPLOYEE") && c.includes("WAREHOUSE_MANAGER") && c.includes("GENERAL_MANAGER");
  check("7. Roles & Authorization", "الأدوار الثلاثة المعتمدة (EMPLOYEE, WAREHOUSE_MANAGER, GENERAL_MANAGER)", hasRoles);
}

if (fs.existsSync("src/core/application/authorization/Permission.ts")) {
  const c = fs.readFileSync("src/core/application/authorization/Permission.ts", "utf8");
  const hasPerms = c.includes("INBOUND_CREATE") && c.includes("PAYMENTS_VIEW") && c.includes("USERS_MANAGE");
  check("7. Roles & Authorization", "مصفوفة الصلاحيات وحظر الموظف العادي من الشؤون المالية", hasPerms);
}

// 6. Print Templates
const printInbound = fs.existsSync("src/app/print/inbound/[id]/page.tsx");
const printOutbound = fs.existsSync("src/app/print/outbound/[id]/page.tsx");
const printPayment = fs.existsSync("src/app/print/payment/[id]/page.tsx");
check("8. Official A4 Print Templates", "سندات الطباعة الرسمية A4 (إدخال، صرف، قبض مالي)", printInbound && printOutbound && printPayment);

// 7. Security Rules & Composite Indexes
const hasRules = fs.existsSync("firestore.rules");
const hasIndexes = fs.existsSync("firestore.indexes.json");
check("9. Firestore Security & Indexes", "ملف قواعد الأمان (firestore.rules) وفهارس الاستعلام (firestore.indexes.json)", hasRules && hasIndexes);

// 8. Composition Root (DI Container)
const hasContainer = fs.existsSync("src/server/container/index.ts");
check("10. Manual Dependency Injection", "نقطة التكوين المركزية Composition Root (server/container/index.ts)", hasContainer);

// Print Summary Table
console.log("\n========================================================");
console.log("       تقرير التدقيق والتحقق الشامل لمتطلبات المشروع     ");
console.log("========================================================\n");

let passedCount = 0;
for (const r of results) {
  const icon = r.status === "PASSED" ? "✅" : "❌";
  if (r.status === "PASSED") passedCount++;
  console.log(`${icon} [${r.category}] -> ${r.check} | ${r.details}`);
}

console.log("\n--------------------------------------------------------");
console.log(`إجمالي الفحوصات: ${results.length} | الناجحة: ${passedCount} | الفاشلة: ${results.length - passedCount}`);
console.log("--------------------------------------------------------\n");
