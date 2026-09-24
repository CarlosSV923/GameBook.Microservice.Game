import { DomainValidationError } from '../../../../src/domain/shared/domain-validation-error.js';
import { Favorite } from '../../../../src/domain/favorites/favorite.js';

const favoriteInput = {
  userId: '7b7f3d2e-6d8d-4e8c-9e0c-2a96f2fb11aa',
  igdbId: 3498,
  name: ' Example Game ',
  released: new Date('2013-09-17T00:00:00.000Z'),
  imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/example.jpg',
  rating: 94.5,
  platforms: [{ id: 6, name: ' PC ' }],
};

describe('Favorite', () => {
  it('creates a normalized favorite with the v3 snapshot fields', () => {
    const favorite = Favorite.create(favoriteInput);

    expect(favorite.userId).toBe(favoriteInput.userId);
    expect(favorite.igdbId).toBe(3498);
    expect(favorite.name).toBe('Example Game');
    expect(favorite.rating).toBe(94.5);
    expect(favorite.released).toEqual(favoriteInput.released);
    expect(favorite.platforms[0]).toMatchObject({ id: 6, name: 'PC' });
  });

  it('allows nullable snapshot fields', () => {
    const favorite = Favorite.create({
      ...favoriteInput,
      released: null,
      imageUrl: null,
      rating: null,
      platforms: [],
    });

    expect(favorite.released).toBeNull();
    expect(favorite.imageUrl).toBeNull();
    expect(favorite.rating).toBeNull();
    expect(favorite.platforms).toEqual([]);
  });

  it.each([
    ['USER_ID_INVALID', { userId: 'not-a-uuid' }],
    ['IGDB_ID_INVALID', { igdbId: 0 }],
    ['FAVORITE_NAME_INVALID', { name: ' ' }],
    ['IMAGE_URL_INVALID', { imageUrl: 'http://example.test/image.jpg' }],
    ['RATING_INVALID', { rating: 100.01 }],
  ])('rejects invalid favorite data with %s', (_code, override) => {
    expect(() => Favorite.create({ ...favoriteInput, ...override })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects duplicate platform IDs within a favorite', () => {
    expect(() =>
      Favorite.create({
        ...favoriteInput,
        platforms: [
          { id: 6, name: 'PC' },
          { id: 6, name: 'Personal Computer' },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it('updates only the supplied snapshot fields', () => {
    const favorite = Favorite.create(favoriteInput);

    favorite.updateSnapshot({ rating: null, platforms: [] });

    expect(favorite.name).toBe('Example Game');
    expect(favorite.rating).toBeNull();
    expect(favorite.platforms).toEqual([]);
  });

  it('rejects an empty snapshot update', () => {
    const favorite = Favorite.create(favoriteInput);

    expect(() => favorite.updateSnapshot({})).toThrow(DomainValidationError);
  });

  it('returns a persistence-safe copy', () => {
    const favorite = Favorite.create(favoriteInput);
    const persisted = favorite.toPersistence();

    expect(persisted).toMatchObject({
      userId: favoriteInput.userId,
      igdbId: favoriteInput.igdbId,
      name: 'Example Game',
      rating: 94.5,
    });
    expect(persisted.platforms).toEqual([{ id: 6, name: 'PC' }]);
  });
});
