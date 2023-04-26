import feeds from './Feeds';

function main(): void {
  feeds.setupCronjob();
  feeds.fetchAll();
}

main();
