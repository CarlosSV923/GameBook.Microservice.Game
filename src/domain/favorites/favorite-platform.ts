import { DomainValidationError } from '../shared/domain-validation-error.js';

const MAX_PLATFORM_NAME_LENGTH = 120;

export interface FavoritePlatformInput {
  readonly id: number;
  readonly name: string;
}

export interface FavoritePlatformPersistence {
  readonly id: number;
  readonly name: string;
}

export class FavoritePlatform {
  private constructor(private readonly state: FavoritePlatformPersistence) {}

  static create(input: FavoritePlatformInput): FavoritePlatform {
    if (!Number.isSafeInteger(input.id) || input.id < 1) {
      throw new DomainValidationError(
        'PLATFORM_ID_INVALID',
        'The platform ID is invalid.',
      );
    }

    const name = input.name.trim();

    if (name.length === 0 || name.length > MAX_PLATFORM_NAME_LENGTH) {
      throw new DomainValidationError(
        'PLATFORM_NAME_INVALID',
        'The platform name is invalid.',
      );
    }

    return new FavoritePlatform({ id: input.id, name });
  }

  static rehydrate(persistence: FavoritePlatformPersistence): FavoritePlatform {
    return FavoritePlatform.create(persistence);
  }

  get id(): number {
    return this.state.id;
  }

  get name(): string {
    return this.state.name;
  }

  equals(other: FavoritePlatform): boolean {
    return this.id === other.id;
  }

  toPersistence(): FavoritePlatformPersistence {
    return { ...this.state };
  }
}
