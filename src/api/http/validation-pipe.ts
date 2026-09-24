import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function toValidationDetails(
  errors: ValidationError[],
): Array<{ field: string; reason: string }> {
  return errors.flatMap((error) => {
    const ownError = error.constraints
      ? [{ field: error.property, reason: 'INVALID_VALUE' }]
      : [];
    const nestedErrors = error.children
      ? toValidationDetails(error.children)
      : [];

    return [...ownError, ...nestedErrors];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: toValidationDetails(errors),
      }),
  });
}
