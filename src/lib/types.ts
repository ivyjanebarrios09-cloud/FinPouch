
import type { Timestamp } from "firebase/firestore";

export type WalletActivity = {
  id: string;
  timestamp: string; // Changed to string to match Firestore
  userId: string;
  deviceId?: string;
  deviceName?: string;
};

export type Device = {
    id: string;
    deviceId: string;
    name: string;
    userId: string;
    createdAt: number;
}

    