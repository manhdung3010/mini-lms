import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { createClassSchema } from "@/validations/class.schema";
import * as classService from "@/services/class.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const day = req.nextUrl.searchParams.get("day") ?? undefined;
  const classes = await classService.getClasses(day);
  return successResponse({ data: classes });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await parseBody(req, createClassSchema);
  const cls = await classService.createClass(data);
  return successResponse({ data: cls, status: 201 });
});
