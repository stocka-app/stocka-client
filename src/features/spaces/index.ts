// Public barrel — only import from here in other features/router
export { default as SpacesPage } from './pages/SpacesPage';
export { useSpaces } from './hooks/useSpaces';
export type { Space, SpaceType, SpaceStatus } from './types/spaces.types';
export { SPACE_TIER_LIMITS } from './types/spaces.types';
