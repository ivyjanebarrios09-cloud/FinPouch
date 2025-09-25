"use client"

import { useMemo } from "react"
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts"
import type { WalletActivity } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

interface SpentNotSpentChartProps {
  stats: {
    spentCount: number;
    notSpentCount: number;
  };
  isLoading: boolean;
}

export function SpentNotSpentChart({ stats, isLoading }: SpentNotSpentChartProps) {
  const data = [
    { name: "Spent", value: stats.spentCount },
    { name: "Not Spent", value: stats.notSpentCount },
  ]
  
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (stats.spentCount === 0 && stats.notSpentCount === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No activity recorded yet.
      </div>
    )
  }

  return (
    <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            </Pie>
            <Tooltip
                contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                }}
            />
            <Legend />
        </PieChart>
        </ResponsiveContainer>
    </div>
  )
}

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
                <BarChart data={data}>
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
                    <Bar dataKey="opens" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
