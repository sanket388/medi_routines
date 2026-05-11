import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import authService from "../../services/authService";
import { useNavigate } from "react-router";
import { handleErrorsBeforeLogin } from "../../utils/errors/handlers";
import InputBox from "../input/InputBox";
import InputError from "../input/InputError";
import Button from "../input/Button";
import SimpleLink from "../ui/SimpleLink";
import toast from "react-hot-toast";

interface RequestVerificationLinkData {
    email: string;
}

function RequestVerificationLinkForm()
{
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RequestVerificationLinkData>();

    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const onSubmit = useCallback((data: RequestVerificationLinkData) =>
    {
        setSubmitLoading(true);

        authService
        .requestVerificationLink(data.email)
        .then((resp) =>
        {
            // success, show toast and navigate back to login
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
                {submitLoading ? "Sending..." : "Send Verification Link"}
            </Button>

            <div className="text-center mt-4">
                <SimpleLink to='/auth/login'>
                    Back to Login
                </SimpleLink>
            </div>

        </form>
    );
}

export default RequestVerificationLinkForm;
