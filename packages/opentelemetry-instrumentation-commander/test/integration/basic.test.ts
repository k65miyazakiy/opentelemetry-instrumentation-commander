import * as assert from 'assert';
import { SpanStatusCode } from '@opentelemetry/api';
import { setupInstrumentation, cleanupInstrumentation, TestContext } from '../helper';

describe('CommanderInstrumentation - Basic Integration', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupInstrumentation();
  });

  afterEach(() => {
    cleanupInstrumentation(ctx);
  });

  it('should create span for simple synchronous command', () => {
    const program = new ctx.Command();

    program
      .command('test')
      .action(() => {
        console.log('Test command executed');
      });

    program.parse(['node', 'test', 'test']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 1, 'Should create exactly one span');

    const span = spans[0];
    assert.strictEqual(span.name, 'command test');
    assert.strictEqual(span.attributes['command.name'], 'test');
    assert.strictEqual(span.status.code, SpanStatusCode.OK);
  });

  it('should record command arguments in span attributes', () => {
    const program = new ctx.Command();

    interface GreetOptions {
      name?: string;
    }

    program
      .command('greet')
      .option('-n, --name <name>', 'Name to greet')
      .action((options: GreetOptions) => {
        console.log(`Hello, ${options.name}!`);
      });

    program.parse(['node', 'test', 'greet', '--name', 'Alice']);

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];

    assert.strictEqual(span.name, 'command greet');
    assert.ok(span.attributes['command.args']);

    const args = JSON.parse(span.attributes['command.args'] as string);
    assert.strictEqual(args[0].name, 'Alice');
  });

  it('should record command duration', () => {
    const program = new ctx.Command();

    program
      .command('delay')
      .action(() => {
        const start = Date.now();
        while (Date.now() - start < 10) {
          // busy wait
        }
      });

    program.parse(['node', 'test', 'delay']);

    const spans = ctx.exporter.getFinishedSpans();
    const span = spans[0];

    assert.ok(span.attributes['command.duration_ms']);
    assert.strictEqual(typeof span.attributes['command.duration_ms'], 'number');
  });

  it('should not create span when instrumentation is disabled', () => {
    ctx.instrumentation.disable();

    const program = new ctx.Command();
    program
      .command('test')
      .action(() => {
        console.log('Test');
      });

    program.parse(['node', 'test', 'test']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 0, 'Should not create span when disabled');
  });

  it('should handle multiple command executions', () => {
    const program1 = new ctx.Command();
    program1.command('cmd1').action(() => {});
    program1.parse(['node', 'test', 'cmd1']);

    const program2 = new ctx.Command();
    program2.command('cmd2').action(() => {});
    program2.parse(['node', 'test', 'cmd2']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 2);
    assert.strictEqual(spans[0].name, 'command cmd1');
    assert.strictEqual(spans[1].name, 'command cmd2');
  });
});
