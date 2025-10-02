
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import type { WalletActivity, Device } from "@/lib/types";
import {
  ShoppingCart,
  CalendarDays,
  Smartphone,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityByHourChart, ActivityDoughnutChart } from "./charts";
import { AiAdvice } from "./ai-advice";
import { subDays, startOfToday, isToday } from "date-fns";
import { parseCustomTimestamp } from "@/lib/utils";

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

      if (devicesData.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      let allActivities: WalletActivity[] = [];
      const activityUnsubscribers: Unsubscribe[] = [];

      devicesData.forEach((device) => {
        const activityQuery = query(
          collection(db, "users", user.uid, "devices", device.id, "walletActivity")
        );

        const unsubscribeActivity = onSnapshot(activityQuery, (activitySnapshot) => {
          allActivities = allActivities.filter(act => act.deviceId !== device.id);

          activitySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.timestamp) {
              allActivities.push({
                id: doc.id,
                ...data,
                deviceId: device.id,
                deviceName: device.name,
              } as WalletActivity);
            }
          });
          
          allActivities.sort((a, b) => {
            const dateA = a.timestamp ? parseCustomTimestamp(a.timestamp)?.getTime() : 0;
            const dateB = b.timestamp ? parseCustomTimestamp(b.timestamp)?.getTime() : 0;
            return (dateB || 0) - (dateA || 0);
          });

          setActivities([...allActivities]);
        });
        activityUnsubscribers.push(unsubscribeActivity);
      });

      setLoading(false);

      return () => {
        activityUnsubscribers.forEach((unsub) => unsub());
      };
    });

    return () => {
      unsubscribeDevices();
    };
  }, [user]);

  const totalOpens = activities.length;
  const totalDevices = devices.length;

  const opensToday = useMemo(() => {
    return activities.filter((activity) => {
      if (!activity.timestamp) return false;
      const date = parseCustomTimestamp(activity.timestamp);
      return date && isToday(date);
    }).length;
  }, [activities]);

  const weeklyActivities = useMemo(() => {
    const oneWeekAgo = subDays(new Date(), 7);
    return activities.filter((activity) => {
        if (!activity.timestamp) return false;
        const date = parseCustomTimestamp(activity.timestamp);
        return date && date > oneWeekAgo;
    });
  }, [activities]);

  const peakHour = useMemo(() => {
    if (activities.length === 0) return "N/A";

    const hourCounts = Array(24).fill(0);
    activities.forEach(activity => {
        if (activity.timestamp) {
            const date = parseCustomTimestamp(activity.timestamp);
            if (date) {
              const hour = date.getHours();
              hourCounts[hour]++;
            }
        }
    });

    const maxOpens = Math.max(...hourCounts);
    const peakHour24 = hourCounts.indexOf(maxOpens);
    
    if (peakHour24 === -1) return "N/A";

    if (peakHour24 === 0) return "12 AM";
    if (peakHour24 === 12) return "12 PM";
    if (peakHour24 < 12) return `${peakHour24} AM`;
    return `${peakHour24 - 12} PM`;

  }, [activities]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <StatCard
          title="Peak Activity Hour"
          value={peakHour}
          icon={Clock}
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

    