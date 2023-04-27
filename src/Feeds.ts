import cron from 'node-cron';
import Parser from 'rss-parser';

import config from '../config';
import { FEED_CONFIG_FILE } from './constants';
import { FeedCategory } from './interfaces';
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
    console.log('Fetching feeds...');

    const feedCategories: FeedCategory[] = await import(FEED_CONFIG_FILE);
    const parser = new Parser();

    for (const category of feedCategories) {
      for (const feed of category.feeds) {
        const parsedFeed = await parser.parseURL(feed.xmlUrl);
        console.log(parsedFeed.title);

        parsedFeed.items.forEach(item => {
          console.log(item.title + ':' + item.link);
        });
      }
    }

    console.log('Feeds fetched, sending emails...');
  }

  private async sendEmails(): Promise<void> {
    // TODO: cache fetched feeds so that emails are not sent multiple times
    // TODO: email them

    // const mailer = new Mailer();
  }
}

const feeds = new Feeds();

export default feeds;
