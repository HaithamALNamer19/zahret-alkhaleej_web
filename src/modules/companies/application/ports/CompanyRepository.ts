import { Company } from "../../domain/Company";

export interface CompanyFilter {
  status?: "ACTIVE" | "INACTIVE";
  searchQuery?: string;
}

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByCode(code: string): Promise<Company | null>;
  findAll(filter?: CompanyFilter): Promise<Company[]>;
  save(company: Company): Promise<void>;
}
