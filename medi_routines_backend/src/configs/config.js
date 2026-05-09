// load the environment variables from the .env file
require('dotenv').config();

const config = {
    mongoDbConnection: String(process.env.MONGODB_CONNECTION),
    jwtSecret: String(process.env.JWT_SECRET),
    nodeEnv: String(process.env.NODE_ENV),
    port: String(process.env.PORT),
    frontendUrl: String(process.env.FRONTEND_URL),
    smtpHost: String(process.env.SMTP_HOST),
    smtpPort: Number(process.env.SMTP_PORT),
    smtpUser: String(process.env.SMTP_USER),
    smtpPass: String(process.env.SMTP_PASS)
};

module.exports = config;