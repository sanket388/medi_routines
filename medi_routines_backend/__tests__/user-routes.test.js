const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { signup, login, signupAndLogin, verifyEmail, getVerificationToken } = require('../test-helpers/auth-helper');
const User = require('../src/models/User');
const EmailVerificationToken = require('../src/models/EmailVerificationToken');

let mongoServer;

// before all tests, create a new in-memory MongoDB server
// and connect to it
beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
    process.env.MONGODB_CONNECTION = mongoServer.getUri();
    await mongoose.connect(process.env.MONGODB_CONNECTION, { dbName: "test" });
    // log the users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log("Users in the database: ", users);
});

// after all tests, disconnect from the in-memory MongoDB server
// and stop the server
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// before each test, clear the database
beforeEach(async()=>
{
    await mongoose.connection.db.dropDatabase();
})

const app = require('../app');

describe('User Routes', () => {
    it('should signup a user', async () => {
        const res = await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res.statusCode).toBe(201);
    });

    it('should not signup with existing email', async () => {
        const res1 = await signup(app, {
                name: "Test User",
                email: "test2@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        
        // 1st user should be created successfully
        expect(res1.statusCode).toBe(201);
        
        // 2nd user should not be created
        // with the same email
        const res = await signup(app, {
                name: "Test User",
                email: "test2@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res.statusCode).toBe(409);
    });

    // more tests:
    // 1. should not signup with incomplete data
    it('should not signup with incomplete data', async () => {
        const res = await request(app)
            .post('/api/user/signup')
            .send({
                name: "Test User",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty('message', 'Invalid inputs passed, please check your data.');
    });

    // 2. should not signup with invalid email
    it('should not signup with invalid email', async () => {
        const res = await signup(app, {
                name: "Test User",
                email: "testexample.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty('message', 'Invalid inputs passed, please check your data.');
    });

    // now test login
    it('should login a user', async () => {
        const token = await signupAndLogin(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        console.log("Token: ", token);
    });

    // should not login with incorrect body
    it('should not login with incorrect body', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({
                name: "test@example.com",
                password: "password123"
            });
        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty('message', 'Invalid inputs, please try again.');
    });

    // should not login with incorrect email
    it('should not login with incorrect email', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({
                email: "test1@example.com",
                password: "password123"
            });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Incorrect credentials');
    });

    // correct email but incorrect password
    it('should not login with incorrect password', async () => {
        const res1 = await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res1.statusCode).toBe(201);

        // verify email
        const verificationToken = await getVerificationToken("test@example.com");
        const resVerification = await verifyEmail(app, verificationToken);

        const res2 = await login(app, "test@example.com", "wrongpassword");
        expect(res2.statusCode).toBe(401);
        expect(res2.body).toHaveProperty('message', 'Incorrect credentials');
    });

    // test get user
    it('should get user details', async () => {
        const token = await signupAndLogin(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        console.log("Token: ", token);

        const res3 = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res3.statusCode).toBe(200);
        expect(res3.body).toHaveProperty('user');
        expect(res3.body.user).toHaveProperty('name', 'Test User');
        expect(res3.body.user).toHaveProperty('email', 'test@example.com');
        expect(res3.body.user).toHaveProperty('timezone', 'Asia/Kolkata');
        expect(res3.body.user).not.toHaveProperty('password');
        expect(res3.body.user).toHaveProperty('id');
    });

    // test get user without authorization header
    it('should not get user details without authorization header', async () => {
        const res = await request(app)
            .get('/api/user');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Authorization header is missing');
    });

    // test get user without token
    it('should not get user details without token', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', 'Bearer ');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is missing');
    });

    // test get user with invalid token
    it('should not get user details with invalid token', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is invalid');
    });

    // testcases for verify-email
    // 1. incorrect token sent, should get 400
    it('should not verify email with incorrect token', async () => {
        const res = await request(app)
            .post('/api/user/verify-email')
            .send({ token: 'incorrecttoken' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid or already used verification link.');
    });

    // 2. should not be able to reuse the same token
    it('should not verify email with already used token', async () => {
        await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        const token = await getVerificationToken("test@example.com");
        // Use the token to verify email
        const res1 = await request(app)
            .post('/api/user/verify-email')
            .send({ token });
        expect(res1.statusCode).toBe(200);
        expect(res1.body).toHaveProperty('message', 'Email verified successfully.');
        // Try to reuse the same token
        const res2 = await request(app)
            .post('/api/user/verify-email')
            .send({ token });
        expect(res2.statusCode).toBe(400);
        expect(res2.body).toHaveProperty('message', 'Invalid or already used verification link.');
    });

    // 3. should not verify email with expired token
    it('should not verify email with expired token', async () => {
        await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        // manually set the token to be expired
        const user = await User.findOne({ email: "test@example.com" });
        const token = await EmailVerificationToken.findOne({ userId: user._id });
        token.expiresAt = new Date() - 3600000; // Set expiration date to past (1 hour ago)
        await token.save();
        // Try to verify email with expired token
        const res = await verifyEmail(app, token.token);
        expect(res.statusCode).toBe(410);
        expect(res.body).toHaveProperty('message', 'Verification link has expired. Please request a new one.');
        // also check that the token is deleted from the database
        const tokenInDb = await EmailVerificationToken.findOne({ userId: user._id });
        expect(tokenInDb).toBeNull();
    });

    // 4. correct token should verify email successfully
    it('should verify email with correct token', async () => {
        await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        const token = await getVerificationToken("test@example.com");
        const res = await verifyEmail(app, token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Email verified successfully.');
        // also check that the token is deleted from the database
        const user = await User.findOne({ email: "test@example.com" });
        expect(user.isEmailVerified).toBe(true);
        const tokenInDb = await EmailVerificationToken.findOne({ userId: user._id });
        expect(tokenInDb).toBeNull();
    });

    // more testcases for login
    // 1. should not login if email is not verified
    it('should not login if email is not verified', async () => {
        const res1 = await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        expect(res1.statusCode).toBe(201);

        const res2 = await login(app, "test@example.com", "password123");
        expect(res2.statusCode).toBe(403);
        expect(res2.body).toHaveProperty('message', 'Please verify your email before logging in.');
    });

    // testcases for request-verification-link
    // 1. user does not exist, should give vague success message
    it('should give success message even if user does not exist when requesting verification link', async () => {
        const res = await request(app)
            .post('/api/user/request-verification-link')
            .send({ email: "nonexistent@example.com" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Verification link sent');
        // also check that no token is created in the database
        const tokenInDb = await EmailVerificationToken.findOne({}).exec();
        expect(tokenInDb).toBeNull();
    });

    // 2. user exists but email is already verified, should give vague success message
    it('should give success message even if email is already verified when requesting verification link', async () => {
        await signupAndLogin(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        const res = await request(app)
            .post('/api/user/request-verification-link')
            .send({ email: "test@example.com" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Verification link sent');
        // also check that no token is created in the database
        const tokenInDb = await EmailVerificationToken.findOne({}).exec();
        expect(tokenInDb).toBeNull();
    });

    // 3. user exists and email is not verified and token is expired, should create a new token and send email
    it('should create a new token and send email if user exists and email is not verified and token is expired when requesting verification link', async () => {
        await signup(app, {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                timezone: "Asia/Kolkata"
            });
        // manually set the token to be expired
        const user = await User.findOne({ email: "test@example.com" });
        const token = await EmailVerificationToken.findOne({ userId: user._id });
        token.expiresAt = new Date() - 24 * 60 * 60 * 1000; // Set expiration date to past
        await token.save();
        const res = await request(app)
            .post('/api/user/request-verification-link')
            .send({ email: "test@example.com" });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Verification link sent');
        // also check that a new token is created in the database
        const newTokenInDb = await EmailVerificationToken.findOne({ userId: user._id }).exec();
        expect(newTokenInDb).not.toBeNull();
        expect(newTokenInDb.token).not.toBe(token.token);
        // also check that the old token is deleted from the database
        const oldTokenInDb = await EmailVerificationToken.findOne({ userId: user._id, token: token.token }).exec();
        expect(oldTokenInDb).toBeNull();
        // try to verify email with the new token
        const resVerify = await verifyEmail(app, newTokenInDb.token);
        expect(resVerify.statusCode).toBe(200);
        expect(resVerify.body).toHaveProperty('message', 'Email verified successfully.');
        // try to login after verification
        const resLogin = await login(app, "test@example.com", "password123");
        expect(resLogin.statusCode).toBe(200);
        expect(resLogin.body).toHaveProperty('token');
    });
});