import ForgotPasswordForm from "../forms/ForgotPasswordForm";

function ForgotPasswordPage()
{
    return (
        <>
            <div className="max-w-md mx-auto p-4">
                <h2 className="text-2xl font-semibold mb-6">Forgot Password</h2>
                <ForgotPasswordForm />
            </div>
        </>
    );
}

export default ForgotPasswordPage;
