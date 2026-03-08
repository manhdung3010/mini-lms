import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandler(async () => {
  const [parents, students, classes, subscriptions] = await Promise.all([
    prisma.parent.count(),
    prisma.student.count(),
    prisma.class.count(),
    prisma.subscription.count(),
  ]);

  return successResponse({
    data: { parents, students, classes, subscriptions },
  });
});
