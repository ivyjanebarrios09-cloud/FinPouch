import type { Timestamp } from "firebase/firestore";

export type WalletActivity = {
  id: string;
  timestamp: Timestamp;
  userId: string;
};
