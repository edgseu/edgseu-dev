import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

function isAbsoluteHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const requiredText = z.string().trim().min(1, 'must not be empty');
const httpsUrl = requiredText.refine(isAbsoluteHttpsUrl, 'must be an absolute HTTPS URL');
const uniqueList = z.array(requiredText).min(1, 'must contain at least one value').superRefine((values, context) => {
  const normalized = values.map((value) => value.toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    context.addIssue({ code: 'custom', message: 'must contain unique values' });
  }
});

export const profileSchema = z.object({
  name: requiredText,
  username: requiredText,
  role: requiredText,
  location: requiredText,
  email: z.email('must be a valid email address'),
  github: httpsUrl,
  linkedin: httpsUrl,
  avatar: requiredText.refine(
    (value) => value.startsWith('/') && !value.startsWith('//'),
    'must be a root-relative path',
  ),
  promptHost: requiredText,
  host: requiredText,
  resumeUrl: z.custom<string | null>(
    (value) => value === null || isAbsoluteHttpsUrl(value),
    'must be null or an absolute HTTPS URL',
  ),
  available: z.boolean().optional(),
  focusAreas: uniqueList,
  shortSkills: uniqueList,
  skills: uniqueList,
}).strict();

export type Profile = z.infer<typeof profileSchema>;

export interface ProfileValidation {
  profile?: Profile | undefined;
  errors: string[];
}

export interface BioValidation {
  narrative?: string | undefined;
  errors: string[];
}

export function validateProfileFile(
  file = process.env.METADATA_FILE ?? process.env.PROFILE_FILE ?? 'src/content/metadata.yaml',
): ProfileValidation {
  const profileFile = resolve(file);
  let source: string;
  try {
    source = readFileSync(profileFile, 'utf8');
  } catch (error) {
    return {
      errors: [`could not read Profile source: ${error instanceof Error ? error.message : 'unknown error'}`],
    };
  }

  let data: unknown;
  try {
    const wrapped = source.startsWith('---') ? source : `---\n${source}\n---`;
    data = matter(wrapped).data;
  } catch (error) {
    return {
      errors: [`invalid Profile YAML: ${error instanceof Error ? error.message : 'parse error'}`],
    };
  }

  const result = profileSchema.safeParse(data);
  return {
    profile: result.success ? result.data : undefined,
    errors: result.success
      ? []
      : result.error.issues.map((issue) => `${issue.path.join('.') || 'metadata'}: ${issue.message}`),
  };
}

export function loadProfile(file?: string): Profile {
  const result = validateProfileFile(file);
  if (!result.profile || result.errors.length > 0) {
    throw new Error(`Invalid Profile content:\n${result.errors.map((error) => `- ${error}`).join('\n')}`);
  }
  return result.profile;
}

export function validateBioFile(file = process.env.BIO_FILE ?? 'src/content/bio.md'): BioValidation {
  const bioFile = resolve(file);
  let source: string;
  try {
    source = readFileSync(bioFile, 'utf8');
  } catch (error) {
    return {
      errors: [`could not read Bio source: ${error instanceof Error ? error.message : 'unknown error'}`],
    };
  }

  const narrative = source.trim();
  if (!narrative) {
    return {
      errors: ['Bio narrative must not be empty'],
    };
  }

  return {
    narrative,
    errors: [],
  };
}
