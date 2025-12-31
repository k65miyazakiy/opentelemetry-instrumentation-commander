import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeTracerProvider, SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CommanderInstrumentation } from 'opentelemetry-instrumentation-commander';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'cli-app',
    'service.version': '1.0.0',
  }),
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter())
  ]
});

provider.register();

console.log('[Tracing] OpenTelemetry initialized for CLI app');

registerInstrumentations({
  instrumentations: [
    new CommanderInstrumentation(),
  ],
});

console.log('[Tracing] Commander instrumentation registered\n');
