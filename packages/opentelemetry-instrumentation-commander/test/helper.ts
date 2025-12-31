/**
 * Test helper utilities
 */

import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { context } from '@opentelemetry/api';
import { CommanderInstrumentation } from '../src/instrumentation-commander';

export interface TestContext {
  instrumentation: CommanderInstrumentation;
  provider: NodeTracerProvider;
  exporter: InMemorySpanExporter;
  contextManager: AsyncHooksContextManager;
  Command: any;
}

/**
 * Setup test environment with proper module loading order
 *
 * IMPORTANT: This function must be called in beforeEach() to ensure
 * instrumentation is initialized BEFORE commander module is loaded.
 */
export function setupInstrumentation(): TestContext {
  // Clear commander from require cache to allow re-instrumentation
  const commanderPath = require.resolve('commander');
  delete require.cache[commanderPath];

  // Setup context manager
  const contextManager = new AsyncHooksContextManager();
  contextManager.enable();
  context.setGlobalContextManager(contextManager);

  // Setup tracer provider and exporter
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();

  // Initialize instrumentation BEFORE loading commander
  const instrumentation = new CommanderInstrumentation();
  instrumentation.setTracerProvider(provider);

  // Dynamically load commander AFTER instrumentation is set up
  const commander = require('commander');
  const Command = commander.Command;

  return {
    instrumentation,
    provider,
    exporter,
    contextManager,
    Command,
  };
}

/**
 * Cleanup test environment
 */
export function cleanupInstrumentation(ctx: TestContext): void {
  ctx.instrumentation.disable();
  ctx.provider.shutdown();
  ctx.contextManager.disable();
  ctx.exporter.reset();
}
