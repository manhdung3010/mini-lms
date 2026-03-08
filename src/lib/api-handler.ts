import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ValidationError } from "./errors";
import {
  errorResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "./api-response";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        if (error instanceof ValidationError) {
          return validationErrorResponse(error.details);
        }
        return errorResponse({
          code: error.code,
          message: error.message,
          status: error.statusCode,
        });
      }

      console.error("Unhandled error:", error);
      return internalErrorResponse();
    }
  };
}

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new ValidationError("Validation failed", details);
  }

  return result.data;
}
