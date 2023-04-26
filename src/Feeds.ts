import cron from 'node-cron';

import config from '../config';

class Feeds {
  setupCronjob() {
    cron.schedule(config.feeds.cronjob, this.fetchAll);
  }

  fetchAll() {
    console.log('Feeds fetched');
  }
}

const feeds = new Feeds();

export default feeds;
