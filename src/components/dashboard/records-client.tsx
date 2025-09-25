"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import type { WalletActivity } from "@/lib/types";
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
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "users", user.uid, "walletActivity"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activitiesData: WalletActivity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp) { // Ensure record is not partial
          activitiesData.push({ id: doc.id, ...data } as WalletActivity);
        }
      });
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
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
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? renderLoadingRows() : (
                    activities.length > 0 ? activities.map((activity) => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                            {format(activity.timestamp.toDate(), "MMM d, yyyy 'at' h:mm a")}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={1} className="h-24 text-center">
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
