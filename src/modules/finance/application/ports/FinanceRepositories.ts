import { Payment } from "../../domain/Payment";
import { Discount } from "../../domain/Discount";

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByNumber(number: string): Promise<Payment | null>;
  findByCompanyId(companyId: string): Promise<Payment[]>;
  findAll(): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}

export interface DiscountRepository {
  findById(id: string): Promise<Discount | null>;
  findByNumber(number: string): Promise<Discount | null>;
  findByCompanyId(companyId: string): Promise<Discount[]>;
  findAll(): Promise<Discount[]>;
  save(discount: Discount): Promise<void>;
}
