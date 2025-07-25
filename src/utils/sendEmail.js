// src/utils/sendEmail.js
import emailjs from '@emailjs/browser';

const SERVICE_ID = 'your_service_id';
const TEMPLATE_ID = 'your_template_id';
const PUBLIC_KEY = 'your_public_key';

export const sendEmailNotification = async ({ toEmail, subject, message }) => {
  try {
    const templateParams = {
      to_email: toEmail,
      subject,
      message,
    };

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('✅ Email sent:', result.status);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};
