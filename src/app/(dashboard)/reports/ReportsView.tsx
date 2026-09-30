"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import * as XLSX from "xlsx";
import { BarChart3, Download, FileSpreadsheet, Printer } from "lucide-react";

interface ReportsViewProps {
  isManager: boolean;
  companies: { id: string; name: string; code: string }[];
  warehouses: { id: string; name: string; code: string }[];
  fishItems: { id: string; name: string }[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  isManager,
  companies,
  warehouses,
  fishItems,
}) => {
  const [reportType, setReportType] = useState<
    "inventory" | "inbound" | "outbound" | "payments" | "receivables"
  >("inventory");

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleExportExcel = () => {
    // Generate sample data based on report type
    let data: any[] = [];
    let fileName = "تقرير";

    if (reportType === "inventory") {
      fileName = "تقرير_المخزون_الحالي";
      data = [
        {
          "رقم الدفعة": "LOT-2026-000001",
          "الشركة": "شركة أسماك الخليج",
          "الصنف": "تونة",
          "الحجم": "3/5",
          "الرصيد المتبقي (كجم)": 8000,
          "تاريخ الدخول": "2026-10-01",
          "عمر الدفعة (أيام)": 20,
          "المرحلة": "المرحلة الأولى (1x)",
        },
      ];
    } else if (reportType === "inbound") {
      fileName = "تقرير_سندات_الاستلام_والتوريد";
      data = [
        {
          "رقم السند": "IN-2026-000001",
          "الشركة": "شركة بحر العرب للصيد",
          "تاريخ الاستلام": "2026-10-01",
          "إجمالي الوزن (كجم)": 10000,
          "الحالة": "معتمد",
        },
      ];
    } else if (reportType === "outbound") {
      fileName = "تقرير_سندات_الصرف";
      data = [
        {
          "رقم السند": "OUT-2026-000001",
          "الشركة": "شركة أسماك الخليج",
          "تاريخ الصرف": "2026-10-20",
          "الكمية المصروفة (كجم)": 4000,
          "الحالة": "معتمد",
        },
      ];
    } else if (reportType === "payments") {
      fileName = "تقرير_المدفوعات_والتحصيلات";
      data = [
        {
          "رقم السند": "PAY-2026-000001",
          "الشركة": "شركة أسماك الخليج",
          "المبلغ (ريال يمني)": 250000,
          "طريقة الدفع": "نقداً",
          "التاريخ": "2026-10-20",
          "الحالة": "معتمد",
        },
      ];
    } else if (reportType === "receivables") {
      fileName = "تقرير_المديونيات_ورسوم_التخزين";
      data = [
        {
          "كود الشركة": "COM-000001",
          "اسم الشركة": "شركة أسماك الخليج",
          "رسوم التخزين المستحقة": 500000,
          "إجمالي المدفوعات": 250000,
          "إجمالي الخصومات": 0,
          "صافي الرصيد المستحق": 250000,
        },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");

    // RTL sheet view setting
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    workbook.Workbook.Views[0] = { RTL: true };

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">التقارير الشاملة والتصدير</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            استخراج تقارير حركة المخزون والتخزين والتحصيلات بصيغة Excel و PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير ملف Excel</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 text-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </Button>
        </div>
      </div>

      {/* Filter Parameters */}
      <Card title="معايير وفلاتر التقرير">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">نوع التقرير *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="inventory">تقرير المخزون الحالي والدفعات</option>
              <option value="inbound">تقرير سندات الاستلام والتوريد</option>
              <option value="outbound">تقرير سندات الصرف والتسليم</option>
              {isManager && (
                <>
                  <option value="payments">تقرير المقبوضات والتحصيلات</option>
                  <option value="receivables">تقرير المديونيات وكشف الأرصدة</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الشركة (اختياري)</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="">جميع الشركات</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">عنبر التبريد (اختياري)</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="">جميع عنابر التبريد</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">من تاريخ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Preview Info Box */}
      <Card className="p-8 text-center space-y-3 bg-white border-dashed border-2 border-slate-200">
        <BarChart3 className="w-12 h-12 mx-auto text-primary-500" />
        <h3 className="font-bold text-slate-800 text-base">
          التقرير جاهز للعرض والتصدير
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          يمكنك الضغط على زر <strong>تصدير ملف Excel</strong> بالأعلى لتحميل التقرير باللغة العربية مع الأوزان بالكيلوجرام والمبالغ بالريال اليمني.
        </p>
      </Card>
    </div>
  );
};
