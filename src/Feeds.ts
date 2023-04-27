import cron from 'node-cron';
import Parser, { Item } from 'rss-parser';
import fsPromises from 'node:fs/promises';

import config from '../config';
import { FEED_FILE } from './constants';
import { FeedCategory, FeedData } from './interfaces';
import Mailer from './Mailer';
import { handleError } from './errors';
import FeedItemCache from './FeedItemCache';

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

            if (process.env.NODE_ENV === 'development') {
              console.debug(`Processing feed item: ${item.title}`);
            }

            // If the item is older than the set date, ignore it
            if (itemDate <= oldestFeedToSendDate) {
              if (process.env.NODE_ENV === 'development') {
                console.debug(`Too old: ${item.title}`);
              }

              continue;
            }

            const isCached = await feedItemCache.itemIsInCache(item);

            // If the item is cached, skip it
            if (isCached) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Found in cache: ${item.title}`);
              }

              continue;
            }

            const feedData: FeedData = {
              categoryTitle: category.title,
              item,
            };

            await this.sendEmail(feedData);
            allFeedItems.push(item);

            // TODO: remove
            break;
          }

          // TODO: remove
          break;
        }

        // TODO: remove
        break;
      }

      await feedItemCache.cacheFeedItems(allFeedItems);

      console.log('Feeds fetched and emails sent.');
    }
    catch (error) {
      handleError(error);
    }
  }

  private async sendEmail(feedData: FeedData): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Sending email for ${feedData.item.title}`);
    }

    const mailer = new Mailer();
    await mailer.sendMail(feedData);
  }
}

const feeds = new Feeds();

export default feeds;
