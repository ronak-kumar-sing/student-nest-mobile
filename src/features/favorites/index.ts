/**
 * Public entry point for the Favorites feature.
 *
 * Rules:
 * Other features (such as properties) may import ONLY from this public index,
 * never from internal modules of features/favorites.
 */

export * from './types';
export * from './mappers';
export * from './api';
export * from './queries';
export * from './screens/saved-screen';
