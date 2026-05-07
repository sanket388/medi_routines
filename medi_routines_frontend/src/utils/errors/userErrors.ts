// user already exists
class UserExistsError extends Error
{
    constructor(message:string)
    {
        super(message);
    }
}

// user not found
class UserNotFoundError extends Error
{
    constructor(message:string)
    {
        super(message);
    }
}

// invalid credentials
class InvalidCredentialsError extends Error
{
    constructor(message:string)
    {
        super(message);
    }
}
// invalid or already-used verification token (400)
class EmailVerificationError extends Error
{
    constructor(message: string)
    {
        super(message);
    }
}

// expired verification token (410)
class EmailVerificationExpiredError extends Error
{
    constructor(message: string)
    {
        super(message);
    }
}

export {
    UserExistsError,
    UserNotFoundError,
    InvalidCredentialsError,
    EmailVerificationError,
    EmailVerificationExpiredError,
};