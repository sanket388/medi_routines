import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import { handleErrorsBeforeLogin } from "../../utils/errors/handlers";
import { PasswordResetError, PasswordResetExpiredError } from "../../utils/errors/userErrors";
import InputBox from "../input/InputBox";
import InputError from "../input/InputError";
import Button from "../input/Button";
import SimpleLink from "../ui/SimpleLink";

interface ChangePasswordData
{
    newPassword: string;
    confirmPassword: string;
}

interface ChangePasswordFormProps
{
    token: string;
}

function ChangePasswordForm({ token }: ChangePasswordFormProps)
{
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ChangePasswordData>();

    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [resetState, setResetState] = useState<'form' | 'invalid' | 'expired'>('form');
    const navigate = useNavigate();
    const newPasswordValue = watch("newPassword");

    const onSubmit = useCallback((data: ChangePasswordData) =>
    {
        setSubmitLoading(true);

        authService
        .changePassword({
            token,
            newPassword: data.newPassword
        })
        .then((resp) =>
        {
            toast.success(resp.message);
            navigate("/auth/login");
        })
        .catch((err: Error) =>
        {
            console.log(err);

            if (err instanceof PasswordResetExpiredError)
            {
                setResetState('expired');
            }
            else if (err instanceof PasswordResetError)
            {
                setResetState('invalid');
            }

            handleErrorsBeforeLogin(err);
        })
        .finally(() =>
        {
            setSubmitLoading(false);
        });
    }, [navigate, token]);

    if (resetState === 'expired')
    {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">
                    This password reset link has expired.
                </p>
                <SimpleLink to="/auth/forgot-password">
                    Request a new password reset link
                </SimpleLink>
            </div>
        );
    }

    if (resetState === 'invalid')
    {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">
                    This password reset link is invalid or has already been used.
                </p>
                <SimpleLink to="/auth/forgot-password">
                    Request a new password reset link
                </SimpleLink>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <p className="text-sm text-gray-600">
                Choose a new password for your account. You&apos;ll need to log in again after resetting it.
            </p>

            <InputBox
                type='password'
                label='New Password'
                placeholder='New password'
                {...register("newPassword", {
                    required: true,
                    minLength: 6
                })}
            />
            {errors.newPassword?.type === 'required' && <InputError>Please enter a new password</InputError>}
            {errors.newPassword?.type === 'minLength' && <InputError>Password must be at least 6 characters</InputError>}

            <InputBox
                type='password'
                label='Confirm Password'
                placeholder='Confirm new password'
                {...register("confirmPassword", {
                    required: true,
                    validate: (value) => value === newPasswordValue
                })}
            />
            {errors.confirmPassword?.type === 'required' && <InputError>Please confirm your new password</InputError>}
            {errors.confirmPassword?.type === 'validate' && <InputError>Passwords do not match</InputError>}

            <Button
                type='submit'
                loading={submitLoading}
                className="w-full"
            >
                {submitLoading ? "Updating..." : "Change Password"}
            </Button>

            <div className="text-center mt-4">
                <SimpleLink to='/auth/login'>
                    Back to Login
                </SimpleLink>
            </div>

        </form>
    );
}

export default ChangePasswordForm;
