import { performance } from 'node:perf_hooks';
import { loadProfile, validateProfileFile, validateBioFile } from '../src/lib/profile';
import { loadProjects, validateProjectsFile, loadProjectCatalog, OfflineMetadataProvider } from '../src/lib/projects';
import { publishedArticles, articleNeighbors } from '../src/lib/articles';
import { executeTerminalCommand, completeTerminalCommand, TerminalHistory } from '../src/lib/terminal';

const ITERATIONS = 50;

function runBenchmark() {
  // 1. Benchmark Content Loading & Validation
  const t0 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    validateProfileFile();
    validateBioFile();
    validateProjectsFile();
    loadProfile();
    loadProjects();
    for (const article of publishedArticles) {
      articleNeighbors(article);
    }
  }
  const contentLoadMs = (performance.now() - t0) / ITERATIONS;

  // 2. Benchmark Catalog Build & Offline Enrichment
  const t1 = performance.now();
  const offlineProvider = new OfflineMetadataProvider();
  for (let i = 0; i < ITERATIONS; i++) {
    loadProjectCatalog({ provider: offlineProvider });
  }
  const validationMs = (performance.now() - t1) / ITERATIONS;

  // 3. Benchmark Terminal Session
  const profile = loadProfile();
  const context = {
    profile,
    projectCount: 8,
    articleCount: 6,
    buildTime: Date.now(),
    currentTime: Date.now(),
  };
  const t2 = performance.now();
  for (let i = 0; i < ITERATIONS * 2; i++) {
    const history = new TerminalHistory();
    executeTerminalCommand('whoami', context);
    history.record('whoami');
    executeTerminalCommand('skills', context);
    history.record('skills');
    executeTerminalCommand('contact', context);
    history.record('contact');
    executeTerminalCommand('help', context);
    completeTerminalCommand('pr');
    history.navigate('previous');
  }
  const terminalExecMs = (performance.now() - t2) / (ITERATIONS * 2);

  const totalPipelineLatency = contentLoadMs + validationMs + terminalExecMs;

  console.log(`METRIC pipeline_latency_ms=${totalPipelineLatency.toFixed(3)}`);
  console.log(`METRIC content_load_ms=${contentLoadMs.toFixed(3)}`);
  console.log(`METRIC validation_ms=${validationMs.toFixed(3)}`);
  console.log(`METRIC terminal_exec_ms=${terminalExecMs.toFixed(3)}`);
}

runBenchmark();
