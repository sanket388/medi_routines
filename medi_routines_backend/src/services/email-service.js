// import 3rd party service used to send email
const {Resend} = require('resend')
// import the config file to get the api key
const config = require('../configs/config');

// setup resend
const resend = new Resend(config.resendApiKey);

// class to represent errors related to email service
class EmailServiceError extends Error {
    constructor(message, errorCode) {
      super(message);
      this.code = errorCode;
    }
  }

// function to send email using resend, throws EmailServiceError in case of any error
const sendEmail = async (to, subject, html) =>
{
    try
    {
        console.log("EmailService :: sendEmail :: sending email to ", to);
        console.log("EmailService :: sendEmail :: subject ", subject);
        console.log("EmailService :: sendEmail :: html ", html);
        const {data, error} = await resend.emails.send({
            from: 'MediRoutines <noreply@sanketgupta.tech>',
            to,
            subject,
            html
        });
        
        if (error)
        {
            console.error("EmailService :: sendEmail :: ", error);
            throw new EmailServiceError(error.message, error.statusCode);
        }
        console.log("EmailService :: sendEmail :: email sent successfully", data.id);
        return data;

    }
    catch (error)
    {
        console.error("EmailService :: sendEmail :: ", error);
        if (error instanceof EmailServiceError)
        {
            throw error;
        }
        throw new EmailServiceError("Failed to send email", 500);
    }
};

module.exports = {
    EmailServiceError,
    sendEmail
};