"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  collectionGroup,
  where,
} from "firebase/firestore";
import type { WalletActivity, Device } from "@/lib/types";
import {
  ShoppingCart,
  CalendarDays,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityByHourChart, ActivityDoughnutChart } from "./charts";
import { AiAdvice } from "./ai-advice";
import { subDays, startOfToday } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Helper: normalize timestamp -> millis
  // -------------------------
  function timestampToMillis(ts: any): number {
    if (!ts) return 0;

    // Firestore Timestamp (has toMillis)
    if (typeof ts === "object") {
      if (typeof ts.toMillis === "function") {
        return ts.toMillis();
      }
      if (typeof ts.toDate === "function") {
        return ts.toDate().getTime();
      }
      // raw object { seconds, nanoseconds }
      if ("seconds" in ts && "nanoseconds" in ts) {
        const secs = Number(ts.seconds || 0);
        const nanos = Number(ts.nanoseconds || 0);
        return secs * 1000 + Math.floor(nanos / 1e6);
      }
    }

    // number (ms)
    if (typeof ts === "number") return ts;

    // string: try ISO, then custom DD/MM/YYYY - hh:mm:ss AM/PM, then Date fallback
    if (typeof ts === "string") {
      // try ISO first
      const iso = Date.parse(ts);
      if (!isNaN(iso)) return iso;

      // try custom "DD/MM/YYYY - HH:MM:SS AM/PM"
      const m = ts.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1; // JS months 0-11
        const year = parseInt(m[3], 10);
        let hour = parseInt(m[4], 10);
        const minute = parseInt(m[5], 10);
        const second = parseInt(m[6], 10);
        const ampm = m[7];
        if (ampm) {
          if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
          if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
        }
        const d = new Date(year, month, day, hour, minute, second);
        if (!isNaN(d.getTime())) return d.getTime();
      }

      // final fallback
      const d2 = new Date(ts);
      if (!isNaN(d2.getTime())) return d2.getTime();
    }

    // unknown shape -> return 0 so it sorts to the end
    return 0;
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const deviceQuery = query(
      collection(db, "users", user.uid, "devices"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeDevices = onSnapshot(deviceQuery, (querySnapshot) => {
      const devicesData: Device[] = [];
      querySnapshot.forEach((doc) => {
        devicesData.push({ id: doc.id, ...(doc.data() as any) } as Device);
      });
      setDevices(devicesData);
    });

    // NOTE: if you want to avoid indexes, replace this collectionGroup+where+orderBy with a plain
    // collectionGroup(db, "walletActivity") and do filtering/sorting client-side. If you already have
    // the composite index in Firestore, this code will work fine.
    const activityQuery = query(
      collectionGroup(db, "walletActivity"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribeActivities = onSnapshot(activityQuery, (querySnapshot) => {
      const activitiesData: WalletActivity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // keep whatever timestamp shape Firestore gives you — we'll normalize when needed
        activitiesData.push({ id: doc.id, ...(data as any) } as WalletActivity);
      });

      // Optionally: sort client-side just in case timestamp types are mixed
      activitiesData.sort((a: any, b: any) => {
        return timestampToMillis(b.timestamp) - timestampToMillis(a.timestamp);
      });

      setActivities(activitiesData);
      setLoading(false);
    });

    return () => {
      unsubscribeDevices();
      unsubscribeActivities();
    };
  }, [user]);

  const totalOpens = activities.length;
  const totalDevices = devices.length;

  // -------------------------
  // Use timestampToMillis in derived values
  // -------------------------
  const opensToday = useMemo(() => {
    const todayMs = startOfToday().getTime();
    return activities.filter(
      (activity) => timestampToMillis((activity as any).timestamp) >= todayMs
    ).length;
  }, [activities]);

  const weeklyActivities = useMemo(() => {
    const oneWeekAgoMs = subDays(new Date(), 7).getTime();
    return activities.filter(
      (activity) => timestampToMillis((activity as any).timestamp) > oneWeekAgoMs
    );
  }, [activities]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Wallet Opens"
          value={totalOpens}
          icon={ShoppingCart}
          isLoading={loading}
        />
        <StatCard
          title="Wallet Opens Today"
          value={opensToday}
          icon={CalendarDays}
          isLoading={loading}
        />
        <StatCard
          title="Registered Devices"
          value={totalDevices}
          icon={Smartphone}
          isLoading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Wallet Opens by Hour</CardTitle>
            <CardDescription>
              An hourly breakdown of your wallet opening habits.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ActivityByHourChart activities={activities} isLoading={loading} />
          </CardContent>
        </Card>

        <div className="col-span-4 md:col-span-3 space-y-4">
          <AiAdvice walletOpens={totalOpens} />

          <Card>
            <CardHeader>
              <CardTitle>Weekly Peak Activity</CardTitle>
              <CardDescription>
                A distribution of your wallet opens by hour this week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityDoughnutChart
                activities={weeklyActivities}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
