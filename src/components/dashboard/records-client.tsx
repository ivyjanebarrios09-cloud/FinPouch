
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Unsubscribe } from "firebase/firestore";
import type { WalletActivity, Device } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { parseCustomTimestamp } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Unlock } from "lucide-react";

export function RecordsClient() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const devicesQuery = query(collection(db, "users", user.uid, "devices"));
    
    const unsubscribeDevices = onSnapshot(devicesQuery, (devicesSnapshot) => {
        const devicesData: Device[] = [];
        devicesSnapshot.forEach((doc) => {
            devicesData.push({ id: doc.id, ...doc.data() } as Device);
        });

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
            
            const unsubscribeActivities = onSnapshot(activityQuery, (activitySnapshot) => {
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
            activityUnsubscribers.push(unsubscribeActivities);
        });
        
        // Use a timer to ensure loading state is shown for a bit, improving UX
        const timer = setTimeout(() => setLoading(false), 500);

        return () => {
            clearTimeout(timer);
            activityUnsubscribers.forEach(unsub => unsub());
        };
    });

    return () => {
        unsubscribeDevices();
    };
  }, [user]);
  
  const isValidDate = (timestamp: any) => {
    if (!timestamp) return false;
    const date = parseCustomTimestamp(timestamp);
    return date && !isNaN(date.getTime());
  }

  const renderLoadingState = () => {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={`loading-${i}`} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
        <CardHeader>
            <CardTitle>TimeTrace</CardTitle>
            <CardDescription>A timeline of your recent wallet activity.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 py-4">
                {loading ? renderLoadingState() : (
                    activities.length > 0 ? (
                        <div className="relative pl-6">
                            <div className="absolute left-[30px] top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                            <ul className="space-y-8">
                                {activities.map((activity, index) => {
                                    const date = isValidDate(activity.timestamp) ? parseCustomTimestamp(activity.timestamp) : null;
                                    return (
                                        <li key={activity.id} className="relative flex items-start gap-4 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                                            <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary -translate-x-1/2 ring-4 ring-background">
                                                <Unlock className="h-4 w-4 text-secondary-foreground" />
                                            </div>
                                            <div className="pl-8 flex-1">
                                                <p className="font-semibold text-foreground">Wallet Opened</p>
                                                <p className="text-sm text-muted-foreground">{activity.deviceName || activity.deviceId || 'Unknown Device'}</p>
                                                <time className="text-xs text-muted-foreground/80">
                                                    {date ? `${format(date, "MMM d, yyyy")} at ${format(date, "h:mm a")}` : "N/A"}
                                                </time>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No records found.
                        </div>
                    )
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
