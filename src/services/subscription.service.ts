import { prisma } from "@/lib/prisma";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import type { CreateSubscriptionInput } from "@/validations/subscription.schema";

export async function createSubscription(data: CreateSubscriptionInput) {
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
  });
  if (!student) {
    throw new NotFoundError("Học sinh");
  }

  return prisma.subscription.create({
    data: {
      studentId: data.studentId,
      packageName: data.packageName,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      totalSessions: data.totalSessions,
      usedSessions: 0,
    },
    include: { student: { select: { id: true, name: true } } },
  });
}

export async function getSubscriptions() {
  return prisma.subscription.findMany({
    include: { student: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSubscriptionById(id: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { student: { include: { parent: true } } },
  });
  if (!sub) {
    throw new NotFoundError("Gói học");
  }
  return sub;
}

export async function useSession(id: string) {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) {
    throw new NotFoundError("Gói học");
  }

  if (new Date() > sub.endDate) {
    throw new BusinessRuleError("Gói học đã hết hạn");
  }
  if (sub.usedSessions >= sub.totalSessions) {
    throw new BusinessRuleError("Đã sử dụng hết số buổi trong gói");
  }

  return prisma.subscription.update({
    where: { id },
    data: { usedSessions: { increment: 1 } },
    include: { student: { select: { id: true, name: true } } },
  });
}
