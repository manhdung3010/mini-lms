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
import { GENDER_OPTIONS } from "@/types";

export default function StudentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Học sinh"
        description="Quản lý thông tin học sinh"
        createHref="/students/new"
        createLabel="Thêm học sinh"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <EmptyState message="Chưa có học sinh nào. Hãy thêm học sinh đầu tiên." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Khối</TableHead>
                <TableHead>Phụ huynh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(
                (student: {
                  id: string;
                  name: string;
                  dob: string;
                  gender: string;
                  currentGrade: string;
                  parent: { id: string; name: string };
                }) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={`/students/${student.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {student.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(student.dob), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {GENDER_OPTIONS.find(
                          (g) => g.value === student.gender
                        )?.label ?? student.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.currentGrade}</TableCell>
                    <TableCell>
                      <Link
                        href={`/parents/${student.parent?.id}`}
                        className="text-primary hover:underline"
                      >
                        {student.parent?.name}
                      </Link>
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
