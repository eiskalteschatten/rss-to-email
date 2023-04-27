module.exports = {
  feeds: {
    // Fetch feeds every 10 minutes by default
    cronjob: '*/10 * * * *',
    // Clean up the cache every Monday
    cacheCleanupCronjob: '0 0 * * MON',
    // A function that should return a date object with the oldest date of
    // the feed items that should be sent. Everything older will be ignored.
    oldestFeedToSendDate() {
      const date = new Date();
      date.setMonth(date.getMonth() - 12);  // 12 months ago
      return date;
    },
  },
  mailer: {
    from: 'Rss To Email <fromaddress@email.com>',
    to: 'toaddress@email.com',
    smtp: {
      host: 'smtp.xxx.com',
      port: 465,
      auth: {
        user: 'someuser@email.com',
        pass: 'somepassword',
      },
    },
  },
};
