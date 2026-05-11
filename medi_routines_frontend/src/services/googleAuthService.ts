import config from '../configs/config';
import { NetworkError, UnknownError } from '../utils/errors/sharedErrors';

interface GoogleSigninRequest
{
    idToken: string;
    timezone: string;
}

interface GoogleSigninResponse
{
    token: string;
}

class GoogleAuthService
{
    async googleSignin(data: GoogleSigninRequest): Promise<GoogleSigninResponse>
    {
        let response: Response;
        try
        {
            response = await fetch(`${config.baseUrl}/api/user/google-signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        catch (error)
        {
            throw new NetworkError('Please check your internet connection and try again.');
        }

        if (response.status !== 200)
        {
            throw new UnknownError('Google sign in failed. Please try again.');
        }

        return (await response.json()) as GoogleSigninResponse;
    }
}

export default new GoogleAuthService();