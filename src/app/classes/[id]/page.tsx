"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CancelRegistrationDialog } from "@/components/shared/cancel-registration-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { DAY_OF_WEEK_OPTIONS } from "@/types";

interface Registration {
  id: string;
  registeredAt: string;
  student: {
    id: string;
    name: string;
    parent: { name: string; phone: string };
  };
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: cls, isLoading } = useQuery({
    queryKey: ["classes", id],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết lớp học" backHref="/classes" />
        <FormSkeleton />
      </div>
    );
  }

  if (!cls) return null;

  const enrolled = cls.registrations?.length ?? 0;
  const isFull = enrolled >= cls.maxStudents;
  const dayLabel =
    DAY_OF_WEEK_OPTIONS.find((d) => d.value === cls.dayOfWeek)?.label ??
    cls.dayOfWeek;

  return (
    <div className="space-y-6">
      <PageHeader title={cls.name} backHref="/classes" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin lớp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Môn học" value={cls.subject} />
            <InfoRow label="Ngày" value={dayLabel} />
            <InfoRow
              label="Khung giờ"
              value={`${cls.timeSlotStart} - ${cls.timeSlotEnd}`}
            />
            <InfoRow label="Giáo viên" value={cls.teacherName} />
            <div>
              <p className="text-sm text-muted-foreground">Sĩ số</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {enrolled}/{cls.maxStudents}
                </span>
                <Badge variant={isFull ? "destructive" : "secondary"}>
                  {isFull ? "Đầy" : "Còn chỗ"}
                </Badge>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(enrolled / cls.maxStudents) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Học sinh đã đăng ký ({enrolled})
            </CardTitle>
            {!isFull && (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`/classes/${id}/register`} />}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Đăng ký
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!cls.registrations?.length ? (
              <EmptyState message="Chưa có học sinh đăng ký" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Phụ huynh</TableHead>
                    <TableHead>SĐT PH</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cls.registrations.map((reg: Registration) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Link
                          href={`/students/${reg.student.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {reg.student.name}
                        </Link>
                      </TableCell>
                      <TableCell>{reg.student.parent?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {reg.student.parent?.phone}
                      </TableCell>
                      <TableCell>
                        <CancelRegistrationDialog
                          registrationId={reg.id}
                          studentName={reg.student.name}
                          className={cls.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
