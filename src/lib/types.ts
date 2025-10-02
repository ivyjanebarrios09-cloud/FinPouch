import type { Timestamp } from "firebase/firestore";

export type WalletActivity = {
  id: string;
  timestamp: number;
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
