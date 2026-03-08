import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateStudentInput } from "@/validations/student.schema";

export async function createStudent(data: CreateStudentInput) {
  const parent = await prisma.parent.findUnique({
    where: { id: data.parentId },
  });
  if (!parent) {
    throw new NotFoundError("Phụ huynh");
  }

  return prisma.student.create({
    data: {
      name: data.name,
      dob: new Date(data.dob),
      gender: data.gender,
      currentGrade: data.currentGrade,
      parentId: data.parentId,
    },
    include: { parent: true },
  });
}

export async function getStudents() {
  return prisma.student.findMany({
    include: { parent: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parent: true,
      subscriptions: { orderBy: { createdAt: "desc" } },
      registrations: {
        include: { class: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!student) {
    throw new NotFoundError("Học sinh");
  }
  return student;
}
