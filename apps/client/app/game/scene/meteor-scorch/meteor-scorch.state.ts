import type { Mark } from './meteor-scorch';

export const pending: Omit< Mark, 'born' | 'live' >[] = [];
