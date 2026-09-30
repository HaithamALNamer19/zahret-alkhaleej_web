import { CounterService } from "@/core/application/ports/CounterService";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirestoreCounterService implements CounterService {
  private readonly collectionName = "counters";

  public async getNextSequence(prefix: string, year: number): Promise<number> {
    const counterId = `${prefix}-${year}`;
    const counterRef = adminFirestore.collection(this.collectionName).doc(counterId);

    return await adminFirestore.runTransaction(async (transaction) => {
      const snap = await transaction.get(counterRef);
      let currentVal = 0;
      if (snap.exists) {
        currentVal = snap.data()?.currentSequence || 0;
      }
      const nextVal = currentVal + 1;
      transaction.set(
        counterRef,
        {
          prefix,
          year,
          currentSequence: nextVal,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return nextVal;
    });
  }

  public async getNextFormattedNumber(prefix: string, year: number): Promise<string> {
    const seq = await this.getNextSequence(prefix, year);
    const padded = String(seq).padStart(6, "0");
    return `${prefix}-${year}-${padded}`;
  }

  public async getNextCompanyCode(): Promise<string> {
    const counterId = "COM-SEQ";
    const counterRef = adminFirestore.collection(this.collectionName).doc(counterId);

    const seq = await adminFirestore.runTransaction(async (transaction) => {
      const snap = await transaction.get(counterRef);
      let currentVal = 0;
      if (snap.exists) {
        currentVal = snap.data()?.currentSequence || 0;
      }
      const nextVal = currentVal + 1;
      transaction.set(
        counterRef,
        {
          prefix: "COM",
          currentSequence: nextVal,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return nextVal;
    });

    const padded = String(seq).padStart(6, "0");
    return `COM-${padded}`;
  }
}
