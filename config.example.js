module.exports = {
  feeds: {
    // Fetch feeds every 10 minutes by default
    cronjob: '*/10 * * * *',
    // Clean up the cache every Monday
    cacheCleanupCronjob: '0 0 * * MON',
  },
  mailer: {
    from: 'fromaddress@email.com',
    to: 'toaddress@email.com',
    smtp: {
      host: 'smpt.xxx.com',
      port: 465,
      auth: {
        user: 'someuser@email.com',
        pass: 'somepassword',
      },
    },
  },
};
