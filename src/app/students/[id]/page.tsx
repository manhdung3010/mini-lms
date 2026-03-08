"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { GENDER_OPTIONS, DAY_OF_WEEK_OPTIONS } from "@/types";

interface RegistrationWithClass {
  id: string;
  class: {
    id: string;
    name: string;
    subject: string;
    dayOfWeek: string;
    timeSlotStart: string;
    timeSlotEnd: string;
    teacherName: string;
  };
}

interface SubscriptionInfo {
  id: string;
  packageName: string;
  endDate: string;
  usedSessions: number;
  totalSessions: number;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading } = useQuery({
    queryKey: ["students", id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chi tiết học sinh" backHref="/students" />
        <FormSkeleton />
      </div>
    );
  }

  if (!student) return null;

  const genderLabel =
    GENDER_OPTIONS.find((g) => g.value === student.gender)?.label ??
    student.gender;

  return (
    <div className="space-y-6">
      <PageHeader title={student.name} backHref="/students" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Ngày sinh"
              value={format(new Date(student.dob), "dd/MM/yyyy")}
            />
            <InfoRow label="Giới tính" value={genderLabel} />
            <InfoRow label="Khối" value={student.currentGrade} />
            <div>
              <p className="text-sm text-muted-foreground">Phụ huynh</p>
              <Link
                href={`/parents/${student.parent?.id}`}
                className="font-medium text-primary hover:underline"
              >
                {student.parent?.name}
              </Link>
              <span className="ml-2 text-sm text-muted-foreground">
                {student.parent?.phone}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Gói học ({student.subscriptions?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!student.subscriptions?.length ? (
              <EmptyState message="Chưa có gói học" />
            ) : (
              <div className="space-y-3">
                {student.subscriptions.map((sub: SubscriptionInfo) => {
                  const isExpired = new Date(sub.endDate) < new Date();
                  const remaining = sub.totalSessions - sub.usedSessions;
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className="block rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sub.packageName}</span>
                        <Badge
                          variant={isExpired ? "destructive" : "secondary"}
                        >
                          {isExpired ? "Hết hạn" : `Còn ${remaining} buổi`}
                        </Badge>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${(sub.usedSessions / sub.totalSessions) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sub.usedSessions}/{sub.totalSessions} buổi đã dùng
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Lớp đã đăng ký ({student.registrations?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!student.registrations?.length ? (
            <EmptyState message="Chưa đăng ký lớp nào" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.registrations.map((reg: RegistrationWithClass) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <Link
                        href={`/classes/${reg.class.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {reg.class.name}
                      </Link>
                    </TableCell>
                    <TableCell>{reg.class.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DAY_OF_WEEK_OPTIONS.find(
                          (d) => d.value === reg.class.dayOfWeek
                        )?.label ?? reg.class.dayOfWeek}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg.class.timeSlotStart} - {reg.class.timeSlotEnd}
                    </TableCell>
                    <TableCell>{reg.class.teacherName}</TableCell>
                    <TableCell>
                      <CancelRegistrationDialog
                        registrationId={reg.id}
                        studentName={student.name}
                        className={reg.class.name}
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
