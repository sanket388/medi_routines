import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import authService from '../../services/authService';
import { EmailVerificationExpiredError } from '../../utils/errors/userErrors';
import { NetworkError } from '../../utils/errors/sharedErrors';
import SimpleLink from '../ui/SimpleLink';

// States: 'verifying' | 'success' | 'invalid' | 'expired' | 'error'
type VerifyState = 'verifying' | 'success' | 'invalid' | 'expired' | 'error';

function VerifyEmailPage()
{
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [state, setState] = useState<VerifyState>('verifying');

    useEffect(() =>
    {
        // get the token from query params
        const token = searchParams.get('token');

        if (!token)
        {
            setState('invalid');
            return;
        }

        // use the service to verify email
        authService
        .verifyEmail(token)
        .then(() =>
        {
            setState('success');
            // redirect to login after 2s
            setTimeout(() => navigate('/auth/login'), 2000);
        })
        .catch((err: Error) =>
        {
            console.log(err);
            if (err instanceof EmailVerificationExpiredError)
            {
                setState('expired');
            }
            else if (err instanceof NetworkError)
            {
                setState('error');
            }
            else
            {
                setState('invalid');
            }
        });
    }, []);
    // empty dependency array to run only on mount
    // and like always, this effect is used to synchronize with an external system, without the user having to do anything

    return (
        <div className="max-w-md mx-auto p-8 text-center">

            {state === 'verifying' && (
                <>
                    <p className="text-gray-500 text-lg">Verifying your email…</p>
                </>
            )}

            {state === 'success' && (
                <>
                    <h2 className="text-2xl font-semibold text-green-600 mb-2">Email Verified!</h2>
                    <p className="text-gray-500">Redirecting you to login…</p>
                </>
            )}

            {state === 'expired' && (
                <>
                    <h2 className="text-2xl font-semibold text-red-500 mb-2">Link Expired</h2>
                    <p className="text-gray-500 mb-4">Your verification link has expired.</p>
                    <SimpleLink to="/auth/request-verification-link">
                        Request a new verification link
                    </SimpleLink>
                </>
            )}

            {state === 'invalid' && (
                <>
                    <h2 className="text-2xl font-semibold text-red-500 mb-2">Invalid Link</h2>
                    <p className="text-gray-500 mb-4">
                        This verification link is invalid or has already been used.
                    </p>
                    <SimpleLink to="/auth/login">
                        Go to Login
                    </SimpleLink>
                </>
            )}

            {state === 'error' && (
                <>
                    <h2 className="text-2xl font-semibold text-yellow-600 mb-2">Something went wrong</h2>
                    <p className="text-gray-500 mb-4">
                        Please check your internet connection and try again.
                    </p>
                    <SimpleLink to="/auth/login">
                        Go to Login
                    </SimpleLink>
                </>
            )}

        </div>
    );
}

export default VerifyEmailPage;
