import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  phone: z
    .string()
    .min(8, "Số điện thoại ít nhất 8 ký tự")
    .max(15)
    .regex(/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
