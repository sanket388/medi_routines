// load the environment variables from the .env file
require('dotenv').config();

const config = {
    mongoDbConnection: String(process.env.MONGODB_CONNECTION),
    jwtSecret: String(process.env.JWT_SECRET),
    nodeEnv: String(process.env.NODE_ENV),
    port: String(process.env.PORT),
    resendApiKey: String(process.env.RESEND_API_KEY),
    frontendUrl: String(process.env.FRONTEND_URL)
};

module.exports = config;