import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "@/lib/errors";

export async function registerStudent(classId: string, studentId: string) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { registrations: { select: { id: true } } },
  });
  if (!cls) throw new NotFoundError("Lớp học");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new NotFoundError("Học sinh");

  // 1) Check duplicate registration first (cheapest check)
  const existingReg = await prisma.classRegistration.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });
  if (existingReg) {
    throw new ConflictError("Học sinh đã đăng ký lớp này rồi");
  }

  // 2) Check class capacity
  if (cls.registrations.length >= cls.maxStudents) {
    throw new ConflictError("Lớp đã đầy, không thể đăng ký thêm");
  }

  // 3) Check active subscription (end_date valid AND used < total)
  const now = new Date();
  const activeSubs = await prisma.subscription.findMany({
    where: {
      studentId,
      endDate: { gte: now },
    },
    orderBy: { createdAt: "asc" },
  });
  const validSub = activeSubs.find((s) => s.usedSessions < s.totalSessions);
  if (!validSub) {
    throw new BusinessRuleError(
      "Học sinh không có gói học hợp lệ (hết hạn hoặc hết buổi)"
    );
  }

  // 4) Check schedule conflict (same day_of_week AND overlapping time_slot)
  const existingRegs = await prisma.classRegistration.findMany({
    where: { studentId },
    include: { class: true },
  });

  const conflict = existingRegs.find(
    (reg) =>
      reg.class.dayOfWeek === cls.dayOfWeek &&
      reg.class.timeSlotStart < cls.timeSlotEnd &&
      reg.class.timeSlotEnd > cls.timeSlotStart
  );
  if (conflict) {
    throw new ConflictError(
      `Trùng lịch với lớp "${conflict.class.name}" (${conflict.class.dayOfWeek} ${conflict.class.timeSlotStart}-${conflict.class.timeSlotEnd})`
    );
  }

  // All checks passed: create registration + increment used session atomically
  const [registration] = await prisma.$transaction([
    prisma.classRegistration.create({
      data: { studentId, classId },
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    }),
    prisma.subscription.update({
      where: { id: validSub.id },
      data: { usedSessions: { increment: 1 } },
    }),
  ]);

  return registration;
}

/**
 * Tính ngày giờ buổi học tiếp theo dựa trên day_of_week + time_slot.
 * Nếu hôm nay đúng ngày nhưng đã qua giờ học => tính tuần sau.
 */
function getNextOccurrence(dayOfWeek: string, timeSlotStart: string): Date {
  const dayMap: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const now = new Date();
  const targetDay = dayMap[dayOfWeek];
  const currentDay = now.getDay();

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;

  // Nếu cùng ngày, kiểm tra đã qua giờ chưa
  if (daysUntil === 0) {
    const [h, m] = timeSlotStart.split(":").map(Number);
    const classTimeToday = new Date(now);
    classTimeToday.setHours(h, m, 0, 0);
    if (now >= classTimeToday) {
      daysUntil = 7;
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysUntil);
  const [hours, minutes] = timeSlotStart.split(":").map(Number);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
}

export async function cancelRegistration(registrationId: string) {
  const reg = await prisma.classRegistration.findUnique({
    where: { id: registrationId },
    include: { class: true, student: true },
  });
  if (!reg) throw new NotFoundError("Đăng ký");

  const now = new Date();
  const nextOccurrence = getNextOccurrence(
    reg.class.dayOfWeek,
    reg.class.timeSlotStart
  );
  const hoursUntilClass =
    (nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60);
  const shouldRefund = hoursUntilClass > 24;

  if (shouldRefund) {
    // Tìm subscription gần nhất có usedSessions > 0 để hoàn buổi
    const refundableSub = await prisma.subscription.findFirst({
      where: {
        studentId: reg.studentId,
        usedSessions: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
    });

    if (refundableSub) {
      await prisma.$transaction([
        prisma.classRegistration.delete({ where: { id: registrationId } }),
        prisma.subscription.update({
          where: { id: refundableSub.id },
          data: { usedSessions: { decrement: 1 } },
        }),
      ]);
      return {
        refunded: true,
        message: `Đã hủy đăng ký lớp "${reg.class.name}" và hoàn 1 buổi vào gói "${refundableSub.packageName}"`,
      };
    }
  }

  // Hủy không hoàn buổi (< 24h hoặc không có subscription để hoàn)
  await prisma.classRegistration.delete({ where: { id: registrationId } });

  if (!shouldRefund) {
    return {
      refunded: false,
      message: `Đã hủy đăng ký lớp "${reg.class.name}" (không hoàn buổi vì hủy sát giờ < 24h)`,
    };
  }

  return {
    refunded: false,
    message: `Đã hủy đăng ký lớp "${reg.class.name}" (không tìm thấy gói học để hoàn buổi)`,
  };
}
