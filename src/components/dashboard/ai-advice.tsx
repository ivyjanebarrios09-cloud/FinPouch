"use client";

import { useEffect, useState } from "react";
import { generateSpendingAdvice } from "@/ai/flows/generate-spending-advice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Lightbulb } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface AiAdviceProps {
  walletOpens: number;
  spentCount: number;
  notSpentCount: number;
}

export function AiAdvice({ walletOpens, spentCount, notSpentCount }: AiAdviceProps) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getAdvice() {
      if (walletOpens === 0) {
        setAdvice("Start by recording your first wallet open to get personalized advice!");
        return;
      }
      setLoading(true);
      try {
        const result = await generateSpendingAdvice({
          walletOpens,
          spentCount,
          notSpentCount,
        });
        setAdvice(result.advice);
      } catch (error) {
        console.error("Failed to generate AI advice:", error);
        setAdvice("Could not load advice at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    getAdvice();
  }, [walletOpens, spentCount, notSpentCount]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex-1">
            <CardTitle>AI-Powered Insight</CardTitle>
            <CardDescription>
                Personalized advice based on your recent activity.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{advice}</p>
        )}
      </CardContent>
    </Card>
  );
}
