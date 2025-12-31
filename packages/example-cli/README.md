# Example CLI Application

This is a demonstration CLI application showing how to use `opentelemetry-instrumentation-commander`.

## Usage

Build and run the CLI application:

```bash
npm run build
npm start -- greet --name Alice
npm start -- math --a 10 --b 20
npm start -- error
```

## Commands

- `greet [--name <name>]` - Greets the specified name (async command)
- `math --a <number> --b <number>` - Performs addition (sync command)
- `error` - Throws an error (for testing error handling)

## How it works

The application uses OpenTelemetry tracing with automatic Commander.js instrumentation. Each command execution creates a span with:

- Command name
- Command arguments
- Execution duration
- Any errors that occur

See the console output for trace information.
