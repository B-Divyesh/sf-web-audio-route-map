import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.cwd(), 'dist/site/staticwebapp.config.json');
const config = JSON.parse(await readFile(output, 'utf8'));
const immutableCache = 'public, max-age=31536000, immutable';
const assetRoute = config.routes?.find((route) => route.route === '/assets/*');
const serviceWorkerRoute = config.routes?.find((route) => route.route === '/sw.js');

if (assetRoute?.headers?.['Cache-Control'] !== immutableCache) {
  throw new Error('Built Azure configuration must cache hashed /assets/* for one year as immutable.');
}
if (serviceWorkerRoute?.headers?.['Cache-Control'] !== 'no-cache') {
  throw new Error('Built Azure configuration must revalidate the service worker.');
}
if (config.globalHeaders?.['Permissions-Policy'] !== 'camera=(), microphone=(), geolocation=()') {
  throw new Error('Built Azure configuration must deny unused capture permissions.');
}

console.log('Deployment response policy verified in dist/site/staticwebapp.config.json');
