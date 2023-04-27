module.exports = {
  feeds: {
    // Fetch feeds every 10 minutes by default
    cronjob: '*/10 * * * *',
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
