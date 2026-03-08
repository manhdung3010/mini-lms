"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export default function ParentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: parent, isLoading } = useQuery({
    queryKey: ["parents", id],
    queryFn: async () => {
      const res = await fetch(`/api/parents/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết phụ huynh" backHref="/parents" />
        <FormSkeleton />
      </div>
    );
  }

  if (!parent) return null;

  return (
    <div className="space-y-6">
      <PageHeader title={parent.name} backHref="/parents" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{parent.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Điện thoại</p>
              <p className="font-medium">{parent.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Danh sách con ({parent.students?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!parent.students?.length ? (
              <EmptyState message="Chưa có học sinh nào" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Gói học</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parent.students.map(
                    (s: {
                      id: string;
                      name: string;
                      currentGrade: string;
                      subscriptions: { id: string }[];
                    }) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            href={`/students/${s.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {s.name}
                          </Link>
                        </TableCell>
                        <TableCell>{s.currentGrade}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {s.subscriptions?.length ?? 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
