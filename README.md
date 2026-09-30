# نظام إدارة مستودعات زهرة الخليج للصيد
## Zahret Al Khaleej Cold Storage & Warehouse Management System (WMS)

نظام ويب احترافي متكامل لإدارة مستودعات التبريد والمخازن السمكية لشركة **زهرة الخليج للصيد**، مبني بالكامل وفق أحدث المعايير البرمجية والهندسية الصارمة (**Modular Clean Architecture** و **Domain-Driven Design**).

---

## 🏗️ 1. المبادئ المعمارية (Clean Architecture)

تم بناء المشروع بعزل تام للطبقات، حيث تتبع تدفق الاعتماديات الصارم:
```text
Presentation Layer (Next.js 15 App Router / Server Components / Actions / Tailwind CSS)
      ↓
Application Layer (Use Cases / DTOs / Result Pattern / Ports)
      ↓
Domain Layer (Pure TypeScript / Entities / Value Objects / Business Invariants)

Infrastructure Layer (Adapters / Firebase Admin SDK / Firestore / Logging / Audit)
      ↳ implements Application & Domain Ports
```

### القواعد الصارمة المطبقة:
1. **خلو طبقة الـ Domain من أي تبعيات خارجية**: لا يحتوي كود الـ Domain على أي استيراد لـ `next/*`, `react/*`, `firebase/*`, أو أي مكتبة عرض.
2. **الحقن اليدوي للتبعيات (Manual Dependency Injection)**: جميع الـ Use Cases تعتمد على Interfaces (Ports)، ويتم حقنها من نقطة التكوين المركزية (`src/server/container/index.ts`).
3. **عزل البيانات المالية والأوزان بدقة متناهية (No Floating Point Discrepancies)**:
   - **الوزن (`Weight`)**: يخزن داخلياً بعدد صحيح من الجرامات (`integer grams`). 1250.75 كجم = `1,250,750` جرام.
   - **المبالغ المالية (`Money`)**: تخزن داخلياً بوحدة الملّي-ريال (`milli-YER`، حيث 1 ريال = 1,000 مللي-ريال) لتفادي أخطاء الجمع العشري `0.1 + 0.2`.
   - **أسعار التخزين اليومية (`DailyStorageRate`)**: تخزن بوحدة `milli-YER per KG per day` بدقة صحيحة.
   - **التواريخ التقويمية (`BusinessDate`)**: تعتمد على تاريخ اليوم فقط بتوقيت اليمن (`Asia/Aden`) بصيغة `YYYY-MM-DD` دون التأثر باختلاف المناطق الزمنية للمتصفحات.

---

## 🐟 2. قواعد التخزين والصرف والفواتير

### أ. رسوم التخزين والتضاعف التدريجي:
- **يوم الدخول**: يُحتسب كيوم كامل في التخزين (Day 1).
- **فترة التخزين المجانية الافتراضية**: 15 يوماً مجاناً (أو بحسب ما يتم تحديده لكل صيد أو شركة).
- **قاعدة التضاعف كل 30 يوماً**: بعد انتهاء الفترة المجانية، يبدأ احتساب السعر الأساسي. وكل 30 يوماً إضافية، يتضاعف سعر التخزين تلقائياً:
  $$\text{Effective Rate} = \text{Base Rate} \times 2^{\text{Stage}}$$
- **قاعدة سريان الصرف في اليوم التالي**: عند صرف كمية من دفعة معينة، يدخل تخفيض الرسوم حيز التنفيذ ابتداءً من **اليوم التالي لتاريخ الصرف**، ويُحاسب يوم الصرف نفسه بالوزن القديم.
- **الحساب التحليلي الزمني (Segmented Timeline)**: لا يعتمد النظام على حلقات تكرار يومية بطيئة، بل يقسم عمر كل دفعة إلى شرائح زمنية متجانسة بين المحطات الرئيسية (المجانية، مراحل التضاعف، وتواريخ الصرف).

### ب. محرك الصرف التلقائي وفق الوارد أولاً يصرف أولاً (FIFO):
- مفتاح الـ FIFO الموحد: `Company + FishItem + FishSize`.
- الصرف يتم تلقائياً من **أقدم دفعة تخزين مسجلة** (Cross-Warehouse FIFO) بغض النظر عن المستودع.
- في حالة توزع الدفعة الواحدة على أكثر من مستودع، يمكن للمسؤول تخصيص أوزان السحب بين مستودعات الدفعة مع التحقق الفوري من مطابقة المجموع للوزن المستحق.
- **حظر الصرف (`withdrawalBlocked`)**: يتم منع الصرف آلياً لأي شركة في حال وجود حظر مالي أو إداري، مع إمكانية التحقق في بيئة متزامنة تمنع التداخل (Concurrency Guard عبر Firestore Transactions).
- **نظام الموافقات لتجاوز FIFO أو الحركات السابقة**: يتطلب تجاوز FIFO أو إدخال/صرف حركات بتاريخ سابق موافقة كتابية موثقة من مدير المخازن أو المدير العام.

---

## 👥 3. مصفوفة الصلاحيات والأدوار

| الصلاحية / الوظيفة | موظف (`EMPLOYEE`) | مدير المخازن (`WAREHOUSE_MANAGER`) | المدير العام (`GENERAL_MANAGER`) |
| :--- | :---: | :---: | :---: |
| تسجيل سندات إدخال وصرف | ✅ | ✅ | ✅ |
| استعراض أرصدة المخزون والدفعات | ✅ | ✅ | ✅ |
| طباعة سندات الإدخال والصرف A4 | ✅ | ✅ | ✅ |
| طلب تجاوز FIFO / تاريخ سابق | ✅ | ✅ (موافقة واعتماد) | ✅ (موافقة كاملة) |
| استعراض المديونيات وكشوفات الحساب | ❌ (محظور تماماً) | ✅ | ✅ |
| تسجيل سندات القبض والخصومات | ❌ | ✅ | ✅ |
| طباعة سندات القبض المالية A4 | ❌ | ✅ | ✅ |
| إدارة الأصناف والأحجام والأسعار | ❌ | ✅ | ✅ |
| تصدير التقارير وجداول Excel | ❌ | ✅ | ✅ |
| إلغاء السندات وفق الضوابط | ❌ | ✅ | ✅ |
| إدارة حسابات المستخدمين وكلمات المرور | ❌ | ❌ | ✅ |
| إعدادات النظام واسم الشركة | ❌ | ❌ | ✅ |

---

## 📂 4. هيكل المجلدات (Modular Clean Architecture)

```text
src/
├── app/                                 # Next.js App Router
│   ├── (auth)/login/                   # صفحة تسجيل الدخول
│   ├── (dashboard)/                    # لوحة التحكم الرئيسية
│   │   ├── page.tsx                    # إحصائيات المؤشرات والإنذارات
│   │   ├── companies/                  # إدارة الشركات وكشوف الحساب
│   │   ├── inbound/                    # سندات الإدخال والتوزيع المخزني
│   │   ├── outbound/                   # سندات الصرف ومحرك FIFO
│   │   ├── inventory/                  # الأرصدة التحليلية والدفعات
│   │   ├── warehouses/                 # إدارة مستودعات التبريد
│   │   ├── catalog/                    # دليل الأصناف السمكية والأسعار
│   │   ├── finance/                    # السندات المالية والخصومات
│   │   ├── approvals/                  # طابور طلبات الاستثناء والموافقات
│   │   ├── reports/                    # تقارير المخزون والمالية وتصدير Excel
│   │   ├── users/                      # إدارة حسابات الموظفين والصلاحيات
│   │   ├── audit/                      # سجل التدقيق والرقابة الشامل
│   │   └── settings/                   # الإعدادات العامة للمؤسسة
│   └── print/                          # قوالب الطباعة الرسمية A4
│       ├── inbound/[id]/page.tsx       # سند إدخال رسمي A4
│       ├── outbound/[id]/page.tsx      # سند صرف وتسليم بضاعة A4
│       └── payment/[id]/page.tsx       # سند قبض مالي رسمي A4
│
├── core/                               # النواة المشتركة
│   ├── domain/value-objects/           # BusinessDate, Weight, Money, DailyStorageRate, etc.
│   ├── application/                    # Result Pattern, Permissions, Logger Ports
│   └── infrastructure/                 # Firebase Admin & Client, Audit Logger, Counter
│
├── modules/                            # موديولات النظام المستقلة
│   ├── auth/                           # إدارة الجلسات والمصادقة
│   ├── users/                          # مستخدمو النظام
│   ├── companies/                      # الشركات المودعة
│   ├── warehouses/                     # المستودعات الفيزيائية
│   ├── catalog/                        # الأصناف والأحجام والأسعار
│   ├── inventory/                      # الدفعات وسندات الإدخال والصرف ومحرك FIFO
│   ├── billing/                        # كشوفات الحساب وحساب رسوم التخزين
│   ├── finance/                        # المدفوعات والخصومات
│   ├── approvals/                      # الموافقات الاستثنائية
│   ├── historical-replay/              # محاكاة خط الزمن للحركات السابقة
│   └── settings/                       # إعدادات النظام العامة
│
├── server/
│   ├── container/                      # Composition Root (Manual Dependency Injection)
│   ├── auth/                           # فحص الجلسات وإدارة ملفات تعريف الارتباط
│   └── actions/                        # Server Actions الرابطة بين الواجهة والـ Use Cases
│
└── shared/                             # المكونات المشتركة
    ├── components/                     # DashboardShell, PrintButton
    └── ui/                             # Button, Input, Modal, Card, Badge
```

---

## 🚀 5. التثبيت والتشغيل المحلي

### المتطلبات المسبقة:
- Node.js إصدار `v20+` أو `v22+` أو `v24+`.
- حساب مشروع Firebase (أو محاكي Firebase Local Emulator Suite).

### خطوات الإعداد:
1. تثبيت الحزم:
```bash
npm install
```

2. ضبط متغيرات البيئة في ملف `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="zahret-alkhaleej-wms.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="zahret-alkhaleej-wms"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="zahret-alkhaleej-wms.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_INTERNAL_AUTH_DOMAIN="auth.zahratalkhaleej.local"

FIREBASE_ADMIN_PROJECT_ID="zahret-alkhaleej-wms"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk@zahret-alkhaleej-wms.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

SESSION_COOKIE_NAME="zak_wms_session"
SESSION_COOKIE_MAX_AGE_DAYS=5
```

3. إنشاء حساب المدير العام الأولي (Initial Admin Account):
```bash
npm run admin:create
```
البيانات الافتراضية للحساب:
- **اسم المستخدم**: `admin`
- **كلمة المرور الافتراضية**: `Admin@Zahret2026`
- **الدور**: `GENERAL_MANAGER`

4. تشغيل خادم التطوير:
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:3000`

---

## 🧪 6. الاختبارات والتحقق البرمجي

### تشغيل اختبارات الـ Domain والـ Unit Tests:
```bash
npm test
```
تشمل الاختبارات التحقق من:
- دقة وحسابات `Weight` وتحويلات الكيلوجرام والجرام والأطنان.
- تقويم وفوارق تواريخ `BusinessDate` بتوقيت عدن.
- دقة العمليات المالية `Money` وأسعار التخزين `DailyStorageRate`.
- معادلة تضاعف رسوم التخزين وسريان سحب الصيد لليوم التالي `StorageFeeCalculator`.
- خوارزمية الصرف المتزامن وتوزيع المستودعات `FifoAllocationEngine`.

### بناء نسخة الإنتاج:
```bash
npm run build
```

---

## 🔒 7. الأمان وقواعد البيانات (Security Rules)

- يحتوي ملف `firestore.rules` على سياسة أمان صارمة تعتمد على مبدأ **Default Deny**:
  - منع أي عمليات كتابة أو تعديل مباشرة من طرف العميل (`allow write: if false`).
  - جميع التعديلات تتم حصرياً عبر **Firebase Admin SDK** داخل الـ Server Use Cases.
  - حماية المجموعات الحساسة (المدفوعات، الخصومات، سجلات التدقيق، وسندات الصرف).
- يحتوي ملف `firestore.indexes.json` على الفهارس المركبة (Composite Indexes) لضمان سرعة الاستعلامات والترتيب عبر الحقول الزمنية وحالات السندات.

---

© 2026 شركة زهرة الخليج للصيد - جميع الحقوق محفوظة.

