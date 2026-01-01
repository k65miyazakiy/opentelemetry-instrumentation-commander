# OpenTelemetry Instrumentation for Commander.js

Automatic instrumentation for [Commander.js](https://github.com/tj/commander.js) CLI framework using OpenTelemetry.

## Installation

```bash
npm install opentelemetry-instrumentation-commander
```

## Usage

### 1. Create a tracing setup file

Create a tracing setup file (e.g., `tracing.js`) using the appropriate syntax for your module system:

* CommonJS

```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { CommanderInstrumentation } = require('opentelemetry-instrumentation-commander');

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new CommanderInstrumentation(),
  ],
});
```

* ES Module

```javascript
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

### 2. Run your CLI application

* CommonJS

```bash
node -r ./tracing.js your-cli.js
```

* ES Module

```bash
node --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
     --import ./tracing.js \
     your-cli.js
```

Or use `NODE_OPTIONS`:

```bash
NODE_OPTIONS="--experimental-loader=@opentelemetry/instrumentation/hook.mjs --import ./tracing.js" \
  node your-cli.js
```

**Note**: ESM requires the `--experimental-loader` flag and Node.js 18.19.0+.

## What gets instrumented?

This instrumentation creates a span for each command execution with the following attributes:

- `command.name`: The name of the executed command
- `command.args`: JSON-serialized command arguments
- `command.duration_ms`: Command execution duration in milliseconds

## Supported Versions

- Commander.js: `>=2.0.0 <15`
- Node.js: `>=18.0.0`
  - ESM support requires Node.js `>=18.19.0`

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
