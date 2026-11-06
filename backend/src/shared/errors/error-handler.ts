import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.') || 'input'}: ${firstIssue.message}`
      : 'Validation failed';

    reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message,
    });
    return;
  }

  const fastifyErr = error as FastifyError;

  if (fastifyErr.statusCode === 429) {
    reply.status(429).send({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    });
    return;
  }

  if (fastifyErr.validation) {
    reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
    });
    return;
  }

  request.log.error(
    {
      err: error,
      requestId: request.id,
      url: request.url,
      method: request.method,
    },
    'Unhandled error occurred',
  );

  reply.status(500).send({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
