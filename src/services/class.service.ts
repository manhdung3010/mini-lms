import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateClassInput } from "@/validations/class.schema";
import type { DayOfWeek } from "@/generated/prisma/client";

export async function createClass(data: CreateClassInput) {
  return prisma.class.create({ data });
}

export async function getClasses(day?: string) {
  const where = day
    ? { dayOfWeek: day as DayOfWeek }
    : undefined;

  return prisma.class.findMany({
    where,
    include: {
      registrations: { select: { id: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlotStart: "asc" }],
  });
}

export async function getClassById(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          student: {
            include: { parent: { select: { name: true, phone: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!cls) {
    throw new NotFoundError("Lớp học");
  }
  return cls;
}
