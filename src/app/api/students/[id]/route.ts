import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import * as studentService from "@/services/student.service";

export const GET = withErrorHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = await params;
    const student = await studentService.getStudentById(id);
    return successResponse({ data: student });
  }
);
