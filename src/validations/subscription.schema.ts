import { z } from "zod";

export const createSubscriptionSchema = z
  .object({
    studentId: z.string().min(1, "Phải chọn học sinh"),
    packageName: z.string().min(1, "Tên gói không được để trống").max(100),
    startDate: z.string().min(1, "Ngày bắt đầu không được để trống"),
    endDate: z.string().min(1, "Ngày kết thúc không được để trống"),
    totalSessions: z
      .number({ message: "Số buổi phải là số" })
      .int()
      .min(1, "Số buổi tối thiểu là 1"),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: "Ngày kết thúc phải sau ngày bắt đầu",
      path: ["endDate"],
    }
  );

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
