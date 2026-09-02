import { loadBio, loadProfile, type Bio, type Profile } from '../lib/profile';

export type { Bio, Profile };

export const profile: Profile = loadProfile();
export const bio: Bio = loadBio();
