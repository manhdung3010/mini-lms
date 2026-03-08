"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive/50 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "Có lỗi xảy ra khi tải trang. Vui lòng thử lại."}
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
