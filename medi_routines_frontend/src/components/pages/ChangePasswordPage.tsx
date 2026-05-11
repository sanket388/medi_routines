import { useSearchParams } from "react-router";
import ChangePasswordForm from "../forms/ChangePasswordForm";
import SimpleLink from "../ui/SimpleLink";

function ChangePasswordPage()
{
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    return (
        <>
            <div className="max-w-md mx-auto p-4">
                <h2 className="text-2xl font-semibold mb-6">Change Password</h2>

                {!token ? (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-gray-600">
                            This password reset link is invalid.
                        </p>
                        <SimpleLink to="/auth/forgot-password">
                            Request a new password reset link
                        </SimpleLink>
                    </div>
                ) : (
                    <ChangePasswordForm token={token} />
                )}
            </div>
        </>
    );
}

export default ChangePasswordPage;
