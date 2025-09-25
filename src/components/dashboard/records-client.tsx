"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

export function RecordsClient() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "spent" | "not-spent">("all");

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

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    if (filter === "spent") return activities.filter((a) => a.didSpend === true);
    if (filter === "not-spent") return activities.filter((a) => a.didSpend === false);
    return [];
  }, [activities, filter]);
  
  const renderLoadingRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`loading-${i}`}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
      <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="spent">Spent</TabsTrigger>
        <TabsTrigger value="not-spent">Not Spent</TabsTrigger>
      </TabsList>
      <TabsContent value={filter}>
        <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? renderLoadingRows() : (
                        filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">
                                {format(activity.timestamp.toDate(), "MMM d, yyyy 'at' h:mm a")}
                                </TableCell>
                                <TableCell>
                                {activity.didSpend === true && <Badge variant="default">Spent</Badge>}
                                {activity.didSpend === false && <Badge variant="secondary">Not Spent</Badge>}
                                {activity.didSpend === null && <Badge variant="outline">Pending</Badge>}
                                </TableCell>
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
      </TabsContent>
    </Tabs>
  );
}
