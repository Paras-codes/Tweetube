import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
 try {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  });
 } catch (error) {
  console.log("Error sending email:", error);
  throw new Error('Email sending failed' + error.message);
 }
  
}
export default sendEmail;