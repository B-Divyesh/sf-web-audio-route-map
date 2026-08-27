import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve(process.cwd(), 'dist');
if (target !== resolve(process.cwd(), 'dist')) {
  throw new Error('Refusing to clean an unexpected directory.');
}
await rm(target, { recursive: true, force: true });
