import transporter from './mailer.js';

const sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

export default sendMail;