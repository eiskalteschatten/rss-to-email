import feeds from './Feeds';

function main() {
  feeds.setupCronjob();
  feeds.fetchAll();
}

main();
