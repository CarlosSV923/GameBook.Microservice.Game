import { DomainValidationError } from '../../../../src/domain/shared/domain-validation-error.js';
import { FavoritePlatform } from '../../../../src/domain/favorites/favorite-platform.js';

describe('FavoritePlatform', () => {
  it('trims the platform name and preserves the IGDB ID', () => {
    const platform = FavoritePlatform.create({ id: 6, name: ' PC ' });

    expect(platform.id).toBe(6);
    expect(platform.name).toBe('PC');
  });

  it.each([
    { id: 0, name: 'PC' },
    { id: 1.5, name: 'PC' },
    { id: 6, name: ' ' },
  ])('rejects invalid platform data: %j', (input) => {
    expect(() => FavoritePlatform.create(input)).toThrow(DomainValidationError);
  });

  it('compares platforms by their IGDB ID', () => {
    const pc = FavoritePlatform.create({ id: 6, name: 'PC' });
    const renamedPc = FavoritePlatform.create({
      id: 6,
      name: 'Personal Computer',
    });

    expect(pc.equals(renamedPc)).toBe(true);
  });
});
