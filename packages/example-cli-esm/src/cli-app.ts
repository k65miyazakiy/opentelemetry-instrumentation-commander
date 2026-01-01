import { Command } from 'commander';

const program = new Command();

program
  .name('cli-app-esm')
  .description('ESM CLI app for testing OpenTelemetry instrumentation')
  .version('1.0.0');

program
  .command('greet')
  .description('Greet someone')
  .option('-n, --name <name>', 'Name to greet', 'World')
  .action(async (options) => {
    console.log(`\n[Greet Command ESM] Starting...`);
    console.log(`Hello, ${options.name}!`);

    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`[Greet Command ESM] Completed\n`);
  });

program
  .command('math')
  .description('Perform math operations')
  .option('-a, --a <number>', 'First number', '0')
  .option('-b, --b <number>', 'Second number', '0')
  .action((options) => {
    console.log(`\n[Math Command ESM] Starting...`);

    const a = parseInt(options.a, 10);
    const b = parseInt(options.b, 10);

    console.log(`${a} + ${b} = ${a + b}`);
    console.log(`${a} * ${b} = ${a * b}`);

    console.log(`[Math Command ESM] Completed\n`);
  });

program
  .command('error')
  .description('Throw an error for testing')
  .action(() => {
    console.log(`\n[Error Command ESM] Starting...`);
    throw new Error('This is a test error from ESM!');
  });

program.parse(process.argv);
