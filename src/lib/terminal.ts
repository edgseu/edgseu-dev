import type { Profile } from './profile';

export type TerminalCommandResultType = 'text' | 'html' | 'clear' | 'action';

export interface TerminalCommandDefinition {
  name: string;
  description: string;
  resultType: TerminalCommandResultType;
  showAsChip: boolean;
}

export const TERMINAL_COMMANDS = [
  {
    name: 'help',
    description: 'List the available terminal commands',
    resultType: 'text',
    showAsChip: false,
  },
  {
    name: 'whoami',
    description: 'Show profile and site statistics',
    resultType: 'html',
    showAsChip: true,
  },
  {
    name: 'skills',
    description: 'Show the detailed skills grid',
    resultType: 'text',
    showAsChip: true,
  },
  {
    name: 'contact',
    description: 'Show contact destinations',
    resultType: 'html',
    showAsChip: true,
  },
  {
    name: 'theme',
    description: 'Switch the site color theme',
    resultType: 'action',
    showAsChip: true,
  },
  {
    name: 'clear',
    description: 'Clear terminal output',
    resultType: 'clear',
    showAsChip: true,
  },
] as const satisfies readonly TerminalCommandDefinition[];

export type TerminalCommand = (typeof TERMINAL_COMMANDS)[number]['name'];
export const TERMINAL_COMMAND_NAMES = TERMINAL_COMMANDS.map((command) => command.name);
const TERMINAL_HELP = `Available commands: ${TERMINAL_COMMAND_NAMES.join(', ')}`;

export interface TerminalProfile {
  name: string;
  username: string;
  role: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  promptHost: string;
  host: string;
  shortSkills: string[];
  skills: string[];
}

export interface TerminalContext {
  profile: TerminalProfile | Profile;
  projectCount: number;
  articleCount: number;
  buildTime: number;
  currentTime?: number;
}

export interface TerminalCommandResult {
  isValid: boolean;
  type: TerminalCommandResultType;
  output?: string;
  action?: 'theme';
}
export interface TerminalExecutionResult {
  commandLine: { html: string; isValid: boolean };
  response?: {
    html: string;
    isHtml: boolean;
    isMultiLine: boolean;
    action?: 'theme' | undefined;
  } | undefined;
  clear?: boolean | undefined;
}

export class TerminalSession {
  private readonly history: TerminalHistory;
  private readonly context: TerminalContext;

  constructor(context: TerminalContext, historyLimit = 20) {
    this.context = context;
    this.history = new TerminalHistory(historyLimit);
  }

  renderPrompt(commandText: string, isValid = true): string {
    const { username, promptHost } = this.context.profile;
    return `<span class="prompt" aria-hidden="true"><span class="prompt-user">${escapeHtml(username)}</span><span class="prompt-at">@</span><span class="prompt-host">${escapeHtml(promptHost)}</span><span class="prompt-colon">:</span><span class="prompt-path">~</span><span class="prompt-dollar">$</span></span> <span class="${isValid ? 'cmd-valid' : 'cmd-invalid'}">${escapeHtml(commandText)}</span>`;
  }

  getInitialWhoami(): string {
    return formatWhoamiHtml(this.context);
  }

  getFormattedUptime(): string {
    const now = this.context.currentTime ?? Date.now();
    return formatUptime(now - this.context.buildTime);
  }

  navigateHistory(direction: 'previous' | 'next'): string {
    return this.history.navigate(direction);
  }

  complete(input: string): string | undefined {
    return completeTerminalCommand(input);
  }

  submit(rawCommand: string): TerminalExecutionResult | null {
    const trimmed = rawCommand.trim();
    if (!trimmed) return null;

    const result = executeTerminalCommand(trimmed, {
      ...this.context,
      currentTime: Date.now(),
    });

    const commandLine = {
      html: this.renderPrompt(trimmed, result.isValid),
      isValid: result.isValid,
    };

    if (!result.isValid) {
      return {
        commandLine,
        response: {
          html: result.output ?? `Unknown command: ${trimmed}. Type help.`,
          isHtml: false,
          isMultiLine: false,
        },
      };
    }

    this.history.record(trimmed);

    if (result.type === 'clear') {
      return { commandLine, clear: true };
    }

    const isHtml = result.type === 'html';
    const output = result.output ?? '';
    const isMultiLine = output.includes('\n');

    return {
      commandLine,
      response: output
        ? {
            html: output,
            isHtml,
            isMultiLine,
            action: result.action,
          }
        : undefined,
    };
  }
}
export class TerminalHistory {
  private readonly entries: string[] = [];
  private index = 0;

  constructor(private readonly limit = 20) {}

  record(command: string): void {
    this.entries.push(command.trim().toLocaleLowerCase());
    if (this.entries.length > this.limit) this.entries.shift();
    this.index = this.entries.length;
  }

  navigate(direction: 'previous' | 'next'): string {
    const offset = direction === 'previous' ? -1 : 1;
    this.index = Math.max(0, Math.min(this.entries.length, this.index + offset));
    return this.entries[this.index] ?? '';
  }
}

export function completeTerminalCommand(input: string): TerminalCommand | undefined {
  const prefix = input.toLocaleLowerCase();
  const matches = TERMINAL_COMMAND_NAMES.filter((command) => command.startsWith(prefix));
  return matches.length === 1 ? matches[0] : undefined;
}

export const TERMINAL_ICONS = {
  envelope: {
    viewBox: '0 0 512 512',
    path: 'M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z',
  },
  github: {
    viewBox: '0 0 496 512',
    path: 'M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z',
  },
  linkedin: {
    viewBox: '0 0 448 512',
    path: 'M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z',
  },
  user: {
    viewBox: '0 0 448 512',
    path: 'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z',
  },
  server: {
    viewBox: '0 0 512 512',
    path: 'M64 32C28.7 32 0 60.7 0 96l0 64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 32zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 288zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z',
  },
  briefcase: {
    viewBox: '0 0 512 512',
    path: 'M184 48l144 0c4.4 0 8 3.6 8 8l0 40-160 0 0-40c0-4.4 3.6-8 8-8zm-56 8l0 40L32 96C14.3 96 0 110.3 0 128l0 96 512 0 0-96c0-17.7-14.3-32-32-32l-96 0 0-40c0-30.9-25.1-56-56-56L184 0c-30.9 0-56 25.1-56 56zM512 256L0 256l0 160c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-160zM232 328l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-48 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z',
  },
  'location-dot': {
    viewBox: '0 0 384 512',
    path: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z',
  },
  code: {
    viewBox: '0 0 640 512',
    path: 'M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z',
  },
  folder: {
    viewBox: '0 0 512 512',
    path: 'M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z',
  },
  'file-lines': {
    viewBox: '0 0 384 512',
    path: 'M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-160 0c-17.7 0-32-14.3-32-32L192 0 64 0zM224 0l0 128 160 0L256 0 224 0zM80 224c0-13.3 10.7-24 24-24l176 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-176 0c-13.3 0-24-10.7-24-24zm0 96c0-13.3 10.7-24 24-24l176 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-176 0c-13.3 0-24-10.7-24-24zm0 96c0-13.3 10.7-24 24-24l112 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-112 0c-13.3 0-24-10.7-24-24z',
  },
  clock: {
    viewBox: '0 0 512 512',
    path: 'M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11.1 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z',
  },
} as const;

export type TerminalIconName = keyof typeof TERMINAL_ICONS;

export function renderTerminalIcon(name: TerminalIconName, className = ''): string {
  const icon = TERMINAL_ICONS[name];
  if (!icon) return '';
  return `<span class="t-icon ${className}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" fill="currentColor" focusable="false"><path d="${icon.path}"/></svg></span>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatUptime(diffMs: number): string {
  const totalMinutes = Math.floor(Math.max(0, diffMs) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
}

export function formatSkillsGrid(items: readonly string[], columns = 2, gap = 4): string {
  if (!items.length) return '';
  const maxLen = Math.max(...items.map((s) => s.length));
  const colWidth = maxLen + gap;
  const lines: string[] = [];
  for (let i = 0; i < items.length; i += columns) {
    const row = items.slice(i, i + columns);
    lines.push(
      row.map((item, idx) => (idx < row.length - 1 ? item.padEnd(colWidth) : item)).join(''),
    );
  }
  return lines.join('\n');
}

export function formatContactHtml(profile: TerminalProfile | Profile): string {
  return [
    `${renderTerminalIcon('envelope')}Email:    ${profile.email}`,
    `${renderTerminalIcon('github')}GitHub:   ${profile.github.replace(/^https?:\/\//, '')}`,
    `${renderTerminalIcon('linkedin')}LinkedIn: ${profile.linkedin.replace(/^https?:\/\//, '')}`,
  ].join('\n');
}

export function formatWhoamiHtml(context: TerminalContext): string {
  const { profile, projectCount, articleCount, buildTime, currentTime } = context;
  const now = currentTime ?? Date.now();
  const uptime = formatUptime(now - buildTime);

  return `<span class="t-purple">cloud-shell</span>
<span class="t-muted">-----------</span>
${renderTerminalIcon('user')}<span class="t-key">user        </span><span class="t-val">${escapeHtml(profile.name)} (${escapeHtml(profile.username)})</span>
${renderTerminalIcon('server')}<span class="t-key">host        </span><span class="t-val">${escapeHtml(profile.host)}</span>
${renderTerminalIcon('briefcase')}<span class="t-key">role        </span><span class="t-val">${escapeHtml(profile.role)}</span>
${renderTerminalIcon('location-dot')}<span class="t-key">loc         </span><span class="t-val">${escapeHtml(profile.location)}</span>
${renderTerminalIcon('code')}<span class="t-key">skills      </span><span class="t-val">${profile.shortSkills.map(escapeHtml).join(' · ')}</span>
${renderTerminalIcon('folder')}<span class="t-key">projects    </span><span class="t-val">${projectCount} featured</span>
${renderTerminalIcon('file-lines')}<span class="t-key">articles    </span><span class="t-val">${articleCount} published</span>
${renderTerminalIcon('clock')}<span class="t-key">uptime      </span><span class="t-val t-uptime">${uptime}</span>`;
}

export function executeTerminalCommand(
  rawCommand: string,
  context: TerminalContext,
): TerminalCommandResult {
  const commandName = rawCommand.trim().toLocaleLowerCase();
  if (!commandName) {
    return { isValid: false, type: 'text' };
  }

  const command = TERMINAL_COMMANDS.find((candidate) => candidate.name === commandName);
  if (!command) {
    return {
      isValid: false,
      type: 'text',
      output: `Unknown command: ${rawCommand.trim()}. Type help.`,
    };
  }

  switch (command.name) {
    case 'help':
      return {
        isValid: true,
        type: command.resultType,
        output: TERMINAL_HELP,
      };
    case 'whoami':
      return {
        isValid: true,
        type: command.resultType,
        output: formatWhoamiHtml(context),
      };
    case 'skills':
      return {
        isValid: true,
        type: command.resultType,
        output: formatSkillsGrid(context.profile.skills),
      };
    case 'contact':
      return {
        isValid: true,
        type: command.resultType,
        output: formatContactHtml(context.profile),
      };
    case 'theme':
      return {
        isValid: true,
        type: command.resultType,
        action: 'theme',
        output: 'Switched color theme.',
      };
    case 'clear':
      return {
        isValid: true,
        type: command.resultType,
      };
  }
}
