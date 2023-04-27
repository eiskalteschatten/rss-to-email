import cron from 'node-cron';
import { Item } from 'rss-parser';
import fs from 'node:fs';

import config from '../config';
import { handleError } from './errors';
import { FEED_CACHE_FILE } from './constants';
import { FeedCacheItem } from './interfaces';

class FeedItemCache {
  async cacheFeedItems(items: Item[]): Promise<void> {
    try {
      const feedCacheItems = await this.readCacheFile();

      for (const item of items) {
        const feedCacheItem: FeedCacheItem = {
          guid: item.guid,
          pubDate: item.pubDate,
          link: item.link,
        };

        feedCacheItems.push(feedCacheItem);
      }

      await this.writeCacheFile(JSON.stringify(feedCacheItems));
    }
    catch (error) {
      handleError(error);
    }
  }

  setupCleanupCronjob(): void {
    if (!cron.validate(config.feeds.cacheCleanupCronjob)) {
      handleError(`Your cache cleanup cronjob config "(${config.feeds.cacheCleanupCronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cacheCleanupCronjob, this.cleanupCache);
  }

  private async cleanupCache(): Promise<void> {
    try {
      console.log('Cleaning up the feed item cache...');

      if (!fs.existsSync(FEED_CACHE_FILE)) {
        // Do nothing because there is no cache to clean up.
        return;
      }

      // TODO: clean up cached items that are older than whatever date is configured for
      // feeds that should be sent (same config as in the Feeds->fetchAll() function)

      console.log('The feed item cache has been cleaned up.');
    }
    catch (error) {
      handleError(error);
    }
  }

  private async readCacheFile(): Promise<FeedCacheItem[]> {
    try {
      let feedCacheItems: FeedCacheItem[] = [];

      if (fs.existsSync(FEED_CACHE_FILE)) {
        const feedCacheString = await fs.promises.readFile(FEED_CACHE_FILE, 'utf8');
        feedCacheItems = JSON.parse(feedCacheString);
      }

      return feedCacheItems;
    }
    catch (error) {
      handleError(error);
    }
  }

  private async writeCacheFile(feedItems: string): Promise<void> {
    await fs.promises.writeFile(FEED_CACHE_FILE, feedItems);
  }
}

export default FeedItemCache;
