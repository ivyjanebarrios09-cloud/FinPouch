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

interface ActivityByDayChartProps {
  activities: WalletActivity[];
  isLoading: boolean;
}

export function ActivityByDayChart({ activities, isLoading }: ActivityByDayChartProps) {
    const data = useMemo(() => {
        const dayCounts = [
            { name: "Sun", opens: 0 },
            { name: "Mon", opens: 0 },
            { name: "Tue", opens: 0 },
            { name: "Wed", opens: 0 },
            { name: "Thu", opens: 0 },
            { name: "Fri", opens: 0 },
            { name: "Sat", opens: 0 },
        ];
        activities.forEach(activity => {
            const dayIndex = activity.timestamp.toDate().getDay();
            dayCounts[dayIndex].opens++;
        });
        return dayCounts;
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
