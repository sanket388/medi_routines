// import the config file to get the smtp configuration for nodemailer
const config = require('../configs/config');
// import nodemailer to send emails
const nodemailer = require('nodemailer');

// class to represent errors related to email service
class EmailServiceError extends Error {
    constructor(message, errorCode) {
      super(message);
      this.code = errorCode;
    }
  }

// create a nodemailer transporter using the smtp configuration from the config file
const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    auth: {
        user: config.smtpUser,
        pass: config.smtpPass
    }
});

// function to send email using nodemailer, throws EmailServiceError in case of any error
const sendEmail = async (to, subject, html) =>
{
    try
    {
        console.log("EmailService :: sendEmail :: sending email to ", to);
        console.log("EmailService :: sendEmail :: subject ", subject);
        console.log("EmailService :: sendEmail :: html ", html);
        const info = await transporter.sendMail({
            from: 'MediRoutines <noreply@sanketgupta.tech>',
            to,
            subject,
            html
        });
        
        console.log("EmailService :: sendEmail :: email sent successfully", info.messageId);
        return info;

    }
    catch (error)
    {
        console.error("EmailService :: sendEmail :: ", error);
        throw new EmailServiceError("Failed to send email", 500);
    }
};

module.exports = {
    EmailServiceError,
    sendEmail
};