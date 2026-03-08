import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as subscriptionService from "@/services/subscription.service";

export const PATCH = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const sub = await subscriptionService.useSession(id);
    return successResponse({ data: sub });
  }
);
