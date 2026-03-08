import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Không tìm thấy trang</h2>
      <p className="text-muted-foreground mb-6">
        Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Button render={<Link href="/" />}>Về trang chủ</Button>
    </div>
  );
}
