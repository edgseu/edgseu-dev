import { loadProfile, type Profile } from '../lib/profile';

export type { Profile };

export const profile: Profile = loadProfile();
