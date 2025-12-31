import * as assert from 'assert';
import { SpanStatusCode } from '@opentelemetry/api';
import { setupInstrumentation, cleanupInstrumentation, TestContext } from '../helper';

describe('CommanderInstrumentation - Async Operations', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupInstrumentation();
  });

  afterEach(() => {
    cleanupInstrumentation(ctx);
  });

  it('should handle async command correctly', async () => {
    const program = new ctx.Command();

    program
      .command('async-test')
      .action(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 50));
        console.log('Async operation completed');
      });

    await program.parseAsync(['node', 'test', 'async-test']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 1);

    const span = spans[0];
    assert.strictEqual(span.name, 'command async-test');
    assert.strictEqual(span.status.code, SpanStatusCode.OK);

    assert.ok(
      (span.attributes['command.duration_ms'] as number) >= 50,
      'Duration should include async operation time'
    );
  });

  it('should handle Promise rejection', async () => {
    const program = new ctx.Command();
    const errorMessage = 'Async operation failed';

    program
      .command('async-error')
      .action(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 10));
        throw new Error(errorMessage);
      });

    try {
      await program.parseAsync(['node', 'test', 'async-error']);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.strictEqual(error.message, errorMessage);
    }

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 1);

    const span = spans[0];
    assert.strictEqual(span.status.code, SpanStatusCode.ERROR);
    assert.strictEqual(span.status.message, errorMessage);

    assert.strictEqual(span.events.length, 1);
    const exceptionEvent = span.events[0];
    assert.strictEqual(exceptionEvent.name, 'exception');
    assert.strictEqual(exceptionEvent.attributes?.['exception.message'], errorMessage);
    assert.ok(exceptionEvent.attributes?.['exception.stacktrace']);
  });

  it('should end span after all async operations complete', async () => {
    const program = new ctx.Command();
    const delays = [30, 20, 40];
    let totalDelay = 0;

    program
      .command('multi-async')
      .action(async () => {
        for (const delay of delays) {
          await new Promise<void>(resolve => setTimeout(resolve, delay));
          totalDelay += delay;
        }
      });

    await program.parseAsync(['node', 'test', 'multi-async']);

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];

    assert.ok(
      (span.attributes['command.duration_ms'] as number) >= totalDelay,
      'Span should include all async operations'
    );
  });
});
