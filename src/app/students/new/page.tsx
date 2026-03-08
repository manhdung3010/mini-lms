"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { GENDER_OPTIONS } from "@/types";

export default function NewStudentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    currentGrade: "",
    parentId: "",
  });

  const { data: parents } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const res = await fetch("/api/parents");
      const json = await res.json();
      return json.data as { id: string; name: string }[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Lỗi");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Tạo học sinh thành công");
      router.push("/students");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Thêm học sinh" backHref="/students" />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Thông tin học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nguyễn Minh A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Ngày sinh *</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Giới tính *</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Khối lớp *</Label>
              <Input
                id="grade"
                value={form.currentGrade}
                onChange={(e) =>
                  setForm({ ...form, currentGrade: e.target.value })
                }
                placeholder="5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phụ huynh *</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) => setForm({ ...form, parentId: v ?? "" })}
                items={parents?.map((p) => ({ value: p.id, label: p.name })) ?? []}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phụ huynh" />
                </SelectTrigger>
                <SelectContent>
                  {parents?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Đang tạo..." : "Tạo học sinh"}
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
