import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeTerminalCommand,
  executeTerminalCommand,
  formatContactHtml,
  formatSkillsGrid,
  formatUptime,
  formatWhoamiHtml,
  renderTerminalIcon,
  TERMINAL_COMMAND_NAMES,
  TERMINAL_COMMANDS,
  TerminalHistory,
  TerminalSession,
} from '../src/lib/terminal';
import type { TerminalContext, TerminalProfile } from '../src/lib/terminal';

const mockProfile: TerminalProfile = {
  name: 'Test Engineer',
  username: 'tester',
  role: 'DevSecOps Specialist',
  location: 'Cloud',
  email: 'test@example.com',
  github: 'https://github.com/tester',
  linkedin: 'https://linkedin.com/in/tester',
  promptHost: 'test-node',
  host: 'cloud-host',
  shortSkills: ['AWS', 'K8s'],
  skills: ['AWS EKS', 'Azure AKS', 'Terraform', 'Argo CD'],
};

const mockContext: TerminalContext = {
  profile: mockProfile,
  projectCount: 5,
  articleCount: 3,
  buildTime: 1_000_000,
  currentTime: 1_000_000 + 120_000, // 2 minutes later
};

test('TERMINAL_COMMANDS is the authoritative command and chip registry', () => {
  assert.deepEqual(TERMINAL_COMMAND_NAMES, [
    'help',
    'whoami',
    'skills',
    'contact',
    'theme',
    'clear',
  ]);
  assert.ok(TERMINAL_COMMANDS.every((command) => command.description.length > 0));
  assert.deepEqual(
    TERMINAL_COMMANDS.filter((command) => command.showAsChip).map((command) => command.name),
    ['whoami', 'skills', 'contact', 'theme', 'clear'],
  );
});

test('renderTerminalIcon generates valid accessible SVG span', () => {
  const iconHtml = renderTerminalIcon('user');
  assert.match(iconHtml, /<span class="t-icon "/);
  assert.match(iconHtml, /aria-hidden="true"/);
  assert.match(iconHtml, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
});

test('formatUptime accurately computes elapsed intervals', () => {
  assert.equal(formatUptime(0), '< 1m');
  assert.equal(formatUptime(45_000), '< 1m');
  assert.equal(formatUptime(60_000), '1m');
  assert.equal(formatUptime(15 * 60_000), '15m');
  assert.equal(formatUptime(2 * 3600_000 + 30 * 60_000), '2h 30m');
  assert.equal(formatUptime(3 * 86400_000 + 4 * 3600_000 + 12 * 60_000), '3d 4h 12m');
});

test('formatSkillsGrid formats items into aligned columns', () => {
  assert.equal(formatSkillsGrid([]), '');
  const grid = formatSkillsGrid(['AWS EKS', 'Azure AKS', 'Terraform', 'Argo CD'], 2, 4);
  const lines = grid.split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0] ?? '', /AWS EKS\s+Azure AKS/);
  assert.match(lines[1] ?? '', /Terraform\s+Argo CD/);
});

test('formatContactHtml formats email, github, and linkedin with icons', () => {
  const contact = formatContactHtml(mockProfile);
  assert.match(contact, /Email:\s+test@example.com/);
  assert.match(contact, /GitHub:\s+github.com\/tester/);
  assert.match(contact, /LinkedIn:\s+linkedin.com\/in\/tester/);
  assert.equal(contact.split('\n').length, 3);
});

test('formatWhoamiHtml renders complete terminal identity and counts', () => {
  const whoami = formatWhoamiHtml(mockContext);
  assert.match(whoami, /Test Engineer \(tester\)/);
  assert.match(whoami, /cloud-host/);
  assert.match(whoami, /DevSecOps Specialist/);
  assert.match(whoami, /AWS · K8s/);
  assert.match(whoami, /5 featured/);
  assert.match(whoami, /3 published/);
  assert.match(whoami, /2m/);
});

test('terminal completion and history use the shared command model', () => {
  assert.equal(completeTerminalCommand('wh'), 'whoami');
  assert.equal(completeTerminalCommand('SK'), 'skills');
  assert.equal(completeTerminalCommand('c'), undefined);

  const history = new TerminalHistory();
  history.record('HELP');
  history.record('skills');
  assert.equal(history.navigate('previous'), 'skills');
  assert.equal(history.navigate('previous'), 'help');
  assert.equal(history.navigate('next'), 'skills');
  assert.equal(history.navigate('next'), '');
});

test('executeTerminalCommand handles all valid commands correctly', () => {
  const helpResult = executeTerminalCommand('help', mockContext);
  assert.equal(helpResult.isValid, true);
  assert.equal(helpResult.type, 'text');
  assert.match(helpResult.output ?? '', /Available commands/);

  const whoamiResult = executeTerminalCommand('whoami', mockContext);
  assert.equal(whoamiResult.isValid, true);
  assert.equal(whoamiResult.type, 'html');
  assert.match(whoamiResult.output ?? '', /cloud-shell/);
  assert.equal(whoamiResult.output, formatWhoamiHtml(mockContext));

  const skillsResult = executeTerminalCommand('skills', mockContext);
  assert.equal(skillsResult.isValid, true);
  assert.equal(skillsResult.type, 'text');
  assert.match(skillsResult.output ?? '', /AWS EKS/);

  const contactResult = executeTerminalCommand('contact', mockContext);
  assert.equal(contactResult.isValid, true);
  assert.equal(contactResult.type, 'html');
  assert.match(contactResult.output ?? '', /github.com\/tester/);

  const themeResult = executeTerminalCommand('theme', mockContext);
  assert.equal(themeResult.isValid, true);
  assert.equal(themeResult.type, 'action');
  assert.equal(themeResult.action, 'theme');

  const clearResult = executeTerminalCommand('clear', mockContext);
  assert.equal(clearResult.isValid, true);
  assert.equal(clearResult.type, 'clear');
});

test('executeTerminalCommand handles unknown or empty commands gracefully', () => {
  const emptyResult = executeTerminalCommand('   ', mockContext);
  assert.equal(emptyResult.isValid, false);

  const unknownResult = executeTerminalCommand('sudo rm -rf /', mockContext);
  assert.equal(unknownResult.isValid, false);
  assert.equal(unknownResult.type, 'text');
  assert.equal(unknownResult.output, 'Unknown command: sudo rm -rf /. Type help.');
});

test('TerminalSession renders prompt, initial whoami, and formatted uptime', () => {
  const session = new TerminalSession(mockContext);

  const initialWhoami = session.getInitialWhoami();
  assert.equal(initialWhoami, formatWhoamiHtml(mockContext));
  assert.match(initialWhoami, new RegExp(mockProfile.name));
  assert.match(initialWhoami, new RegExp(mockProfile.username));

  const validPrompt = session.renderPrompt('whoami', true);
  assert.match(validPrompt, new RegExp(`<span class="prompt-user">${mockProfile.username}</span>`));
  assert.match(validPrompt, new RegExp(`<span class="prompt-host">${mockProfile.promptHost}</span>`));
  assert.match(validPrompt, /<span class="cmd-valid">whoami<\/span>/);

  const invalidPrompt = session.renderPrompt('invalid-cmd', false);
  assert.match(invalidPrompt, /<span class="cmd-invalid">invalid-cmd<\/span>/);

  assert.equal(session.getFormattedUptime(), '2m');
});

test('TerminalSession handles command submissions for whoami, skills, contact, and help', () => {
  const session = new TerminalSession(mockContext);

  const whoamiExec = session.submit('whoami');
  assert.ok(whoamiExec);
  assert.equal(whoamiExec.commandLine.isValid, true);
  assert.match(whoamiExec.commandLine.html, /cmd-valid/);
  assert.equal(whoamiExec.clear, undefined);
  assert.ok(whoamiExec.response);
  assert.equal(whoamiExec.response.isHtml, true);
  assert.equal(whoamiExec.response.isMultiLine, true);
  assert.match(whoamiExec.response.html, new RegExp(mockProfile.name));

  const skillsExec = session.submit('skills');
  assert.ok(skillsExec);
  assert.equal(skillsExec.commandLine.isValid, true);
  assert.ok(skillsExec.response);
  assert.equal(skillsExec.response.isHtml, false);
  assert.equal(skillsExec.response.isMultiLine, true);
  assert.match(skillsExec.response.html, new RegExp(mockProfile.skills[0] ?? ''));

  const contactExec = session.submit('contact');
  assert.ok(contactExec);
  assert.equal(contactExec.commandLine.isValid, true);
  assert.ok(contactExec.response);
  assert.equal(contactExec.response.isHtml, true);
  assert.equal(contactExec.response.isMultiLine, true);
  assert.match(contactExec.response.html, new RegExp(mockProfile.email));

  const helpExec = session.submit('help');
  assert.ok(helpExec);
  assert.equal(helpExec.commandLine.isValid, true);
  assert.ok(helpExec.response);
  assert.equal(helpExec.response.isHtml, false);
  assert.equal(helpExec.response.isMultiLine, false);
  assert.match(helpExec.response.html, /Available commands:/);
});

test('TerminalSession handles special command signals (theme, clear)', () => {
  const session = new TerminalSession(mockContext);

  const themeExec = session.submit('theme');
  assert.ok(themeExec);
  assert.equal(themeExec.commandLine.isValid, true);
  assert.equal(themeExec.clear, undefined);
  assert.ok(themeExec.response);
  assert.equal(themeExec.response.action, 'theme');
  assert.equal(themeExec.response.isHtml, false);
  assert.equal(themeExec.response.html, 'Switched color theme.');

  const clearExec = session.submit('clear');
  assert.ok(clearExec);
  assert.equal(clearExec.commandLine.isValid, true);
  assert.equal(clearExec.clear, true);
  assert.equal(clearExec.response, undefined);
});

test('TerminalSession handles empty and invalid commands', () => {
  const session = new TerminalSession(mockContext);

  assert.equal(session.submit(''), null);
  assert.equal(session.submit('   '), null);

  const invalidExec = session.submit('invalid');
  assert.ok(invalidExec);
  assert.equal(invalidExec.commandLine.isValid, false);
  assert.match(invalidExec.commandLine.html, /cmd-invalid/);
  assert.equal(invalidExec.clear, undefined);
  assert.ok(invalidExec.response);
  assert.equal(invalidExec.response.isHtml, false);
  assert.equal(invalidExec.response.isMultiLine, false);
  assert.equal(invalidExec.response.html, 'Unknown command: invalid. Type help.');
});

test('TerminalSession navigates command history and auto-completes inputs', () => {
  const session = new TerminalSession(mockContext);

  session.submit('whoami');
  session.submit('skills');
  session.submit('invalid-cmd'); // invalid command should not be recorded

  assert.equal(session.navigateHistory('previous'), 'skills');
  assert.equal(session.navigateHistory('previous'), 'whoami');
  assert.equal(session.navigateHistory('previous'), 'whoami');
  assert.equal(session.navigateHistory('next'), 'skills');
  assert.equal(session.navigateHistory('next'), '');
  assert.equal(session.navigateHistory('next'), '');

  assert.equal(session.complete('who'), 'whoami');
  assert.equal(session.complete('ski'), 'skills');
  assert.equal(session.complete('con'), 'contact');
  assert.equal(session.complete('the'), 'theme');
  assert.equal(session.complete('cle'), 'clear');
  assert.equal(session.complete('hel'), 'help');
  assert.equal(session.complete('c'), undefined);
  assert.equal(session.complete('xyz'), undefined);
});
