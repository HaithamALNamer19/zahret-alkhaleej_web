import { adminAuth, adminFirestore } from "../src/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

async function seedDatabase() {
  console.log("========================================================");
  console.log("    بدء رفع الجداول والبيانات التأسيسية إلى Cloud Firestore ");
  console.log("========================================================\n");

  const batch = adminFirestore.batch();

  // 1. System Settings (system_settings / global)
  console.log("1. رفع إعدادات النظام العامة (system_settings)...");
  const settingsRef = adminFirestore.collection("system_settings").doc("global");
  batch.set(settingsRef, {
    defaultBaseDailyRateMilliYer: 5000, // 5 YER / KG / Day
    freeStorageDays: 15,
    stageDays: 30,
    doublingFactor: 2,
    freePeriodWarningDays: 3,
    companyDisplayName: "شركة زهرة الخليج للصيد - مستودعات التبريد",
    vatRatePercentage: 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2. Warehouses (warehouses)
  console.log("2. رفع مستودعات التبريد (warehouses)...");
  const warehousesData = [
    {
      id: "WH-01",
      code: "WH-01",
      name: "مستودع التبريد الرئيسي (1)",
      notes: "سعة 500 طن، تبريد -25 مئوية",
      status: "ACTIVE",
    },
    {
      id: "WH-02",
      code: "WH-02",
      name: "مستودع التجميد العميق (2)",
      notes: "سعة 300 طن، تجميد سريع -35 مئوية",
      status: "ACTIVE",
    },
    {
      id: "WH-03",
      code: "WH-03",
      name: "مستودع الأسماك السطحية (3)",
      notes: "سعة 200 طن، تبريد -18 مئوية",
      status: "ACTIVE",
    },
    {
      id: "WH-04",
      code: "WH-04",
      name: "مستودع الفرز والتفريغ (4)",
      notes: "سعة 150 طن، مخصص للفرز والتجهيز",
      status: "ACTIVE",
    },
  ];

  for (const wh of warehousesData) {
    const ref = adminFirestore.collection("warehouses").doc(wh.id);
    batch.set(ref, {
      code: wh.code,
      name: wh.name,
      notes: wh.notes,
      status: wh.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 3. Fish Catalog & Sizes (fish_items & fish_sizes)
  console.log("3. رفع دليل الأسماك والأحجام والأسعار (fish_items & fish_sizes)...");
  const catalogData = [
    {
      id: "fish-derak",
      name: "ديرك (كنعد) - Kingfish",
      defaultDailyRateMilliYer: 5000,
      active: true,
      sizes: [
        { id: "size-derak-sm", label: "صغير (1 - 3 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-derak-md", label: "وسط (3 - 6 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-derak-lg", label: "كبير (6 - 10 كجم)", overrideDailyRateMilliYer: 5500 },
        { id: "size-derak-xl", label: "جامبو (> 10 كجم)", overrideDailyRateMilliYer: 6000 },
      ],
    },
    {
      id: "fish-tuna",
      name: "تونة (ثمد) - Yellowfin Tuna",
      defaultDailyRateMilliYer: 4000,
      active: true,
      sizes: [
        { id: "size-tuna-md", label: "وسط (5 - 12 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-tuna-lg", label: "كبير (12 - 25 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-tuna-xl", label: "جامبو (> 25 كجم)", overrideDailyRateMilliYer: 4500 },
      ],
    },
    {
      id: "fish-shrimp",
      name: "جمبري (روبيان بحري) - Sea Shrimp",
      defaultDailyRateMilliYer: 7000,
      active: true,
      sizes: [
        { id: "size-shrimp-sm", label: "صغير (مقاس 50/60)", overrideDailyRateMilliYer: null },
        { id: "size-shrimp-md", label: "وسط (مقاس 30/40)", overrideDailyRateMilliYer: null },
        { id: "size-shrimp-lg", label: "كبير جامبو (مقاس 10/20)", overrideDailyRateMilliYer: 8000 },
      ],
    },
    {
      id: "fish-hamour",
      name: "هامور (وقار) - Grouper",
      defaultDailyRateMilliYer: 6000,
      active: true,
      sizes: [
        { id: "size-hamour-sm", label: "صغير (1 - 2 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-hamour-md", label: "وسط (2 - 5 كجم)", overrideDailyRateMilliYer: null },
        { id: "size-hamour-lg", label: "كبير (> 5 كجم)", overrideDailyRateMilliYer: null },
      ],
    },
    {
      id: "fish-bagha",
      name: "باغة (شروي) - Indian Mackerel",
      defaultDailyRateMilliYer: 3000,
      active: true,
      sizes: [
        { id: "size-bagha-std", label: "حجم قياسي (مشكل)", overrideDailyRateMilliYer: null },
      ],
    },
  ];

  for (const item of catalogData) {
    const itemRef = adminFirestore.collection("fish_items").doc(item.id);
    batch.set(itemRef, {
      name: item.name,
      defaultDailyRateMilliYer: item.defaultDailyRateMilliYer,
      active: item.active,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    for (const size of item.sizes) {
      const sizeRef = adminFirestore.collection("fish_sizes").doc(size.id);
      batch.set(sizeRef, {
        fishItemId: item.id,
        label: size.label,
        overrideDailyRateMilliYer: size.overrideDailyRateMilliYer,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  // 4. Companies (companies)
  console.log("4. رفع شركات الصيد (companies)...");
  const companiesData = [
    {
      id: "comp-aden",
      code: "COM-000001",
      name: "شركة خليج عدن للصيد البحري",
      contactPerson: "أحمد باحبيش",
      phone: "+967771234567",
      status: "ACTIVE",
      withdrawalBlocked: false,
      notes: "شريك استراتيجي - تفريغ ساحلي",
    },
    {
      id: "comp-shorooq",
      code: "COM-000002",
      name: "مؤسسة الشروق للخدمات السمكية",
      contactPerson: "سالم الميسري",
      phone: "+967733456789",
      status: "ACTIVE",
      withdrawalBlocked: false,
      notes: "تفريغ سفن صيد أعالي البحار",
    },
    {
      id: "comp-bahr",
      code: "COM-000003",
      name: "شركة البحر العربي للتصدير",
      contactPerson: "طارق الصبيحي",
      phone: "+967711987654",
      status: "ACTIVE",
      withdrawalBlocked: false,
      notes: "صادرات أسماك طازجة ومجمدة",
    },
    {
      id: "comp-nawras",
      code: "COM-000004",
      name: "شركة النورس للصيد المحدودة",
      contactPerson: "فؤاد العمودي",
      phone: "+967770112233",
      status: "ACTIVE",
      withdrawalBlocked: true,
      withdrawalBlockReason: "تجاوز السقف الائتماني وتراكم مديونية سابقة مستحقة",
      notes: "محظورة مؤقتاً من الصرف بقرار المدير العام",
    },
  ];

  for (const c of companiesData) {
    const compRef = adminFirestore.collection("companies").doc(c.id);
    batch.set(compRef, {
      code: c.code,
      name: c.name,
      contactPerson: c.contactPerson,
      phone: c.phone,
      status: c.status,
      withdrawalBlocked: c.withdrawalBlocked,
      withdrawalBlockReason: c.withdrawalBlockReason || null,
      notes: c.notes,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 5. Inbound Receipts, Lots & StockLocations
  console.log("5. رفع سندات الإدخال والدفعات ومواقع المخزون (inboundReceipts, lots, stockLocations)...");
  
  // Receipt 1
  const inb1Ref = adminFirestore.collection("inboundReceipts").doc("in-2026-000001");
  batch.set(inb1Ref, {
    receiptNumber: "IN-2026-000001",
    companyId: "comp-aden",
    entryDate: "2026-09-01",
    status: "POSTED",
    createdBy: "admin",
    notes: "شحنة أسماك ديرك وتونة قادمة من قوارب صيد خليج عدن",
    lines: [
      {
        id: "in-2026-000001-line-1",
        fishItemId: "fish-derak",
        fishSizeId: "size-derak-lg",
        totalWeightGrams: 5000000, // 5000 KG
        distributions: [
          { warehouseId: "WH-01", weightGrams: 3000000 },
          { warehouseId: "WH-02", weightGrams: 2000000 },
        ],
      },
      {
        id: "in-2026-000001-line-2",
        fishItemId: "fish-tuna",
        fishSizeId: "size-tuna-lg",
        totalWeightGrams: 8000000, // 8000 KG
        distributions: [
          { warehouseId: "WH-01", weightGrams: 8000000 },
        ],
      },
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Lot 1
  const lot1Ref = adminFirestore.collection("lots").doc("lot-2026-000001");
  batch.set(lot1Ref, {
    lotNumber: "LOT-2026-000001",
    inboundReceiptId: "in-2026-000001",
    companyId: "comp-aden",
    fishItemId: "fish-derak",
    fishSizeId: "size-derak-lg",
    fishNameSnapshot: "ديرك (كنعد) - Kingfish",
    fishSizeSnapshot: "كبير (6 - 10 كجم)",
    baseDailyRateMilliYer: 5500,
    freeDaysSnapshot: 15,
    stageDaysSnapshot: 30,
    doublingFactorSnapshot: 2,
    originalWeightGrams: 5000000,
    remainingWeightGrams: 3500000, // 1500 KG dispatched via OUT-2026-000001
    entryDate: "2026-09-01",
    lastWithdrawalDate: "2026-09-20",
    status: "OPEN",
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // StockLocations for Lot 1
  const loc1Ref = adminFirestore.collection("stockLocations").doc("loc-2026-000001-wh1");
  batch.set(loc1Ref, {
    lotId: "lot-2026-000001",
    warehouseId: "WH-01",
    remainingWeightGrams: 1500000, // 3000 KG initial - 1500 KG dispatched
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const loc2Ref = adminFirestore.collection("stockLocations").doc("loc-2026-000001-wh2");
  batch.set(loc2Ref, {
    lotId: "lot-2026-000001",
    warehouseId: "WH-02",
    remainingWeightGrams: 2000000, // 2000 KG intact
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Lot 2
  const lot2Ref = adminFirestore.collection("lots").doc("lot-2026-000002");
  batch.set(lot2Ref, {
    lotNumber: "LOT-2026-000002",
    inboundReceiptId: "in-2026-000001",
    companyId: "comp-aden",
    fishItemId: "fish-tuna",
    fishSizeId: "size-tuna-lg",
    fishNameSnapshot: "تونة (ثمد) - Yellowfin Tuna",
    fishSizeSnapshot: "كبير (12 - 25 كجم)",
    baseDailyRateMilliYer: 4000,
    freeDaysSnapshot: 15,
    stageDaysSnapshot: 30,
    doublingFactorSnapshot: 2,
    originalWeightGrams: 8000000,
    remainingWeightGrams: 8000000,
    entryDate: "2026-09-01",
    status: "OPEN",
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const loc3Ref = adminFirestore.collection("stockLocations").doc("loc-2026-000002-wh1");
  batch.set(loc3Ref, {
    lotId: "lot-2026-000002",
    warehouseId: "WH-01",
    remainingWeightGrams: 8000000,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Receipt 2
  const inb2Ref = adminFirestore.collection("inboundReceipts").doc("in-2026-000002");
  batch.set(inb2Ref, {
    receiptNumber: "IN-2026-000002",
    companyId: "comp-shorooq",
    entryDate: "2026-09-15",
    status: "POSTED",
    createdBy: "admin",
    notes: "شحنة جمبري بحري طازج",
    lines: [
      {
        id: "in-2026-000002-line-1",
        fishItemId: "fish-shrimp",
        fishSizeId: "size-shrimp-lg",
        totalWeightGrams: 3500000,
        distributions: [
          { warehouseId: "WH-02", weightGrams: 3500000 },
        ],
      },
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Lot 3
  const lot3Ref = adminFirestore.collection("lots").doc("lot-2026-000003");
  batch.set(lot3Ref, {
    lotNumber: "LOT-2026-000003",
    inboundReceiptId: "in-2026-000002",
    companyId: "comp-shorooq",
    fishItemId: "fish-shrimp",
    fishSizeId: "size-shrimp-lg",
    fishNameSnapshot: "جمبري (روبيان بحري) - Sea Shrimp",
    fishSizeSnapshot: "كبير جامبو (مقاس 10/20)",
    baseDailyRateMilliYer: 8000,
    freeDaysSnapshot: 15,
    stageDaysSnapshot: 30,
    doublingFactorSnapshot: 2,
    originalWeightGrams: 3500000,
    remainingWeightGrams: 3500000,
    entryDate: "2026-09-15",
    status: "OPEN",
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const loc4Ref = adminFirestore.collection("stockLocations").doc("loc-2026-000003-wh2");
  batch.set(loc4Ref, {
    lotId: "lot-2026-000003",
    warehouseId: "WH-02",
    remainingWeightGrams: 3500000,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 6. Outbound Receipts & OutboundAllocations
  console.log("6. رفع سندات الصرف والتخصيصات (outboundReceipts & outboundAllocations)...");
  const out1Ref = adminFirestore.collection("outboundReceipts").doc("out-2026-000001");
  batch.set(out1Ref, {
    receiptNumber: "OUT-2026-000001",
    companyId: "comp-aden",
    withdrawalDate: "2026-09-20",
    notes: "صرف جزئي لسوق الجملة المحلي",
    status: "POSTED",
    createdBy: "admin",
    lines: [
      {
        id: "out-2026-000001-line-1",
        fishItemId: "fish-derak",
        fishSizeId: "size-derak-lg",
        requestedWeightGrams: 1500000, // 1500 KG
      },
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const alloc1Ref = adminFirestore.collection("outboundAllocations").doc("out-2026-000001-alloc-1");
  batch.set(alloc1Ref, {
    outboundReceiptId: "out-2026-000001",
    outboundLineId: "out-2026-000001-line-1",
    lotId: "lot-2026-000001",
    stockLocationId: "loc-2026-000001-wh1",
    warehouseId: "WH-01",
    weightGrams: 1500000,
    withdrawalDate: "2026-09-20",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 7. Payments (payments)
  console.log("7. رفع سندات القبض المالي (payments)...");
  const pay1Ref = adminFirestore.collection("payments").doc("pay-2026-000001");
  batch.set(pay1Ref, {
    paymentNumber: "PAY-2026-000001",
    companyId: "comp-aden",
    amountMilliYer: 150000000, // 150,000 YER
    paymentDate: "2026-09-22",
    paymentMethod: "BANK_TRANSFER",
    status: "CONFIRMED",
    createdBy: "admin",
    notes: "سداد دفعة مقدمة من رسوم التخزين عبر تحويل بنكي",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 8. Discounts (discounts)
  console.log("8. رفع الخصومات المالية المعتمدة (discounts)...");
  const disc1Ref = adminFirestore.collection("discounts").doc("disc-2026-000001");
  batch.set(disc1Ref, {
    discountNumber: "DISC-2026-000001",
    companyId: "comp-aden",
    amountMilliYer: 25000000, // 25,000 YER
    date: "2026-09-25",
    reason: "خصم تشجيعي معتمد من الإدارة العامة للكميات الكبيرة",
    status: "APPROVED",
    approvedBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 9. Approval Requests (approvalRequests)
  console.log("9. رفع طلبات الاستئذان والموافقات (approvalRequests)...");
  const req1Ref = adminFirestore.collection("approvalRequests").doc("req-2026-000001");
  batch.set(req1Ref, {
    type: "FIFO_OVERRIDE",
    status: "APPROVED",
    requestedBy: "manager_user_id",
    requestedByName: "مدير المستودع المناوب",
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: "admin",
    reviewedByName: "المدير العام للنظام",
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reason: "طلب صرف مباشر من الدفعة الثانية بناءً على فحص جودة استثنائي للشحن الخارجي",
    reviewComment: "تمت الموافقة بعد مراجعة تقرير الفحص المخبري",
    payload: {
      companyId: "comp-aden",
      lotNumber: "LOT-2026-000002",
      weightKg: 2000,
    },
  });

  // 10. Counters (counters)
  console.log("10. رفع عدادات الأرقام التسلسلية (counters)...");
  const counters = [
    { id: "IN-2026", prefix: "IN", year: 2026, currentSequence: 2 },
    { id: "OUT-2026", prefix: "OUT", year: 2026, currentSequence: 1 },
    { id: "PAY-2026", prefix: "PAY", year: 2026, currentSequence: 1 },
    { id: "DISC-2026", prefix: "DISC", year: 2026, currentSequence: 1 },
    { id: "REQ-2026", prefix: "REQ", year: 2026, currentSequence: 1 },
    { id: "COM", prefix: "COM", currentSequence: 4 },
  ];

  for (const ctr of counters) {
    const ctrRef = adminFirestore.collection("counters").doc(ctr.id);
    batch.set(ctrRef, {
      ...ctr,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 11. Initial Audit Log (auditLogs)
  console.log("11. تسجيل حركة التدقيق الأولى (auditLogs)...");
  const auditRef = adminFirestore.collection("auditLogs").doc();
  batch.set(auditRef, {
    actorUserId: "admin",
    actorName: "المدير العام للنظام",
    action: "SYSTEM_INITIALIZATION",
    entityType: "SystemSettings",
    entityId: "global",
    details: "تهيئة وإطلاق قاعدة البيانات السحابية لكافة مستودعات زهرة الخليج للصيد",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Commit all collections atomically
  console.log("\nجارٍ حفظ البيانات وتثبيتها في Cloud Firestore...");
  await batch.commit();

  // 12. Create Auxiliary Users (Warehouse Manager & Warehouse Employee) in Firebase Auth & Firestore
  console.log("\n12. إنشاء مستخدمين تجريبيين لكافة الأدوار في Firebase Auth و Firestore...");
  const sampleUsers = [
    {
      username: "manager",
      password: "Manager@Zahret2026",
      displayName: "سالم الميسري (مدير المستودعات)",
      role: "WAREHOUSE_MANAGER",
    },
    {
      username: "employee",
      password: "Employee@Zahret2026",
      displayName: "عمر الكندي (موظف المستودع)",
      role: "EMPLOYEE",
    },
  ];

  for (const su of sampleUsers) {
    const syntheticEmail = `${su.username}@zahret-alkhaleej.local`;
    let authUid: string;
    try {
      const existing = await adminAuth.getUserByEmail(syntheticEmail);
      authUid = existing.uid;
      await adminAuth.updateUser(authUid, { password: su.password, displayName: su.displayName });
    } catch {
      const created = await adminAuth.createUser({
        email: syntheticEmail,
        password: su.password,
        displayName: su.displayName,
      });
      authUid = created.uid;
    }

    await adminFirestore.collection("users").doc(authUid).set(
      {
        authUid,
        username: su.username,
        displayName: su.displayName,
        role: su.role,
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ تم إنشاء المستخدم: ${su.username} (${su.role})`);
  }

  console.log("\n========================================================");
  console.log("   🎉 تم رفع جميع الجداول والبيانات بنجاح تام إلى Firebase!   ");
  console.log("========================================================\n");
  console.log("المجموعات (Collections) التي تم إنشاؤها وتعبئتها في Firebase Console:");
  console.log(" - users (المستخدمين والأدوار)");
  console.log(" - system_settings (إعدادات النظام وأسعار التخزين)");
  console.log(" - warehouses (مستودعات التبريد الأربعة)");
  console.log(" - fish_items (أصناف الأسماك الخمسة)");
  console.log(" - fish_sizes (أحجام الأسماك وأسعار التخزين الاستثنائية)");
  console.log(" - companies (شركات الصيد الأربعة وحالات الحظر)");
  console.log(" - inboundReceipts (سندات الإدخال)");
  console.log(" - lots (دفعات المخزون)");
  console.log(" - stockLocations (مواقع وأرصدة المستودعات)");
  console.log(" - outboundReceipts (سندات الصرف FIFO)");
  console.log(" - outboundAllocations (توزيعات الصرف)");
  console.log(" - payments (سندات القبض المالي)");
  console.log(" - discounts (الخصومات المعتمدة)");
  console.log(" - approvalRequests (طلبات الاستئذان والموافقات)");
  console.log(" - counters (العدادات التسلسلية للترقيم)");
  console.log(" - auditLogs (سجلات الرقابة والتدقيق)");
  console.log("--------------------------------------------------------\n");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ فشل رفع البيانات:", err);
    process.exit(1);
  });

