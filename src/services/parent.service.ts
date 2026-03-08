import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { CreateParentInput } from "@/validations/parent.schema";

export async function createParent(data: CreateParentInput) {
  const existing = await prisma.parent.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new ConflictError(`Email "${data.email}" đã được sử dụng`);
  }

  return prisma.parent.create({ data });
}

export async function getParents() {
  return prisma.parent.findMany({
    include: { students: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getParentById(id: string) {
  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          subscriptions: true,
          registrations: { include: { class: true } },
        },
      },
    },
  });
  if (!parent) {
    throw new NotFoundError("Phụ huynh");
  }
  return parent;
}
