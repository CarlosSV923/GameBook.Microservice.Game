export class FavoriteAlreadyExistsError extends Error {
  constructor() {
    super('The favorite already exists.');
    this.name = 'FavoriteAlreadyExistsError';
  }
}

export class FavoriteNotFoundError extends Error {
  constructor() {
    super('The favorite was not found.');
    this.name = 'FavoriteNotFoundError';
  }
}
