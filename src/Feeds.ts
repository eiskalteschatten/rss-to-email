import cron from 'node-cron';
import Parser, { Item } from 'rss-parser';
import fsPromises from 'node:fs/promises';

import config from '../config';
import { FEED_FILE } from './constants';
import { FeedCategory, FeedData } from './interfaces';
import Mailer from './Mailer';
import { handleError } from './errors';
import FeedItemCache from './FeedItemCache';
import { debugLog } from './lib/logger';

class Feeds {
  setupCronjob(): void {
    if (!cron.validate(config.feeds.cronjob)) {
      handleError(`Your feed cronjob config "(${config.feeds.cronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  async fetchAll(): Promise<void> {
    try {
      console.log('Fetching feeds...');

      const feedCategoriesString = await fsPromises.readFile(FEED_FILE, 'utf8');
      const feedCategories: FeedCategory[] = JSON.parse(feedCategoriesString);
      const parser = new Parser();
      const allFeedItems: Item[] = [];
      const feedItemCache = new FeedItemCache();

      for (const category of feedCategories) {
        for (const feed of category.feeds) {
          console.log(`Fetching "${feed.title}" from "${feed.xmlUrl}"...`);

          const parsedFeed = await parser.parseURL(feed.xmlUrl);

          for (const item of parsedFeed.items) {
            const oldestFeedToSendDate = config.feeds.oldestFeedToSendDate();
            const itemDate = new Date(item.pubDate);

            debugLog(`Processing feed item: ${item.title}`);

            // If the item is older than the set date, ignore it
            if (itemDate <= oldestFeedToSendDate) {
              debugLog(`Too old: ${item.title}`);

              continue;
            }

            const isCached = await feedItemCache.itemIsInCache(item);

            // If the item is cached, skip it
            if (isCached) {
              debugLog(`Found in cache: ${item.title}`);
              continue;
            }

            const feedData: FeedData = {
              categoryTitle: category.title,
              item,
            };

            await this.sendEmail(feedData);
            allFeedItems.push(item);
          }
        }

        // TODO: remove
        break;
      }

      await feedItemCache.cacheFeedItems(allFeedItems);

      console.log('All feeds fetched and emails sent.');
    }
    catch (error) {
      handleError(error);
    }
  }

  private async sendEmail(feedData: FeedData): Promise<void> {
    debugLog(`Sending email for ${feedData.item.title}`);

    const mailer = new Mailer();
    await mailer.sendFeedMail(feedData);
  }
}

const feeds = new Feeds();

export default feeds;
