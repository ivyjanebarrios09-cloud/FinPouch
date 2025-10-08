
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Unsubscribe } from "firebase/firestore";
import type { WalletActivity, Device, SpendingRecord } from "@/lib/types";
import { addDays, format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { parseCustomTimestamp } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Unlock, Edit, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from "react-day-picker"

export function RecordsClient() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [spendingRecords, setSpendingRecords] = useState<{[activityId: string]: SpendingRecord}>({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const spendingRecordsQuery = query(collection(db, "users", user.uid, "spendingRecords"));
    const unsubscribeSpendingRecords = onSnapshot(spendingRecordsQuery, (spendingSnapshot) => {
        const spendingRecordsData: { [activityId: string]: SpendingRecord } = {};
        spendingSnapshot.forEach((doc) => {
            const record = { id: doc.id, ...doc.data() } as SpendingRecord;
            spendingRecordsData[record.activityId] = record;
        });
        setSpendingRecords(spendingRecordsData);
    });

    const devicesQuery = query(collection(db, "users", user.uid, "devices"));
    const unsubscribeDevices = onSnapshot(devicesQuery, (devicesSnapshot) => {
        const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
        
        if (devices.length === 0) {
            setActivities([]);
            setLoading(false);
            return;
        }

        const activityUnsubscribers: Unsubscribe[] = [];
        let allActivities: WalletActivity[] = [];

        devices.forEach(device => {
            const activityQuery = query(collection(db, "users", user.uid, "devices", device.id, "walletActivity"));
            const unsub = onSnapshot(activityQuery, activitySnapshot => {
                const deviceActivities = activitySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    deviceId: device.id,
                    deviceName: device.name,
                } as WalletActivity));

                allActivities = [
                    ...allActivities.filter(act => act.deviceId !== device.id),
                    ...deviceActivities
                ];

                allActivities.sort((a, b) => {
                    const dateA = a.timestamp ? parseCustomTimestamp(a.timestamp)?.getTime() : 0;
                    const dateB = b.timestamp ? parseCustomTimestamp(b.timestamp)?.getTime() : 0;
                    return (dateB || 0) - (dateA || 0);
                });

                setActivities([...allActivities]);
                setLoading(false);
            });
            activityUnsubscribers.push(unsub);
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

  const filteredActivities = useMemo(() => {
    if (!date?.from) {
      return activities;
    }
    const fromDate = date.from;
    const toDate = date.to ? date.to : fromDate;

    return activities.filter(activity => {
      const activityDate = parseCustomTimestamp(activity.timestamp);
      if (!activityDate) return false;
      return activityDate >= fromDate && activityDate <= addDays(toDate, 1);
    });
  }, [activities, date]);
  
  const groupedActivities = useMemo(() => {
    return filteredActivities.reduce((acc, activity) => {
      const date = activity.timestamp ? parseCustomTimestamp(activity.timestamp) : null;
      if (date) {
        const dayKey = format(date, "yyyy-MM-dd");
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(activity);
      }
      return acc;
    }, {} as Record<string, WalletActivity[]>);
  }, [filteredActivities]);

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
    const record = spendingRecords[activity.id];

    if (!record) {
      return (
         <Badge variant="outline" className="mt-2 text-amber-600 border-amber-500 animate-pulse">
            <Edit className="h-3 w-3 mr-1" />
            Pending record...
         </Badge>
      );
    }
    
    if (record.isSpent) {
      return (
        <p className="text-sm text-muted-foreground mt-2 italic">
            &quot;Spent: {record.spentWith}&quot;
        </p>
      );
    }
    
    return (
        <p className="text-sm text-muted-foreground mt-2 italic">
            &quot;Not Spent&quot;
        </p>
    );
  };

  return (
    <Card className="h-[500px] flex flex-col">
        <CardHeader>
            <CardTitle>TimeTrace</CardTitle>
            <CardDescription>
                A timeline of your recent wallet activity. 
                Filter by date range to narrow your results.
            </CardDescription>
             <div className="flex items-center gap-2 pt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {date && <Button variant="ghost" onClick={() => setDate(undefined)}>Clear</Button>}
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 py-4">
                {loading ? renderLoadingState() : (
                    Object.keys(groupedActivities).length > 0 ? (
                      <div className="relative pl-6">
                        <div className="absolute left-[30px] top-0 h-full w-0.5 bg-gradient-to-b from-primary/50 via-primary to-primary/50 -translate-x-1/2"></div>
                          {Object.entries(groupedActivities).map(([day, dayActivities], dayIndex) => (
                            <div key={day} className="mb-8">
                              <div className="flex items-center mb-4">
                                <div className="z-10 bg-background pr-4 font-semibold text-foreground">
                                  {format(parseCustomTimestamp(dayActivities[0].timestamp)!, "MMMM d, yyyy")}
                                </div>
                                <Separator className="flex-1" />
                              </div>
                              <ul className="space-y-8">
                                {dayActivities.map((activity) => {
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
                                                    {date ? format(date, "h:mm a") : "N/A"}
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
                          ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No records found for the selected date range.
                        </div>
                    )
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
