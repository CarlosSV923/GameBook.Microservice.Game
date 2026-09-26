import { IsUUID } from 'class-validator';
import { createValidationPipe } from '../../../../src/api/http/validation-pipe.js';

class RequestDto {
  @IsUUID()
  userId!: string;
}

describe('createValidationPipe', () => {
  it('rejects invalid values with the stable validation shape', async () => {
    const pipe = createValidationPipe();

    await expect(
      pipe.transform(
        { userId: 'not-a-uuid' },
        { type: 'body', metatype: RequestDto },
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: [{ field: 'userId', reason: 'INVALID_VALUE' }],
      },
    });
  });

  it('rejects fields not declared by the DTO', async () => {
    const pipe = createValidationPipe();

    await expect(
      pipe.transform(
        { userId: '123e4567-e89b-12d3-a456-426614174000', extra: true },
        { type: 'body', metatype: RequestDto },
      ),
    ).rejects.toMatchObject({
      response: {
        code: 'VALIDATION_ERROR',
      },
    });
  });
});
