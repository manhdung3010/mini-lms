import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as classService from "@/services/class.service";

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const cls = await classService.getClassById(id);
    return successResponse({ data: cls });
  }
);
