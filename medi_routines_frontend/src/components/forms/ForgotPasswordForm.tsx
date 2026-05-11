import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import authService from "../../services/authService";
import { handleErrorsBeforeLogin } from "../../utils/errors/handlers";
import InputBox from "../input/InputBox";
import InputError from "../input/InputError";
import Button from "../input/Button";
import SimpleLink from "../ui/SimpleLink";

interface ForgotPasswordData
{
    email: string;
}

function ForgotPasswordForm()
{
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordData>();

    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const onSubmit = useCallback((data: ForgotPasswordData) =>
    {
        setSubmitLoading(true);

        authService
        .forgotPassword(data.email)
        .then((resp) =>
        {
            toast.success(resp.message);
            navigate("/auth/login");
        })
        .catch((err: Error) =>
        {
            console.log(err);
            handleErrorsBeforeLogin(err);
        })
        .finally(() =>
        {
            setSubmitLoading(false);
        });
    }, [navigate]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <p className="text-sm text-gray-600">
                Enter your registered email and, if the account is eligible, we&apos;ll send a password reset link.
            </p>

            <InputBox
                type='text'
                label='Email'
                placeholder='Your email'
                {...register("email", {
                    required: true,
                    pattern: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
                })}
            />
            {errors.email && <InputError>Please enter a valid email</InputError>}

            <Button
                type='submit'
                loading={submitLoading}
                className="w-full"
            >
                {submitLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center mt-4">
                <SimpleLink to='/auth/login'>
                    Back to Login
                </SimpleLink>
            </div>

        </form>
    );
}

export default ForgotPasswordForm;
