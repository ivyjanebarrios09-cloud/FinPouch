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
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import type { WalletActivity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingCart, Frown, Smile } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityByDayChart, SpentNotSpentChart } from "./charts";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        activitiesData.push({ id: doc.id, ...doc.data() } as WalletActivity);
      });
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totalOpens = activities.length;
    const spentCount = activities.filter((a) => a.didSpend === true).length;
    const notSpentCount = activities.filter((a) => a.didSpend === false).length;
    return { totalOpens, spentCount, notSpentCount };
  }, [activities]);

  const handleOpenWallet = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, "walletActivity"),
        {
          timestamp: serverTimestamp(),
          didSpend: null,
          userId: user.uid,
        }
      );
      setCurrentActivityId(docRef.id);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleTagActivity = async (didSpend: boolean) => {
    if (!user || !currentActivityId) return;
    setIsSubmitting(true);
    try {
      const activityDocRef = doc(db, "users", user.uid, "walletActivity", currentActivityId);
      await updateDoc(activityDocRef, {
        didSpend,
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      setCurrentActivityId(null);
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
        <StatCard title="Total Wallet Opens" value={stats.totalOpens} icon={ShoppingCart} isLoading={loading} />
        <StatCard title="Times Spent" value={stats.spentCount} icon={Smile} isLoading={loading} />
        <StatCard title="Times Not Spent" value={stats.notSpentCount} icon={Frown} isLoading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Spending by Day</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ActivityByDayChart activities={activities} isLoading={loading}/>
          </CardContent>
        </Card>
        <Card className="col-span-4 md:col-span-3">
          <CardHeader>
            <CardTitle>Spent vs. Not Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <SpentNotSpentChart stats={stats} isLoading={loading} />
          </CardContent>
        </Card>
      </div>
      <AiAdvice walletOpens={stats.totalOpens} spentCount={stats.spentCount} notSpentCount={stats.notSpentCount} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What happened?</DialogTitle>
            <DialogDescription>
              You've opened your wallet. Did you make a purchase?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleTagActivity(false)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Didn't Spend"}
            </Button>
            <Button onClick={() => handleTagActivity(true)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "I Spent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
