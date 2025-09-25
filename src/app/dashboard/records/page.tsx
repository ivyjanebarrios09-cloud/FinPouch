import { RecordsClient } from "@/components/dashboard/records-client";

export default function RecordsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Activity Records</h2>
      </div>
      <RecordsClient />
    </div>
  );
}
