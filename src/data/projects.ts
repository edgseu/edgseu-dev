import { loadProjects, type Project, type ProjectLifecycle, type PublicationState } from '../lib/projects';

export type { Project, ProjectLifecycle, PublicationState };

export const projects: readonly Project[] = loadProjects();
