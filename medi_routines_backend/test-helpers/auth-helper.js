const request = require('supertest');
const User = require('../src/models/User');
const EmailVerificationToken = require('../src/models/EmailVerificationToken');
const ForgotPasswordToken = require('../src/models/ForgotPasswordToken');


async function signup(app, userData = {}) {
    const defaultData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        timezone: "Asia/Kolkata"
    };
    const finalData = { ...defaultData, ...userData };
    const res = await request(app)
        .post('/api/user/signup')
        .send(finalData);
    return res;
}

async function getVerificationToken(email) {
    // get the verification token from the database itself
    // get the user id first
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error(`User not found for email: ${email}`);
    }
    // get the verification token
    const tokenDoc = await EmailVerificationToken.findOne({ userId: user._id });
    if (!tokenDoc) {
        throw new Error(`Verification token not found for user: ${user._id}`);
    }
    return tokenDoc.token;
}

async function verifyEmail(app, token) {
    const res = await request(app)
        .post('/api/user/verify-email')
        .send({ token });
    return res;
}

async function getForgotPasswordToken(email) {
    // get the forgot password token from the database itself
    // get the user id first
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error(`User not found for email: ${email}`);
    }

    // get the forgot password token
    const tokenDoc = await ForgotPasswordToken.findOne({ userId: user._id });
    if (!tokenDoc) {
        throw new Error(`Forgot password token not found for user: ${user._id}`);
    }

    return tokenDoc.token;
}

async function login(app, email, password) {
    const res = await request(app)
        .post('/api/user/login')
        .send({ email, password });
    return res;
}

// convenience helper for tests that just need a logged-in verified user
async function signupAndLogin(app, userData = {}) {
    const defaultData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        timezone: "Asia/Kolkata"
    };
    const finalData = { ...defaultData, ...userData };
    await signup(app, finalData);
    const token = await getVerificationToken(finalData.email);
    const verifyRes = await verifyEmail(app, token);
    expect(verifyRes.statusCode).toBe(200);
    const loginRes = await login(app, finalData.email, finalData.password);
    expect(loginRes.body).toHaveProperty('token');
    return loginRes.body.token;
}

module.exports = {
    signup,
    getVerificationToken,
    getForgotPasswordToken,
    verifyEmail,
    login,
    signupAndLogin
};