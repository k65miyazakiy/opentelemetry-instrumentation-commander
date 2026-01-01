# OpenTelemetry Instrumentation for Commander.js

A monorepo containing OpenTelemetry automatic instrumentation for Commander.js CLI framework.

## Project Structure

```
.
├── packages/
│   ├── opentelemetry-instrumentation-commander/  # Core instrumentation package (publishable)
│   ├── example-cli/                              # Example CLI application - CommonJS (private)
│   └── example-cli-esm/                          # Example CLI application - ESM (private)
└── package.json                                  # Root workspace configuration
```

## Packages

### opentelemetry-instrumentation-commander

The core instrumentation package that provides automatic OpenTelemetry tracing for Commander.js applications.

**Features:**
- Automatic span creation for command execution
- Support for both synchronous and asynchronous commands
- Exception recording with stack traces
- Context propagation to command handlers
- Support for nested commands and subcommands

See [packages/opentelemetry-instrumentation-commander/README.md](packages/opentelemetry-instrumentation-commander/README.md) for details.

## License

MIT
