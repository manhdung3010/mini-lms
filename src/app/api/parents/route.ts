import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { createParentSchema } from "@/validations/parent.schema";
import * as parentService from "@/services/parent.service";

export const GET = withErrorHandler(async () => {
  const parents = await parentService.getParents();
  return successResponse({ data: parents });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await parseBody(req, createParentSchema);
  const parent = await parentService.createParent(data);
  return successResponse({ data: parent, status: 201 });
});
