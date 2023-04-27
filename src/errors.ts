import Mailer from './Mailer';

export async function handleError(error: Error | string): Promise<void> {
  console.error(error);

  const mailer = new Mailer();
  const emailBody = typeof error === 'string' ? error : error.message;
  await mailer.sendErrorMail(emailBody);
}
