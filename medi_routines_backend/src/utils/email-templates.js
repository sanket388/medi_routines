// will have templates for all emails sent by the system (verification, password reset, etc.)

// template for email verification email
const verificationEmailTemplate = (verificationUrl) =>
{
    return `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px;">
            <h2 style="color: #3b82f6;">Verify your email</h2>
            <p>Thanks for signing up for MediRoutines! Click the button below to verify your email address.</p>
            <a href="${verificationUrl}"
               style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
                Verify Email
            </a>
            <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you did not sign up, you can safely ignore this email.</p>
        </div>
    `;
}

// template for forgot password email
const forgotPasswordEmailTemplate = (resetUrl) =>
{
    return `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px;">
            <h2 style="color: #3b82f6;">Reset your password</h2>
            <p>We received a request to reset your MediRoutines password. Click the button below to continue.</p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
                Reset Password
            </a>
            <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you did not request this, you can safely ignore this email.</p>
        </div>
    `;
}

module.exports = {
    verificationEmailTemplate,
    forgotPasswordEmailTemplate
}