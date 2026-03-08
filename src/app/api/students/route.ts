import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { createStudentSchema } from "@/validations/student.schema";
import * as studentService from "@/services/student.service";

export const GET = withErrorHandler(async () => {
  const students = await studentService.getStudents();
  return successResponse({ data: students });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await parseBody(req, createStudentSchema);
  const student = await studentService.createStudent(data);
  return successResponse({ data: student, status: 201 });
});
