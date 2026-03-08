import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as parentService from "@/services/parent.service";

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const parent = await parentService.getParentById(id);
    return successResponse({ data: parent });
  }
);
