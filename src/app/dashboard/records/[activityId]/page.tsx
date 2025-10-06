
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { WalletActivity, SpendingRecord } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { parseCustomTimestamp } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export default function ActivityDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const activityId = params.activityId as string;
  const deviceId = searchParams.get("deviceId");

  const [activity, setActivity] = useState<WalletActivity | null>(null);
  const [spendingRecord, setSpendingRecord] = useState<SpendingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [spendingOption, setSpendingOption] = useState<"spent" | "not-spent">("not-spent");
  const [spentWith, setSpentWith] = useState("");

  useEffect(() => {
    if (!user || !activityId || !deviceId) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Wallet Activity
        const activityDocRef = doc(db, "users", user!.uid, "devices", deviceId!, "walletActivity", activityId);
        const activityDocSnap = await getDoc(activityDocRef);

        if (activityDocSnap.exists()) {
          setActivity({ id: activityDocSnap.id, ...activityDocSnap.data() } as WalletActivity);
        } else {
          toast({ title: "Error", description: "Activity not found.", variant: "destructive" });
        }

        // Fetch or initialize Spending Record
        const spendingQuery = query(collection(db, "users", user.uid, "spendingRecords"), where("activityId", "==", activityId));
        const spendingSnapshot = await getDocs(spendingQuery);
        
        if (!spendingSnapshot.empty) {
          const record = { id: spendingSnapshot.docs[0].id, ...spendingSnapshot.docs[0].data() } as SpendingRecord;
          setSpendingRecord(record);
          setSpendingOption(record.isSpent ? "spent" : "not-spent");
          if (record.spentWith) {
            setSpentWith(record.spentWith);
          }
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error", description: "Could not fetch activity details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, activityId, deviceId, toast]);
  
  const handleSave = async () => {
    if (!user) return;
    
    const isSpent = spendingOption === 'spent';
    if (isSpent && !spentWith.trim()) {
        toast({
            title: "Validation Error",
            description: "'Spent With' details are required when you select 'Spent'",
            variant: "destructive",
        });
        return;
    }

    try {
      const recordToSave = {
        userId: user.uid,
        activityId,
        isSpent: spendingOption === 'spent',
        spentWith: spendingOption === 'spent' ? spentWith : '',
        createdAt: spendingRecord?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = spendingRecord 
        ? doc(db, "users", user.uid, "spendingRecords", spendingRecord.id)
        : doc(collection(db, "users", user.uid, "spendingRecords"));

      await setDoc(docRef, recordToSave, { merge: true });

      toast({
        title: "Success",
        description: "Your spending record has been saved.",
      });
      router.push("/dashboard/records");

    } catch (error) {
      console.error("Error saving record:", error);
      toast({
        title: "Error",
        description: "Could not save spending record.",
        variant: "destructive",
      });
    }
  };
  
  const activityDate = activity?.timestamp ? parseCustomTimestamp(activity.timestamp) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Activity not found.</p>
        <Button asChild variant="link">
            <Link href="/dashboard/records">Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Records
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Spending Details</CardTitle>
          <CardDescription>
            Log the details for your wallet activity on {activityDate ? format(activityDate, "MMM d, yyyy") : 'N/A'}
          </CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{activityDate ? format(activityDate, "eeee, MMMM d") : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{activityDate ? format(activityDate, "h:mm a") : 'N/A'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={spendingOption}
            onValueChange={(value) => setSpendingOption(value as "spent" | "not-spent")}
            className="flex gap-8"
            >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spent" id="spent" />
              <Label htmlFor="spent" className="text-base font-medium">I Spent Money</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not-spent" id="not-spent" />
              <Label htmlFor="not-spent" className="text-base font-medium">I Didn't Spend</Label>
            </div>
          </RadioGroup>

          {spendingOption === "spent" && (
            <div className="space-y-2 animate-in fade-in-0 duration-500">
              <Label htmlFor="spent-with">Where did you spend it?</Label>
              <Textarea
                id="spent-with"
                placeholder="e.g., Coffee at Starbucks, Groceries, etc."
                value={spentWith}
                onChange={(e) => setSpentWith(e.target.value)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave}>Save Record</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
