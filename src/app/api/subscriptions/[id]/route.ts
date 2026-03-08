import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as subscriptionService from "@/services/subscription.service";

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const sub = await subscriptionService.getSubscriptionById(id);
    return successResponse({ data: sub });
  }
);
