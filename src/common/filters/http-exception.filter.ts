import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    // Log the actual error for debugging
    if (!(exception instanceof HttpException)) {
      console.error("Unhandled exception:", exception);
      if (exception instanceof Error) {
        console.error("Error stack:", exception.stack);
        console.error("Error message:", exception.message);
      }
    }

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof message === "string") {
      errorResponse.message = message;
    } else if (message && typeof message === "object") {
      // Handle validation errors and other structured error responses
      const msgObj = message as Record<string, unknown>;
      errorResponse.message = msgObj.message || message;
      if (msgObj.error) {
        errorResponse.error = msgObj.error;
      }
      // Include validation error details if present
      if (Array.isArray(msgObj.message)) {
        errorResponse.message = msgObj.message;
      }
      // Include extra fields (e.g. leadId for duplicate lead)
      if (msgObj.leadId !== undefined) {
        errorResponse.leadId = msgObj.leadId;
      }
    } else {
      errorResponse.message = "Internal server error";
    }

    // Include error details in development mode
    if (
      process.env.NODE_ENV !== "production" &&
      !(exception instanceof HttpException)
    ) {
      if (exception instanceof Error) {
        errorResponse.error = exception.message;
      }
    }

    response.status(status).json(errorResponse);
  }
}
