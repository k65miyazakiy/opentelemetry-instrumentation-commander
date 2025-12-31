import * as assert from 'assert';
import { trace, SpanKind } from '@opentelemetry/api';
import { setupInstrumentation, cleanupInstrumentation, TestContext } from '../helper';

describe('CommanderInstrumentation - Context Propagation', () => {
  let ctx: TestContext;
  let tracer: ReturnType<typeof trace.getTracer>;

  beforeEach(() => {
    ctx = setupInstrumentation();
    tracer = ctx.provider.getTracer('test-tracer');
  });

  afterEach(() => {
    cleanupInstrumentation(ctx);
  });

  it('should propagate context to command handler', () => {
    const program = new ctx.Command();
    let activeSpanInHandler: ReturnType<typeof trace.getActiveSpan> | undefined;

    program
      .command('context-test')
      .action(() => {
        activeSpanInHandler = trace.getActiveSpan();
      });

    program.parse(['node', 'test', 'context-test']);

    assert.ok(activeSpanInHandler, 'Active span should be available in handler');

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 1);

    assert.strictEqual(
      activeSpanInHandler!.spanContext().spanId,
      spans[0].spanContext().spanId
    );
  });

  it('should create child spans for nested operations', () => {
    const program = new ctx.Command();

    program
      .command('nested-ops')
      .action(() => {
        const activeSpan = trace.getActiveSpan();
        assert.ok(activeSpan, 'Active span should be available in handler');

        tracer.startActiveSpan('child-operation', { kind: SpanKind.INTERNAL }, (childSpan) => {
          childSpan.end();
        });
      });

    program.parse(['node', 'test', 'nested-ops']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 2, `Expected 2 spans but got ${spans.length}`);

    const commandSpan = spans.find(s => s.name === 'command nested-ops');
    const childSpan = spans.find(s => s.name === 'child-operation');

    assert.ok(commandSpan, 'Command span should exist');
    assert.ok(childSpan, 'Child span should exist');

    assert.strictEqual(
      childSpan!.parentSpanId,
      commandSpan!.spanContext().spanId,
      'Child span should have command span as parent'
    );
  });

  it('should create child spans in nested async operations', async () => {
    const program = new ctx.Command();

    async function nestedOperation() {
      return new Promise<void>((resolve) => {
        tracer.startActiveSpan('nested-async-operation', { kind: SpanKind.INTERNAL }, (childSpan) => {
          setImmediate(() => {
            childSpan.end();
            resolve();
          });
        });
      });
    }

    program
      .command('async-nested')
      .action(async () => {
        const activeSpan = trace.getActiveSpan();
        assert.ok(activeSpan, 'Active span should be available in async handler');

        await nestedOperation();
      });

    await program.parseAsync(['node', 'test', 'async-nested']);

    const spans = ctx.exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 2, `Expected 2 spans but got ${spans.length}`);

    const commandSpan = spans.find(s => s.name === 'command async-nested');
    const childSpan = spans.find(s => s.name === 'nested-async-operation');

    assert.ok(commandSpan, 'Command span should exist');
    assert.ok(childSpan, 'Child span should exist');

    assert.strictEqual(
      childSpan!.parentSpanId,
      commandSpan!.spanContext().spanId,
      'Child span should have command span as parent'
    );
  });

  it('should isolate context between different command executions', () => {
    const program1 = new ctx.Command();
    const program2 = new ctx.Command();
    let spanId1: string | undefined;
    let spanId2: string | undefined;

    program1.command('cmd1').action(() => {
      spanId1 = trace.getActiveSpan()?.spanContext().spanId;
    });

    program2.command('cmd2').action(() => {
      spanId2 = trace.getActiveSpan()?.spanContext().spanId;
    });

    program1.parse(['node', 'test', 'cmd1']);
    program2.parse(['node', 'test', 'cmd2']);

    assert.ok(spanId1);
    assert.ok(spanId2);
    assert.notStrictEqual(spanId1, spanId2);
  });
});
