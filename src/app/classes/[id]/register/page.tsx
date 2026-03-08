"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAY_OF_WEEK_OPTIONS } from "@/types";

interface StudentWithSub {
  id: string;
  name: string;
  currentGrade: string;
  subscriptions: {
    id: string;
    packageName: string;
    endDate: string;
    usedSessions: number;
    totalSessions: number;
  }[];
  registrations: {
    id: string;
    class: { id: string; dayOfWeek: string; timeSlotStart: string; timeSlotEnd: string; name: string };
  }[];
}

export default function RegisterStudentPage() {
  const { id: classId } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");

  const { data: students } = useQuery({
    queryKey: ["students-for-register"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      const json = await res.json();
      // Fetch full details for each student (subscriptions + registrations)
      const detailed = await Promise.all(
        (json.data as { id: string }[]).map(async (s) => {
          const r = await fetch(`/api/students/${s.id}`);
          const j = await r.json();
          return j.data as StudentWithSub;
        })
      );
      return detailed;
    },
  });

  const { data: cls } = useQuery({
    queryKey: ["classes", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}`);
      const json = await res.json();
      return json.data;
    },
  });

  // Lọc ra students chưa đăng ký lớp này
  const registeredIds = new Set(
    (cls?.registrations ?? []).map(
      (r: { student: { id: string } }) => r.student.id
    )
  );

  const availableStudents = useMemo(
    () => (students ?? []).filter((s) => !registeredIds.has(s.id)),
    [students, registeredIds]
  );

  // Thông tin subscription của student được chọn
  const selectedStudent = availableStudents.find((s) => s.id === studentId);
  const now = new Date();
  const activeSubscription = selectedStudent?.subscriptions?.find(
    (sub) =>
      new Date(sub.endDate) >= now && sub.usedSessions < sub.totalSessions
  );

  // Kiểm tra trùng lịch
  const scheduleConflict = selectedStudent?.registrations?.find(
    (reg) =>
      cls &&
      reg.class.dayOfWeek === cls.dayOfWeek &&
      reg.class.timeSlotStart < cls.timeSlotEnd &&
      reg.class.timeSlotEnd > cls.timeSlotStart
  );

  const canRegister =
    studentId && activeSubscription && !scheduleConflict;

  const mutation = useMutation({
    mutationFn: async (sid: string) => {
      const res = await fetch(`/api/classes/${classId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Lỗi");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Đăng ký thành công");
      router.push(`/classes/${classId}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    mutation.mutate(studentId);
  }

  const dayLabel = cls
    ? (DAY_OF_WEEK_OPTIONS.find((d) => d.value === cls.dayOfWeek)?.label ??
      cls.dayOfWeek)
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Đăng ký vào lớp: ${cls?.name ?? "..."}`}
        backHref={`/classes/${classId}`}
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Chọn học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Học sinh *</Label>
              <Select
                value={studentId}
                onValueChange={(v) => setStudentId(v ?? "")}
                items={availableStudents.map((s) => ({
                  value: s.id,
                  label: `${s.name} (Khối ${s.currentGrade})`,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học sinh" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (Khối {s.currentGrade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableStudents.length === 0 && students && (
                <p className="text-xs text-muted-foreground">
                  Tất cả học sinh đã đăng ký lớp này.
                </p>
              )}
            </div>

            {/* Class info */}
            {cls && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium">Thông tin lớp</p>
                <p>
                  <span className="text-muted-foreground">Lớp:</span>{" "}
                  {cls.name} &middot; {cls.subject}
                </p>
                <p>
                  <span className="text-muted-foreground">Lịch:</span>{" "}
                  {dayLabel} {cls.timeSlotStart}-{cls.timeSlotEnd}
                </p>
                <p>
                  <span className="text-muted-foreground">Sĩ số:</span>{" "}
                  {cls.registrations?.length ?? 0}/{cls.maxStudents}
                </p>
              </div>
            )}

            {/* Validation feedback khi đã chọn student */}
            {studentId && selectedStudent && (
              <div className="space-y-2">
                {/* Subscription check */}
                {activeSubscription ? (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Gói học hợp lệ
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        {activeSubscription.packageName} &middot; Còn{" "}
                        {activeSubscription.totalSessions -
                          activeSubscription.usedSessions}{" "}
                        buổi
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        Không có gói học hợp lệ
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        Học sinh cần có gói học chưa hết hạn và còn buổi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Schedule conflict check */}
                {scheduleConflict && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        Trùng lịch
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        Đã đăng ký lớp &quot;{scheduleConflict.class.name}&quot;
                        ({scheduleConflict.class.timeSlotStart}-
                        {scheduleConflict.class.timeSlotEnd}) vào cùng ngày.
                      </p>
                    </div>
                  </div>
                )}

                {!scheduleConflict && activeSubscription && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Không trùng lịch
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending || !canRegister}
              >
                {mutation.isPending ? "Đang đăng ký..." : "Xác nhận đăng ký"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
