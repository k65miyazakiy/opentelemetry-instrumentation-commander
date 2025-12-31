import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
  isWrapped,
} from '@opentelemetry/instrumentation';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type * as CommanderTypes from 'commander';
import packageJson from '../package.json';

const PACKAGE_NAME = packageJson.name;
const PACKAGE_VERSION = packageJson.version;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CommanderInstrumentationConfig {
  // Future configuration options can be added here
}

export class CommanderInstrumentation extends InstrumentationBase<CommanderInstrumentationConfig> {
  constructor(config: CommanderInstrumentationConfig = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config);
  }

  protected init() {
    return new InstrumentationNodeModuleDefinition(
      'commander',
      ['>=2.0.0 <15'],
      this._patchCommander.bind(this),
      this._unpatchCommander.bind(this)
    );
  }

  private _patchCommander(
    moduleExports: typeof CommanderTypes,
    moduleVersion?: string
  ): typeof CommanderTypes {
    this._diag.debug(`Patching commander@${moduleVersion}`);

    const Command = moduleExports.Command;

    if (!Command || !Command.prototype) {
      this._diag.warn('Could not find Command class in commander module');
      return moduleExports;
    }

    if (isWrapped(Command.prototype.action)) {
      this._unwrap(Command.prototype, 'action');
    }

    this._wrap(
      Command.prototype,
      'action',
      this._patchAction.bind(this)
    );

    this._diag.debug('commander module patched successfully');
    return moduleExports;
  }

  private _unpatchCommander(
    moduleExports: typeof CommanderTypes,
    moduleVersion?: string
  ): void {
    this._diag.debug(`Unpatching commander@${moduleVersion}`);

    const Command = moduleExports.Command;
    if (Command && Command.prototype) {
      if (isWrapped(Command.prototype.action)) {
        this._unwrap(Command.prototype, 'action');
      }
    }
  }

  private _patchAction(original: Function) {
    const instrumentation = this;

    return function patchedAction(this: CommanderTypes.Command, fn: (...args: any[]) => void | Promise<void>) {
      const wrappedFn = function (this: any, ...args: any[]) {
        const commandName = getCommandName(this as CommanderTypes.Command);
        const spanName = `command ${commandName}`;

        return instrumentation.tracer.startActiveSpan(
          spanName,
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              'command.name': commandName,
              'command.args': JSON.stringify(args.slice(0, -1)),
            },
          },
          (span) => {
            const startTime = Date.now();

            try {
              const result = fn.apply(this, args);

              if (result && typeof result.then === 'function') {
                return result
                  .then((res: any) => {
                    span.setStatus({ code: SpanStatusCode.OK });
                    span.setAttribute('command.duration_ms', Date.now() - startTime);
                    span.end();
                    return res;
                  })
                  .catch((error: Error) => {
                    span.setStatus({
                      code: SpanStatusCode.ERROR,
                      message: error.message,
                    });
                    span.recordException(error);
                    span.setAttribute('command.duration_ms', Date.now() - startTime);
                    span.end();
                    throw error;
                  });
              }

              span.setStatus({ code: SpanStatusCode.OK });
              span.setAttribute('command.duration_ms', Date.now() - startTime);
              span.end();
              return result;
            } catch (error) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
              });
              if (error instanceof Error) {
                span.recordException(error);
              }
              span.setAttribute('command.duration_ms', Date.now() - startTime);
              span.end();
              throw error;
            }
          }
        );
      };

      return original.call(this, wrappedFn);
    };
  }
}

/**
 * Extract command name from Commander instance, handling version differences.
 * Commander v9+ uses _name property, earlier versions use name() method.
 */
function getCommandName(command: CommanderTypes.Command): string {
  const name = (command as any)._name || (command as any).name() || 'unknown';
  return name;
}
