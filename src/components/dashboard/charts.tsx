"use client"

import { useMemo } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import type { WalletActivity } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

interface ActivityByHourChartProps {
  activities: WalletActivity[];
  isLoading: boolean;
}

export function ActivityByHourChart({ activities, isLoading }: ActivityByHourChartProps) {
    const data = useMemo(() => {
        const hourCounts = Array.from({ length: 24 }, (_, i) => ({
            name: i.toString(),
            opens: 0,
        }));

        activities.forEach(activity => {
            if (activity.timestamp) {
              const hour = activity.timestamp.toDate().getHours();
              hourCounts[hour].opens++;
            }
        });
        return hourCounts;
    }, [activities]);

    if (isLoading) {
        return <Skeleton className="h-[350px] w-full" />
    }
    
    return (
        <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.5)" />
                    <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            const hour = parseInt(value, 10);
                            if (hour === 0) return "12 AM";
                            if (hour === 12) return "12 PM";
                            if (hour < 12) return `${hour} AM`;
                            return `${hour - 12} PM`;
                        }}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                    />
                    <Line type="monotone" dataKey="opens" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
