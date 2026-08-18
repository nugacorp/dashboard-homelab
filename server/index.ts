/**
 * Process entry point: load env, validate config, start listening.
 *
 * Configuration errors are fatal and exit non-zero with a message that names
 * the offending variable but never prints its value.
 */
import { createApp } from './app.js';
import { APP_VERSION, ConfigError, describeConfig, loadConfig } from './config.js';
import { createContext } from './context.js';
import { createLogger } from './logger.js';

async function loadDotEnvInDevelopment(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch {
    // dotenv is optional; production passes real environment variables.
  }
}

async function main(): Promise<void> {
  await loadDotEnvInDevelopment();

  const bootLogger = createLogger('info');
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      bootLogger.error(`Configuration error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const logger = createLogger(config.logLevel);
  const ctx = createContext(config, logger);

  logger.info(`NUGA HOME dashboard ${APP_VERSION} starting`);
  for (const [key, value] of Object.entries(describeConfig(config))) {
    logger.info(`  ${key}: ${value}`);
  }
  if (!config.auth) {
    logger.warn(
      'Dashboard authentication is DISABLED. Set DASHBOARD_USERNAME, ' +
        'DASHBOARD_PASSWORD_HASH and SESSION_SECRET before exposing this beyond the LAN.',
    );
  }

  const app = createApp(ctx);
  const server = app.listen(config.port, config.host, () => {
    logger.info(`Listening on http://${config.host}:${config.port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(() => process.exit(0));
    // Do not let a hung keep-alive connection block the container forever.
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  process.stderr.write(`Fatal startup error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
