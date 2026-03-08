"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface CancelRegistrationDialogProps {
  registrationId: string;
  studentName: string;
  className: string;
  onSuccess?: () => void;
}

export function CancelRegistrationDialog({
  registrationId,
  studentName,
  className,
  onSuccess,
}: CancelRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/registrations/${registrationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Lỗi");
      return json.data as { refunded: boolean; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(data.message);
      setOpen(false);
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận hủy đăng ký</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn hủy đăng ký của{" "}
            <strong>{studentName}</strong> khỏi lớp{" "}
            <strong>{className}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <p className="font-medium">Quy định hoàn buổi:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            <li>Hủy trước giờ học &gt; 24h: hoàn 1 buổi vào gói học</li>
            <li>Hủy sát giờ (&lt; 24h): không hoàn buổi</li>
          </ul>
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline">Không, giữ lại</Button>}
          />
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
