import { NextResponse } from "next/server";

interface SuccessResponseOptions<T> {
  data: T;
  status?: number;
  meta?: Record<string, unknown>;
}

interface ErrorDetail {
  field?: string;
  message: string;
}

interface ErrorResponseOptions {
  code: string;
  message: string;
  status?: number;
  details?: ErrorDetail[];
}

export function successResponse<T>({
  data,
  status = 200,
  meta,
}: SuccessResponseOptions<T>) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function errorResponse({
  code,
  message,
  status = 400,
  details,
}: ErrorResponseOptions) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

export function validationErrorResponse(details: ErrorDetail[]) {
  return errorResponse({
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    status: 400,
    details,
  });
}

export function notFoundResponse(resource: string) {
  return errorResponse({
    code: "NOT_FOUND",
    message: `${resource} not found`,
    status: 404,
  });
}

export function conflictResponse(message: string) {
  return errorResponse({
    code: "CONFLICT",
    message,
    status: 409,
  });
}

export function businessRuleError(message: string) {
  return errorResponse({
    code: "BUSINESS_RULE_VIOLATION",
    message,
    status: 422,
  });
}

export function internalErrorResponse(message = "Internal server error") {
  return errorResponse({
    code: "INTERNAL_ERROR",
    message,
    status: 500,
  });
}
