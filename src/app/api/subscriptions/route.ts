import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { createSubscriptionSchema } from "@/validations/subscription.schema";
import * as subscriptionService from "@/services/subscription.service";

export const GET = withErrorHandler(async () => {
  const subs = await subscriptionService.getSubscriptions();
  return successResponse({ data: subs });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await parseBody(req, createSubscriptionSchema);
  const sub = await subscriptionService.createSubscription(data);
  return successResponse({ data: sub, status: 201 });
});
