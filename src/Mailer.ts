import nodemailer, { Transporter } from 'nodemailer';

import { FeedData } from './interfaces';
import config from '../config';

class Mailer {
  private transporter: Transporter;

  constructor(private feedData: FeedData) {
    const { mailer: { smtp } } = config;

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: smtp.auth,
    });
  }

  async sendMail(): Promise<void> {
    await this.transporter.sendMail({
      from: config.mailer.from,
      to: config.mailer.to,
      subject: `${this.feedData.categoryTitle}: ${this.feedData.title}`,
      html: this.generateHtml(),
    });
  }

  private generateHtml(): string {
    return `<html>
      <head>
        <title>${this.feedData.title}</title>
      </head>
      <body>
        ${this.feedData.body}
      </body>
    </html>`;
  }
}

export default Mailer;
