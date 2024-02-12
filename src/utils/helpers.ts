import nodemailer from 'nodemailer';
export const sendMail = async (email: string, token: string) => {
  try {
    console.log(process.env.EMAIL_PORT);
    const transport = nodemailer.createTransport({
      port: Number(process.env.EMAIL_PORT),
      host: process.env.HOST,
      service: process.env.SERVICE,
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    await transport.sendMail({
      from: process.env.USER_EMAIL,
      to: email,
      subject: 'Confirm Your Email Address',
      text: `
      <p>Thank you for registering! Please click the following link to confirm your email:</p>
      <a href="https://gradgigs.com/confirm-email?token=${token}">Confirm Email</a>
    `,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.log('Error while sending email : ' + error);
  }
};

export function generateUsername(fullName?: string): string {
  if (!fullName) {
    const randomUsername = Math.random().toString(36).substring(7);
    return `${randomUsername}`;
  }

  // Remove spaces from the full name
  const sanitizedFullName = fullName.replace(/\s/g, '');

  // Add 1-2 random digits to the end
  const randomDigits = Math.floor(Math.random() * 90) + 10;

  // Combine the modified name with random digits
  const finalUsername = `${sanitizedFullName}${randomDigits}`;

  return finalUsername;
}
