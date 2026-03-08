import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createClassSchema = z
  .object({
    name: z.string().min(1, "Tên lớp không được để trống").max(100),
    subject: z.string().min(1, "Môn học không được để trống").max(50),
    dayOfWeek: z.enum(
      [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      { message: "Ngày trong tuần không hợp lệ" }
    ),
    timeSlotStart: z
      .string()
      .regex(TIME_REGEX, "Giờ bắt đầu phải theo định dạng HH:mm"),
    timeSlotEnd: z
      .string()
      .regex(TIME_REGEX, "Giờ kết thúc phải theo định dạng HH:mm"),
    teacherName: z.string().min(1, "Tên giáo viên không được để trống").max(100),
    maxStudents: z
      .number({ message: "Sĩ số phải là số" })
      .int()
      .min(1, "Sĩ số tối thiểu là 1")
      .max(100, "Sĩ số tối đa là 100"),
  })
  .refine((data) => data.timeSlotStart < data.timeSlotEnd, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["timeSlotEnd"],
  });

export type CreateClassInput = z.infer<typeof createClassSchema>;
