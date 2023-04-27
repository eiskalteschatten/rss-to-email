import cron from 'node-cron';
import Parser from 'rss-parser';

import config from '../config';
import { FEED_FILE } from './constants';
import { FeedCategory, FeedData } from './interfaces';
import Mailer from './Mailer';
import { handleError } from './errors';

class Feeds {
  setupCronjob(): void {
    if (!cron.validate(config.feeds.cronjob)) {
      handleError(`Your cronjob config "(${config.feeds.cronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  async fetchAll(): Promise<void> {
    try {
      console.log('Fetching feeds...');

      const feedCategories: FeedCategory[] = await import(FEED_FILE);
      const parser = new Parser();

      for (const category of feedCategories) {
        for (const feed of category.feeds) {
          console.log(`Fetching "${feed.title}" from "${feed.xmlUrl}"...`);

          const parsedFeed = await parser.parseURL(feed.xmlUrl);
          console.log(parsedFeed.title);

          for (const item of parsedFeed.items) {
            const feedData: FeedData = {
              categoryTitle: category.title,
              item,
            };

            await this.sendEmail(feedData);
          }
        }
      }

      console.log('Feeds fetched, sending emails...');
    }
    catch (error) {
      handleError(error);
    }
  }

  private async sendEmail(feedData: FeedData): Promise<void> {
    // TODO: cache feed so that emails are not sent multiple times

    const mailer = new Mailer();
    await mailer.sendMail(feedData);
  }
}

const feeds = new Feeds();

export default feeds;
