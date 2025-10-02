"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Unsubscribe, DocumentData } from "firebase/firestore";
import type { WalletActivity, Device } from "@/lib/types";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

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
                    if (a.timestamp && b.timestamp) {
                        return b.timestamp - a.timestamp;
                    }
                    return 0;
                });
                setActivities([...allActivities].slice(0, 50));
            });
            activityUnsubscribers.push(unsubscribeActivities);
        });
        
        setLoading(false);

        return () => {
            activityUnsubscribers.forEach(unsub => unsub());
        };
    });

    return () => {
        unsubscribeDevices();
    };
  }, [user]);

  const renderLoadingRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`loading-${i}`}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Device</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? renderLoadingRows() : (
                    activities.length > 0 ? activities.map((activity) => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                            {activity.timestamp ? format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a") : "Invalid Date"}
                            </TableCell>
                            <TableCell>{activity.deviceName || activity.deviceId || 'General'}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                No records found.
                            </TableCell>
                        </TableRow>
                    )
                )}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
