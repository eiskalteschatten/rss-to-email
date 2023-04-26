import cron from 'node-cron';

import config from '../config';

class Feeds {
  setupCronjob(): void {
    if (!cron.validate(config.feeds.cronjob)) {
      throw new Error(`Your cronjob config "(${config.feeds.cronjob}" is invalid!`);
    }

    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  fetchAll(): void {
    console.log('Feeds fetched');
  }
}

const feeds = new Feeds();

export default feeds;
