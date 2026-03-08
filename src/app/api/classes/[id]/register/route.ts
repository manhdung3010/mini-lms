import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";
import { registerStudentSchema } from "@/validations/registration.schema";
import * as registrationService from "@/services/registration.service";

export const POST = withErrorHandler(
  async (req: NextRequest, { params }) => {
    const { id: classId } = await params;
    const { studentId } = await parseBody(req, registerStudentSchema);
    const registration = await registrationService.registerStudent(
      classId,
      studentId
    );
    return successResponse({ data: registration, status: 201 });
  }
);
