/**
 * The dev menu (/dev: transport switches, mock error injection) is for development builds only
 * (AGENTS.md §8). Preview and production builds, and the hosted web export, never show it.
 */
export const SHOW_DEV_MENU: boolean = __DEV__;
