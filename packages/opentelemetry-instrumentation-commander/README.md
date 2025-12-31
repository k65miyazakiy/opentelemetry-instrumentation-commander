# OpenTelemetry Instrumentation for Commander.js

Automatic instrumentation for [Commander.js](https://github.com/tj/commander.js) CLI framework using OpenTelemetry.

## Installation

```bash
npm install opentelemetry-instrumentation-commander
```

## Usage

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { CommanderInstrumentation } from 'opentelemetry-instrumentation-commander';

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new CommanderInstrumentation(),
  ],
});
```

## What gets instrumented?

This instrumentation creates a span for each command execution with the following attributes:

- `command.name`: The name of the executed command
- `command.args`: JSON-serialized command arguments
- `command.duration_ms`: Command execution duration in milliseconds

## Supported Versions

- Commander.js: `>=2.0.0 <15`
- Node.js: `>=18.0.0`

## Configuration

```typescript
interface CommanderInstrumentationConfig {
  // Currently no configuration options available
  // Future options may be added here
}
```

The instrumentation is enabled by default when registered. You can disable it using the standard `enabled` option inherited from `InstrumentationBase`:

```typescript
new CommanderInstrumentation({ enabled: false })
```

## Features

- ✅ Automatic span creation for command execution
- ✅ Support for both synchronous and asynchronous commands
- ✅ Exception recording with stack traces
- ✅ Context propagation to command handlers
- ✅ Support for nested commands and subcommands

## License

MIT
