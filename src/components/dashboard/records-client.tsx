
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Unsubscribe } from "firebase/firestore";
import type { WalletActivity, Device, SpendingRecord } from "@/lib/types";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { parseCustomTimestamp } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Unlock, ShoppingCart, DollarSign } from "lucide-react";
import Link from "next/link";

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
    
    // Listen for spending records
    const spendingRecordsQuery = query(collection(db, "users", user.uid, "spendingRecords"));
    const unsubscribeSpendingRecords = onSnapshot(spendingRecordsQuery, (spendingSnapshot) => {
        const spendingRecordsData: { [activityId: string]: SpendingRecord } = {};
        spendingSnapshot.forEach((doc) => {
            const record = { id: doc.id, ...doc.data() } as SpendingRecord;
            spendingRecordsData[record.activityId] = record;
        });

        // This will trigger a re-render and merge with existing activities
        setActivities(prevActivities =>
            prevActivities.map(act => ({
                ...act,
                spendingRecord: spendingRecordsData[act.id] || null,
            }))
        );
    });
    
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

        const deviceActivityPromises = devicesData.map((device) => {
            return new Promise<void>((resolve) => {
                const activityQuery = query(
                    collection(db, "users", user.uid, "devices", device.id, "walletActivity")
                );

                const unsubscribeActivities = onSnapshot(activityQuery, (activitySnapshot) => {
                    // Filter out old activities for this device
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

                    // Sort all activities together after any update
                    allActivities.sort((a, b) => {
                        const dateA = a.timestamp ? parseCustomTimestamp(a.timestamp)?.getTime() : 0;
                        const dateB = b.timestamp ? parseCustomTimestamp(b.timestamp)?.getTime() : 0;
                        return (dateB || 0) - (dateA || 0);
                    });

                    setActivities([...allActivities]);
                    resolve();
                }, (error) => {
                    console.error(`Error fetching activities for device ${device.id}:`, error);
                    resolve(); // Resolve even on error to not block other devices
                });
                activityUnsubscribers.push(unsubscribeActivities);
            });
        });
        
        Promise.all(deviceActivityPromises).then(() => {
             setLoading(false)
        });

        return () => {
            activityUnsubscribers.forEach(unsub => unsub());
        };
    });

    return () => {
        unsubscribeDevices();
        unsubscribeSpendingRecords();
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
                <div key={`loading-${i}`} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
  }

  const getRecordDisplay = (activity: WalletActivity) => {
    if (activity.spendingRecord === undefined) {
      // Data not loaded yet for this record
      return null;
    }
    if (activity.spendingRecord === null) {
      // No spending record exists
      return <p className="text-xs text-amber-500 animate-pulse">Pending spending details...</p>;
    }
    if (activity.spendingRecord.isSpent) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <ShoppingCart className="h-4 w-4" />
            <span>Spent: {activity.spendingRecord.spentWith}</span>
        </div>
      );
    }
    return (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <DollarSign className="h-4 w-4" />
            <span>Not Spent</span>
        </div>
    );
  };

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
                             <div className="absolute left-[30px] top-0 h-full w-0.5 bg-gradient-to-b from-primary/50 via-primary to-primary/50 animate-[glow_4s_ease-in-out_infinite] -translate-x-1/2"></div>
                            <ul className="space-y-8">
                                {activities.map((activity, index) => {
                                    const date = isValidDate(activity.timestamp) ? parseCustomTimestamp(activity.timestamp) : null;
                                    return (
                                        <li key={activity.id} className="relative flex items-start gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                                            <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary -translate-x-1/2 ring-4 ring-background">
                                                <Unlock className="h-4 w-4 text-secondary-foreground" />
                                            </div>
                                            <Link href={`/dashboard/records/${activity.id}?deviceId=${activity.deviceId}`} className="pl-8 flex-1 group">
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Wallet Opened</p>
                                                <p className="text-sm text-muted-foreground">{activity.deviceName || activity.deviceId || 'Unknown Device'}</p>
                                                <time className="text-xs text-muted-foreground/80 group-hover:text-primary transition-colors">
                                                    {date ? `${format(date, "MMM d, yyyy")} at ${format(date, "h:mm a")}` : "N/A"}
                                                </time>
                                                <div className="mt-2">
                                                    {getRecordDisplay(activity)}
                                                </div>
                                            </Link>
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
