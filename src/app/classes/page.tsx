"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DAY_OF_WEEK_OPTIONS } from "@/types";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  teacherName: string;
  maxStudents: number;
  registrations: { id: string }[];
}

export default function ClassesPage() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      const json = await res.json();
      return json.data as ClassItem[];
    },
  });

  const grouped = DAY_OF_WEEK_OPTIONS.map((day) => ({
    ...day,
    classes: (classes ?? []).filter((c) => c.dayOfWeek === day.value),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lớp học"
        description="Lịch học theo tuần"
        createHref="/classes/new"
        createLabel="Tạo lớp mới"
      />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {grouped.map((day) => (
            <div key={day.value} className="space-y-2 flex flex-col">
              <h3 className="text-center text-sm font-semibold text-muted-foreground">
                {day.label}
              </h3>
              {day.classes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Trống
                </div>
              ) : (
                day.classes.map((cls) => {
                  const enrolled = cls.registrations?.length ?? 0;
                  const isFull = enrolled >= cls.maxStudents;
                  return (
                    <Link key={cls.id} href={`/classes/${cls.id}`}>
                      <Card
                        className={cn(
                          "p-3 hover:shadow-md transition-shadow cursor-pointer",
                          isFull && "border-destructive/50 bg-destructive/5"
                        )}
                      >
                        <p className="font-semibold text-sm leading-tight">
                          {cls.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cls.subject}
                        </p>
                        <p className="text-xs font-mono mt-1">
                          {cls.timeSlotStart} - {cls.timeSlotEnd}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cls.teacherName}
                        </p>
                        <Badge
                          variant={isFull ? "destructive" : "secondary"}
                          className="mt-2 text-[10px]"
                        >
                          {enrolled}/{cls.maxStudents}
                          {isFull ? " (Đầy)" : ""}
                        </Badge>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
