"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATS_CONFIG = [
  {
    key: "parents" as const,
    title: "Phụ huynh",
    icon: Users,
    href: "/parents",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "students" as const,
    title: "Học sinh",
    icon: GraduationCap,
    href: "/students",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "classes" as const,
    title: "Lớp học",
    icon: CalendarDays,
    href: "/classes",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    key: "subscriptions" as const,
    title: "Gói học",
    icon: CreditCard,
    href: "/subscriptions",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      const json = await res.json();
      return json.data as Record<string, number>;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản lý học tập
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS_CONFIG.map((stat) => (
          <Link key={stat.key} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stats?.[stat.key] ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
