import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as registrationService from "@/services/registration.service";

export const DELETE = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const result = await registrationService.cancelRegistration(id);
    return successResponse({ data: result });
  }
);
