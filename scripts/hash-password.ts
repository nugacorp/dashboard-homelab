/**
 * Generates the value for DASHBOARD_PASSWORD_HASH.
 *
 *   npm run hash-password -- 'my dashboard password'
 *
 * The password is read from argv or, preferably, from stdin so it does not end
 * up in the shell history. Nothing is written to disk.
 */
import { hashPassword } from '../server/auth.js';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

async function main(): Promise<void> {
  const fromArgs = process.argv.slice(2).join(' ').trim();
  const password = fromArgs || (process.stdin.isTTY ? '' : await readStdin());

  if (!password) {
    process.stderr.write(
      'Usage:\n' +
        "  npm run hash-password -- 'your-password'\n" +
        "  printf '%s' 'your-password' | npm run hash-password\n",
    );
    process.exit(1);
  }
  if (password.length < 12) {
    process.stderr.write('Refusing to hash: use a password of at least 12 characters.\n');
    process.exit(1);
  }

  process.stdout.write(`DASHBOARD_PASSWORD_HASH=${hashPassword(password)}\n`);
}

void main();
