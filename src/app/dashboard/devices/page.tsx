import { DevicesClient } from "@/components/dashboard/devices-client";

export default function DevicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Your Devices</h2>
      </div>
      <DevicesClient />
    </div>
  );
}
