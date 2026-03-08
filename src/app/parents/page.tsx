"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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

export default function ParentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const res = await fetch("/api/parents");
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phụ huynh"
        description="Quản lý thông tin phụ huynh"
        createHref="/parents/new"
        createLabel="Thêm phụ huynh"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <EmptyState message="Chưa có phụ huynh nào. Hãy thêm phụ huynh đầu tiên." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Số con</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(
                (parent: {
                  id: string;
                  name: string;
                  email: string;
                  phone: string;
                  students: { id: string }[];
                }) => (
                  <TableRow key={parent.id}>
                    <TableCell>
                      <Link
                        href={`/parents/${parent.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {parent.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {parent.email}
                    </TableCell>
                    <TableCell>{parent.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {parent.students?.length ?? 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
