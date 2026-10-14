/**
 * ARTI AI — Perform Tests workflow.
 *
 * This module initiates a real testing workflow for a project and reports the
 * actual outcome. ARTI AI currently runs entirely in the browser: there is no
 * server-side shell, no container, and no authorized execution environment
 * connected. That means no project command can be executed here.
 *
 * The workflow therefore:
 *   1. Reads the project's stored test configuration.
 *   2. Detects which test categories are configured.
 *   3. Tries to execute the configured command in the current environment.
 *   4. Reports the honest result — `not-configured` when nothing is set up,
 *      `blocked` when a command exists but cannot run here.
 *
 * It never reports `passed`/`failed` without a real execution, and never
 * fabricates coverage or security scores.
 */
import type { Project, TestConfig, TestRun, TestStatus, TestSuiteResult } from './projectStore';
import { activityStore } from './activityStore';

export const EMPTY_TEST_CONFIG: TestConfig = {
  framework: '',
  command: '',
  includeLint: false,
  includeTypeCheck: false,
  includeUnit: false,
  includeIntegration: false,
  includeE2e: false,
  includeBuild: false,
};

export function hasTestConfig(config?: TestConfig): boolean {
  if (!config) return false;
  return Boolean(
    config.command.trim() ||
      config.framework.trim() ||
      config.includeLint ||
      config.includeTypeCheck ||
      config.includeUnit ||
      config.includeIntegration ||
      config.includeE2e ||
      config.includeBuild
  );
}

type Category = { key: keyof TestConfig; label: string };

const CATEGORIES: Category[] = [
  { key: 'includeLint', label: 'Lint' },
  { key: 'includeTypeCheck', label: 'Type checking' },
  { key: 'includeUnit', label: 'Unit tests' },
  { key: 'includeIntegration', label: 'Integration tests' },
  { key: 'includeE2e', label: 'End-to-end tests' },
  { key: 'includeBuild', label: 'Production build verification' },
];

export interface TestEnv {
  /** True only when an authorized execution environment can run project commands. */
  canExecute: boolean;
  /** Human-readable reason when execution is unavailable. */
  reason: string;
}

/**
 * The current environment cannot execute project shell commands. This is the
 * single place the capability is declared, so the whole app stays honest.
 */
export const CURRENT_TEST_ENV: TestEnv = {
  canExecute: false,
  reason:
    'No authorized execution environment is connected. Perform Tests runs in the browser only, so it cannot execute project shell commands.',
};

/**
 * Initiate a real test workflow for `project`. Async to reflect that a real
 * run would await a backend; the outcome is resolved honestly and immediately
 * in this environment.
 */
export async function performTests(project: Project, env: TestEnv = CURRENT_TEST_ENV): Promise<TestRun> {
  const config = project.testConfig;
  const createdAt = new Date().toISOString();
  const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const configured = hasTestConfig(config);

  const detected = CATEGORIES.filter((c) => config && config[c.key]);

  // Publish the real workflow into the shared activity store so the execution
  // timeline and the AI core reflect it — including the honest `blocked` and
  // `not-configured` outcomes, which are not failures and must not be faked.
  const activityId = activityStore.begin('tool', `Tests · ${project.name}`);

  if (!configured) {
    activityStore.settle(activityId, 'blocked', 'No test configuration recorded for this project.');
    return {
      id: runId,
      projectId: project.id,
      createdAt,
      command: '',
      framework: '',
      status: 'not-configured',
      exitStatus: '—',
      suites: CATEGORIES.map<TestSuiteResult>((c) => ({
        name: c.label,
        status: 'not-configured',
        detail: 'No test configuration recorded for this project.',
      })),
      message:
        'Not configured — this project has no test framework, command, or selected categories. Add a test configuration in Project Settings before running tests.',
    };
  }

  if (!env.canExecute) {
    activityStore.settle(activityId, 'blocked', env.reason);
    return {
      id: runId,
      projectId: project.id,
      createdAt,
      command: config!.command.trim() || '(no command)',
      framework: config!.framework.trim() || '(unspecified framework)',
      status: 'blocked',
      exitStatus: 'not run',
      suites:
        detected.length > 0
          ? detected.map<TestSuiteResult>((c) => ({
              name: c.label,
              status: 'blocked',
              detail: 'Configured, but not runnable in the current environment.',
            }))
          : [
              {
                name: 'Test suite',
                status: 'blocked',
                detail: 'No individual category selected; command could not be executed.',
              },
            ],
      message: `Blocked — ${env.reason}`,
    };
  }

  // A real execution path. This branch is unreachable until an authorized
  // execution backend is connected; it exists so the workflow can carry actual
  // results the moment one is.
  try {
    const result = await runCommand(config!.command.trim(), project);
    activityStore.settle(activityId, result.exitCode === 0 ? 'complete' : 'failed', result.exitCode === 0 ? undefined : 'One or more checks failed.');
    return {
      id: runId,
      projectId: project.id,
      createdAt,
      command: config!.command.trim(),
      framework: config!.framework.trim() || '(unspecified framework)',
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitStatus: String(result.exitCode),
      suites:
        detected.length > 0
          ? detected.map<TestSuiteResult>((c) => ({
              name: c.label,
              status: result.exitCode === 0 ? 'passed' : 'failed',
              detail: result.output.slice(0, 400) || 'No output captured.',
            }))
          : [],
      message: result.exitCode === 0 ? 'All executed checks passed.' : 'One or more checks failed.',
    };
  } catch (err) {
    const status: TestStatus = 'blocked';
    const detail = `Execution failed before any test result was produced: ${
      err instanceof Error ? err.message : String(err)
    }`;
    activityStore.settle(activityId, 'blocked', detail);
    return {
      id: runId,
      projectId: project.id,
      createdAt,
      command: config!.command.trim(),
      framework: config!.framework.trim() || '(unspecified framework)',
      status,
      exitStatus: 'error',
      suites: detected.map<TestSuiteResult>((c) => ({
        name: c.label,
        status,
        detail: 'Infrastructure failure — the command could not be executed to completion.',
      })),
      message: `Blocked — ${detail}`,
    };
  }
}

/** Placeholder executor — implemented only when an authorized backend exists. */
async function runCommand(
  _command: string,
  _project: Project
): Promise<{ exitCode: number; output: string }> {
  throw new Error('No execution backend is connected.');
}
