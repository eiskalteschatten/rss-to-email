import nodemailer, { Transporter } from 'nodemailer';

import { FeedData } from './interfaces';
import config from '../config';

class Mailer {
  private transporter: Transporter;

  constructor() {
    const { mailer: { smtp } } = config;

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: smtp.auth,
    });
  }

  async sendFeedMail(feedData: FeedData): Promise<void> {
    const body = `${feedData.item.content}<br /><hr /><br /><a href="${feedData.item.link}">Visit Website</a>`;

    await this.transporter.sendMail({
      from: config.mailer.from,
      to: config.mailer.to,
      subject: `${feedData.categoryTitle}: ${feedData.item.title}`,
      html: this.generateHtml(feedData.item.title, body),
    });
  }

  private generateHtml(title: string, body: string): string {
    return `<html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        ${body}
      </body>
    </html>`;
  }

  async sendErrorMail(body: string, title = 'An Error Occurred'): Promise<void> {
    await this.transporter.sendMail({
      from: config.mailer.from,
      to: config.mailer.to,
      subject: title,
      html: this.generateHtml(title, body),
    });
  }
}

export default Mailer;
