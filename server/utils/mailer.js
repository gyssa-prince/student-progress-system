import 'dotenv/config';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer connection error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

export default transporter;