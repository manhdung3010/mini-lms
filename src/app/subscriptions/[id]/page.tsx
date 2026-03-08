"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MinusCircle } from "lucide-react";

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscriptions", id],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  const useMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/${id}/use`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Lỗi");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Đã đánh dấu sử dụng 1 buổi");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết gói học" backHref="/subscriptions" />
        <FormSkeleton />
      </div>
    );
  }

  if (!sub) return null;

  const isExpired = new Date(sub.endDate) < new Date();
  const isExhausted = sub.usedSessions >= sub.totalSessions;
  const remaining = sub.totalSessions - sub.usedSessions;
  const pct = (sub.usedSessions / sub.totalSessions) * 100;
  const canUse = !isExpired && !isExhausted;

  return (
    <div className="space-y-6">
      <PageHeader title={sub.packageName} backHref="/subscriptions" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin gói</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Học sinh</p>
              <Link
                href={`/students/${sub.student?.id}`}
                className="font-medium text-primary hover:underline"
              >
                {sub.student?.name}
              </Link>
            </div>
            <InfoRow
              label="Thời hạn"
              value={`${format(new Date(sub.startDate), "dd/MM/yyyy")} - ${format(new Date(sub.endDate), "dd/MM/yyyy")}`}
            />
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              {isExpired ? (
                <Badge variant="destructive">Hết hạn</Badge>
              ) : isExhausted ? (
                <Badge variant="destructive">Hết buổi</Badge>
              ) : (
                <Badge variant="secondary">Đang hoạt động</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tiến độ sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{remaining}</span>
              <span className="text-muted-foreground">
                buổi còn lại / {sub.totalSessions} tổng
              </span>
            </div>

            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Đã sử dụng: {sub.usedSessions} buổi ({pct.toFixed(0)}%)
            </p>

            <Button
              onClick={() => useMut.mutate()}
              disabled={!canUse || useMut.isPending}
              variant="outline"
              className="w-full"
            >
              <MinusCircle className="mr-2 h-4 w-4" />
              {useMut.isPending
                ? "Đang xử lý..."
                : canUse
                  ? "Đánh dấu sử dụng 1 buổi"
                  : "Không thể sử dụng"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
