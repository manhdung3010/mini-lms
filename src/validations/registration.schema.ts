import { z } from "zod";

export const registerStudentSchema = z.object({
  studentId: z.string().min(1, "Phải chọn học sinh"),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
