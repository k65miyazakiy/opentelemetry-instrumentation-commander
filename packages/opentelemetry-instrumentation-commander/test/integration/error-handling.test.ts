import * as assert from 'assert';
import { SpanStatusCode } from '@opentelemetry/api';
import { setupInstrumentation, cleanupInstrumentation, TestContext } from '../helper';

describe('CommanderInstrumentation - Error Handling', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupInstrumentation();
  });

  afterEach(() => {
    cleanupInstrumentation(ctx);
  });

  it('should record exception when synchronous command throws error', () => {
    const program = new ctx.Command();
    const errorMessage = 'Synchronous error';

    program
      .command('sync-error')
      .action(() => {
        throw new Error(errorMessage);
      });

    try {
      program.parse(['node', 'test', 'sync-error']);
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
    const event = span.events[0];
    assert.strictEqual(event.name, 'exception');
    assert.strictEqual(event.attributes?.['exception.type'], 'Error');
    assert.strictEqual(event.attributes?.['exception.message'], errorMessage);
  });

  it('should include stack trace in exception event', () => {
    const program = new ctx.Command();

    program
      .command('error-with-stack')
      .action(() => {
        throw new Error('Error with stack trace');
      });

    try {
      program.parse(['node', 'test', 'error-with-stack']);
    } catch (error) {
      // Intentionally ignored for test
    }

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];
    const event = span.events[0];

    assert.ok(event.attributes?.['exception.stacktrace']);
    const stacktrace = event.attributes?.['exception.stacktrace'] as string;
    assert.ok(stacktrace.includes('Error: Error with stack trace'));
    assert.ok(stacktrace.includes('at '));
  });

  it('should re-throw error after recording', () => {
    const program = new ctx.Command();
    const errorMessage = 'Should be re-thrown';

    program
      .command('rethrow-test')
      .action(() => {
        throw new Error(errorMessage);
      });

    assert.throws(
      () => {
        program.parse(['node', 'test', 'rethrow-test']);
      },
      (error: Error) => {
        return error.message === errorMessage;
      }
    );
  });

  it('should handle non-Error exceptions', () => {
    const program = new ctx.Command();
    const errorValue = 'string error';

    program
      .command('string-error')
      .action(() => {
        throw errorValue;
      });

    try {
      program.parse(['node', 'test', 'string-error']);
    } catch (error) {
      assert.strictEqual(error, errorValue);
    }

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];

    assert.strictEqual(span.status.code, SpanStatusCode.ERROR);
    assert.strictEqual(span.status.message, errorValue);
  });

  it('should record error even if it occurs after async delay', async () => {
    const program = new ctx.Command();
    const errorMessage = 'Delayed error';

    program
      .command('delayed-error')
      .action(async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 20));
        throw new Error(errorMessage);
      });

    try {
      await program.parseAsync(['node', 'test', 'delayed-error']);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error instanceof Error);
    }

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];

    assert.strictEqual(span.status.code, SpanStatusCode.ERROR);
    assert.strictEqual(span.events.length, 1);
    assert.ok(span.attributes['command.duration_ms']);
    assert.strictEqual(typeof span.attributes['command.duration_ms'], 'number');
  });
});
