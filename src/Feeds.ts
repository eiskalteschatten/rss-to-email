import cron from 'node-cron';
import Parser from 'rss-parser';

import config from '../config';
import { FEED_CONFIG_FILE } from './constants';
import { FeedCategory } from './interfaces';

class Feeds {
  setupCronjob(): void {
    if (!cron.validate(config.feeds.cronjob)) {
      console.error(`Your cronjob config "(${config.feeds.cronjob}" is invalid!`);
      return;
    }

    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  async fetchAll(): Promise<void> {
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

    console.log('Feeds fetched');

    // TODO: email them
  }
}

const feeds = new Feeds();

export default feeds;
