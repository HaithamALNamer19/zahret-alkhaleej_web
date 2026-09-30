import { CompanyRepository, CompanyFilter } from "../application/ports/CompanyRepository";
import { Company, CompanyStatus } from "../domain/Company";
import { CompanyCode } from "@/core/domain/value-objects/CompanyCode";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseCompanyRepository implements CompanyRepository {
  private readonly collection = adminFirestore.collection("companies");

  public async findById(id: string): Promise<Company | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToCompany(doc.id, doc.data()!);
  }

  public async findByCode(code: string): Promise<Company | null> {
    const snap = await this.collection.where("code", "==", code.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToCompany(doc.id, doc.data());
  }

  public async findAll(filter?: CompanyFilter): Promise<Company[]> {
    let query: admin.firestore.Query = this.collection.orderBy("createdAt", "desc");

    if (filter?.status) {
      query = query.where("status", "==", filter.status);
    }

    const snap = await query.get();
    let companies = snap.docs.map((doc) => this.mapDocToCompany(doc.id, doc.data()));

    if (filter?.searchQuery) {
      const q = filter.searchQuery.trim().toLowerCase();
      companies = companies.filter(
        (c) =>
          c.getName().toLowerCase().includes(q) ||
          c.getCode().getValue().toLowerCase().includes(q) ||
          c.getPhone().includes(q)
      );
    }

    return companies;
  }

  public async save(company: Company): Promise<void> {
    const data = {
      code: company.getCode().getValue(),
      name: company.getName(),
      contactPerson: company.getContactPerson(),
      phone: company.getPhone(),
      notes: company.getNotes() || "",
      status: company.getStatus(),
      withdrawalBlocked: company.isWithdrawalBlocked(),
      withdrawalBlockReason: company.getWithdrawalBlockReason() || null,
      createdAt: admin.firestore.Timestamp.fromDate(company.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(company.getUpdatedAt()),
    };

    await this.collection.doc(company.getId()).set(data, { merge: true });
  }

  private mapDocToCompany(id: string, data: admin.firestore.DocumentData): Company {
    return Company.reconstitute({
      id,
      code: CompanyCode.fromString(data.code),
      name: data.name,
      contactPerson: data.contactPerson || "",
      phone: data.phone || "",
      notes: data.notes || "",
      status: (data.status as CompanyStatus) || "ACTIVE",
      withdrawalBlocked: data.withdrawalBlocked ?? false,
      withdrawalBlockReason: data.withdrawalBlockReason || undefined,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
