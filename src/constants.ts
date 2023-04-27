import path from 'node:path';

const projectRoot = process.env.NODE_ENV === 'development' ? path.resolve(__dirname, '..') : path.resolve(__dirname, '..', '..');

export const FEED_FILE = path.resolve(projectRoot, 'feeds.json');
export const FEED_CACHE_FILE = path.resolve(projectRoot, 'feedCache.json');
