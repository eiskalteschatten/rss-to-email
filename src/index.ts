import feeds from './Feeds';
import FeedItemCache from './FeedItemCache';

function main(): void {
  feeds.setupCronjob();
  feeds.fetchAll();

  const feedItemCache = new FeedItemCache();
  feedItemCache.setupCleanupCronjob();
}

main();
