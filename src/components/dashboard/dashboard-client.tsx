"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { WalletActivity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityByHourChart, ActivityByDayChart, ActivityByMonthChart } from "./charts";
import { AiAdvice } from "./ai-advice";

function StatCard({ title, value, icon: Icon, isLoading }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean; }) {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "users", user.uid, "walletActivity"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activitiesData: WalletActivity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp) { // Ensure record is not partial
          activitiesData.push({ id: doc.id, ...doc.data() } as WalletActivity);
        }
      });
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalOpens = activities.length;

  const handleOpenWallet = async () => {
    if (!user) return;
    try {
      await addDoc(
        collection(db, "users", user.uid, "walletActivity"),
        {
          timestamp: serverTimestamp(),
          userId: user.uid,
        }
      );
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleOpenWallet}>
            <PlusCircle className="mr-2 h-4 w-4" /> Open Wallet
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Wallet Opens" value={totalOpens} icon={ShoppingCart} isLoading={loading} />
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
            <ActivityByHourChart activities={activities} isLoading={loading}/>
          </CardContent>
        </Card>
        <div className="col-span-4 md:col-span-3">
             <AiAdvice walletOpens={totalOpens} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
         <Card>
          <CardHeader>
            <CardTitle>Daily Wallet Opens (Last 7 Days)</CardTitle>
            <CardDescription>
              A look at your wallet opening frequency over the past week.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ActivityByDayChart activities={activities} isLoading={loading}/>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
         <Card>
          <CardHeader>
            <CardTitle>Monthly Wallet Opens (Last 12 Months)</CardTitle>
            <CardDescription>
              A look at your wallet opening frequency over the past year.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ActivityByMonthChart activities={activities} isLoading={loading}/>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
