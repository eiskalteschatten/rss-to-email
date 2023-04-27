import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..', '..');

export const FEED_FILE = path.resolve(projectRoot, 'feeds.json');
export const FEED_CACHE_FILE = path.resolve(projectRoot, 'feedCache.json');
