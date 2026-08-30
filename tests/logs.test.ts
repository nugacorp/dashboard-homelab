import { describe, expect, it } from 'vitest';
import {
  createLogger,
  registerSecret,
} from '../server/logger.js';

describe('NUGA HOME in-memory log buffer', () => {
  it('keeps a bounded redacted snapshot', () => {
    const logger = createLogger('debug', 2);
    const secret = 'nuga-super-secret-value';

    registerSecret(secret);

    logger.info('first message');
    logger.warn('second message', {
      token: secret,
      authorization: `Bearer ${secret}`,
    });
    logger.error(`third message ${secret}`);

    const entries = logger.entries();

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.level)).toEqual([
      'warn',
      'error',
    ]);

    const rendered = JSON.stringify(entries);

    expect(rendered).not.toContain(secret);
    expect(rendered).toContain('[REDACTED]');
  });

  it('returns defensive copies of entries', () => {
    const logger = createLogger('info', 5);

    logger.info('hello', { source: 'test' });

    const first = logger.entries();
    first[0]!.context.source = 'modified';

    const second = logger.entries();

    expect(second[0]?.context.source).toBe('test');
  });
});
