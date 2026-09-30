export interface CounterService {
  /**
   * Generates the next atomic sequence number for a given prefix and year
   * e.g., getNextSequence("IN", 2026) -> 1 -> formatted "IN-2026-000001"
   */
  getNextSequence(prefix: string, year: number): Promise<number>;
  getNextFormattedNumber(prefix: string, year: number): Promise<string>;
  getNextCompanyCode(): Promise<string>;
}
