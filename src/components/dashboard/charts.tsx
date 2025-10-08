
"use client"

import { useMemo } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import type { WalletActivity } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { format, subDays, startOfDay, subMonths, startOfMonth } from 'date-fns'
import { parseCustomTimestamp } from "@/lib/utils"

interface ActivityChartProps {
  activities: WalletActivity[];
  isLoading: boolean;
}

export function ActivityByHourChart({ activities, isLoading }: ActivityChartProps) {
    const data = useMemo(() => {
        const hourCounts = Array.from({ length: 24 }, (_, i) => ({
            name: i.toString(),
            opens: 0,
        }));

        activities.forEach(activity => {
            if (activity.timestamp) {
              const date = parseCustomTimestamp(activity.timestamp);
              if (date) {
                const hour = date.getHours();
                if (hourCounts[hour]) {
                  hourCounts[hour].opens++;
                }
              }
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
                    <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="opens" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 8, stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}


export function ActivityByDayChart({ activities, isLoading }: ActivityChartProps) {
  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      return {
        name: format(date, "EEE"),
        date: format(date, "MMM d"),
        opens: 0,
      };
    }).reverse();

    const dayNameMap = last7Days.reduce((acc, day) => {
        acc[day.date] = day;
        return acc;
    }, {} as Record<string, typeof last7Days[0]>);

    activities.forEach(activity => {
      if (activity.timestamp) {
        const activityDate = parseCustomTimestamp(activity.timestamp);
        if (activityDate) {
          const activityDateStr = format(startOfDay(activityDate), "MMM d");
          if (dayNameMap[activityDateStr]) {
              dayNameMap[activityDateStr].opens++;
          }
        }
      }
    });

    return Object.values(dayNameMap);
  }, [activities]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
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
                 formatter={(value, name, props) => [`${value} opens`, `Date: ${props.payload.date}`]}
                 labelFormatter={() => ''}
            />
            <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="opens" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-2))" }} activeDot={{ r: 8, stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityByMonthChart({ activities, isLoading }: ActivityChartProps) {
  const data = useMemo(() => {
    const last12Months = Array.from({ length: 12 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        name: format(date, "MMM"),
        date: format(date, "MMM yyyy"),
        opens: 0,
      };
    }).reverse();

    const monthNameMap = last12Months.reduce((acc, month) => {
        acc[month.date] = month;
        return acc;
    }, {} as Record<string, typeof last12Months[0]>);

    activities.forEach(activity => {
      if (activity.timestamp) {
        const activityDate = parseCustomTimestamp(activity.timestamp);
        if (activityDate) {
          const activityMonthStr = format(startOfMonth(activityDate), "MMM yyyy");
          if (monthNameMap[activityMonthStr]) {
              monthNameMap[activityMonthStr].opens++;
          }
        }
      }
    });

    return Object.values(monthNameMap);
  }, [activities]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
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
                 formatter={(value, name, props) => [`${value} opens`, `Date: ${props.payload.date}`]}
                 labelFormatter={() => ''}
            />
            <Line isAnimationActive={true} animationDuration={1200} type="monotone" dataKey="opens" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-1))" }} activeDot={{ r: 8, stroke: 'hsl(var(--background))', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityDoughnutChart({ activities, isLoading }: ActivityChartProps) {
  const data = useMemo(() => {
    const hourCounts = Array.from({ length: 24 }, (_, i) => {
      let hourLabel;
      if (i === 0) hourLabel = "12 AM";
      else if (i === 12) hourLabel = "12 PM";
      else if (i < 12) hourLabel = `${i} AM`;
      else hourLabel = `${i - 12} PM`;
      return {
        name: hourLabel,
        opens: 0,
      };
    });

    activities.forEach(activity => {
      if (activity.timestamp) {
        const date = parseCustomTimestamp(activity.timestamp);
        if (date) {
            const hour = date.getHours();
            if (hourCounts[hour]) {
                hourCounts[hour].opens++;
            }
        }
      }
    });
    
    // Filter out hours with no opens to keep the chart clean
    return hourCounts.filter(h => h.opens > 0);
  }, [activities]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (data.length === 0 && !isLoading) {
    return <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">No data to display</div>
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="hsl(var(--muted-foreground) / 0.5)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} axisLine={false} tick={false} />
          <Radar name="Opens" dataKey="opens" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} animationBegin={400} animationDuration={1500} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--secondary))' }}
            contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
