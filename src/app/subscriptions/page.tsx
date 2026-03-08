"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gói học"
        description="Quản lý subscription học sinh"
        createHref="/subscriptions/new"
        createLabel="Tạo gói mới"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <EmptyState message="Chưa có gói học nào." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên gói</TableHead>
                <TableHead>Học sinh</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Tiến độ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(
                (sub: {
                  id: string;
                  packageName: string;
                  startDate: string;
                  endDate: string;
                  totalSessions: number;
                  usedSessions: number;
                  student: { id: string; name: string };
                }) => {
                  const isExpired = new Date(sub.endDate) < new Date();
                  const isExhausted = sub.usedSessions >= sub.totalSessions;
                  const remaining = sub.totalSessions - sub.usedSessions;
                  const pct = (sub.usedSessions / sub.totalSessions) * 100;

                  let status: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } = {
                    label: `Còn ${remaining} buổi`,
                    variant: "secondary",
                  };
                  if (isExpired)
                    status = { label: "Hết hạn", variant: "destructive" };
                  else if (isExhausted)
                    status = { label: "Hết buổi", variant: "destructive" };

                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Link
                          href={`/subscriptions/${sub.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {sub.packageName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/students/${sub.student?.id}`}
                          className="text-primary hover:underline"
                        >
                          {sub.student?.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(sub.startDate), "dd/MM/yy")} -{" "}
                        {format(new Date(sub.endDate), "dd/MM/yy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {sub.usedSessions}/{sub.totalSessions}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                }
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
