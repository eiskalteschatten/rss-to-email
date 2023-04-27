import cron from 'node-cron';
import Parser from 'rss-parser';

import config from '../config';
import { FEED_CONFIG_FILE } from './constants';
import { FeedCategory, FeedData } from './interfaces';
import Mailer from './Mailer';

class Feeds {
  setupCronjob(): void {
    if (!cron.validate(config.feeds.cronjob)) {
      console.error(`Your cronjob config "(${config.feeds.cronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  async fetchAll(): Promise<void> {
    try {
      console.log('Fetching feeds...');

      const feedCategories: FeedCategory[] = await import(FEED_CONFIG_FILE);
      const parser = new Parser();

      for (const category of feedCategories) {
        for (const feed of category.feeds) {
          const parsedFeed = await parser.parseURL(feed.xmlUrl);
          console.log(parsedFeed.title);

          for (const item of parsedFeed.items) {
            // TODO: do something with the items
            console.log(item);
          }
        }
      }

      console.log('Feeds fetched, sending emails...');
    }
    catch (error) {
      console.error(error);
    }
  }

  private async sendEmails(feedData: FeedData): Promise<void> {
    // TODO: cache fetched feeds so that emails are not sent multiple times
    // TODO: email them

    const mailer = new Mailer(feedData);
    await mailer.sendMail();
  }
}

const feeds = new Feeds();

export default feeds;
