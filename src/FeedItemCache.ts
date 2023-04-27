import cron from 'node-cron';
import { Item } from 'rss-parser';

import config from '../config';
import { handleError } from './errors';

class FeedItemCache {
  async cacheFeedItem(item: Item): Promise<void> {

  }

  setupCleanupCronjob(): void {
    if (!cron.validate(config.feeds.cacheCleanupCronjob)) {
      handleError(`Your cache cleanup cronjob config "(${config.feeds.cacheCleanupCronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cacheCleanupCronjob, this.cleanupCache);
  }

  private async cleanupCache(): Promise<void> {
    console.log('Cleaning up the feed item cache...');

    // TODO

    console.log('The feed item cache has been cleaned up.');
  }
}

export default FeedItemCache;
