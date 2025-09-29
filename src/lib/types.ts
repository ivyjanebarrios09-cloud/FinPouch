import type { Timestamp } from "firebase/firestore";

export type WalletActivity = {
  id: string;
  timestamp: Timestamp;
  userId: string;
};

export type Device = {
    id: string;
    deviceId: string;
    name: string;
    userId: string;
    createdAt: Timestamp;
}
