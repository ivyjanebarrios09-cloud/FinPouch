import type { Timestamp } from "firebase/firestore";

export type WalletActivity = {
  id: string;
  timestamp: Timestamp;
  didSpend: boolean | null;
  userId: string;
};
