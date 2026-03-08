"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_OF_WEEK_OPTIONS } from "@/types";

export default function NewClassPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    dayOfWeek: "",
    timeSlotStart: "",
    timeSlotEnd: "",
    teacherName: "",
    maxStudents: 20,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, maxStudents: Number(data.maxStudents) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Lỗi");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Tạo lớp học thành công");
      router.push("/classes");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tạo lớp mới" backHref="/classes" />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Thông tin lớp học</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Toán Nâng Cao"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Môn học *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Toán"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày trong tuần *</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => setForm({ ...form, dayOfWeek: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngày" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OF_WEEK_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Giờ bắt đầu *</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.timeSlotStart}
                  onChange={(e) =>
                    setForm({ ...form, timeSlotStart: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Giờ kết thúc *</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.timeSlotEnd}
                  onChange={(e) =>
                    setForm({ ...form, timeSlotEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Giáo viên *</Label>
              <Input
                id="teacher"
                value={form.teacherName}
                onChange={(e) =>
                  setForm({ ...form, teacherName: e.target.value })
                }
                placeholder="Thầy Nguyễn Văn B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max">Sĩ số tối đa *</Label>
              <Input
                id="max"
                type="number"
                min={1}
                max={100}
                value={form.maxStudents}
                onChange={(e) =>
                  setForm({ ...form, maxStudents: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Đang tạo..." : "Tạo lớp"}
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
