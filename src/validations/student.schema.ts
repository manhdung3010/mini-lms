import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  dob: z.string().min(1, "Ngày sinh không được để trống"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Giới tính không hợp lệ",
  }),
  currentGrade: z.string().min(1, "Lớp không được để trống").max(20),
  parentId: z.string().min(1, "Phải chọn phụ huynh"),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
