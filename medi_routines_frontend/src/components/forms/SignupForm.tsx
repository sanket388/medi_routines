import { useCallback, useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import authService, { type SignupRequest } from '../../services/authService';
import { useNavigate } from 'react-router';
import { handleErrorsBeforeLogin } from '../../utils/errors/handlers';
import useTimezones from '../../hooks/useTimezones';
import InputBox from '../input/InputBox';
import InputError from '../input/InputError';
import SelectInput from '../input/SelectInput';
import Button from '../input/Button';
import SimpleLink from '../ui/SimpleLink';
import toast from 'react-hot-toast';

// this component will handle the signup process
// fields will be:
// name
// email
// password
// confirm password

interface SignupData extends SignupRequest
{
    confirmPassword: string;
}

function SignupForm()
{

    // react hook form
    const {
        register,
        handleSubmit,
        formState: {errors},
        getValues
    } = useForm<SignupData>();

    // submit loading state
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);

    // navigate
    const navigate = useNavigate();

    // function to handle signup
    const onSubmit: SubmitHandler<SignupData> = useCallback((signupData)=>
    {

        // set submit loading
        setSubmitLoading(true);

        authService
        .signup(signupData)
        .then(()=>
        {
            // successfully signed up
            // show a toast that email verification link has been sent and go to login page
            toast.success('Verification link sent! Please check your email to verify your account.');
            navigate("/auth/login");
        })
        .catch((err: Error)=>
        {
            console.log(err);
            // handle error
            handleErrorsBeforeLogin(err);
        })
        .finally(()=>
        {
            // stop loading
            setSubmitLoading(false);
        })

    }, [setSubmitLoading, navigate]);

    // effect for fetching the timezones
    const [timezonesLoading, timezones, timezoneError] = useTimezones();
    useEffect(()=>
    {

        if(!timezonesLoading)
        {
            // loading finished
            if(timezoneError!=null)
            {
                // error
                console.log(timezoneError);
                handleErrorsBeforeLogin(timezoneError);
            }
            else
            {
                // data fetched
            }
        }

    }, [timezonesLoading]);    // conditionally render
    if(timezonesLoading)
    {
        return (
            <div className="flex justify-center items-center min-h-[200px] text-gray-600">Loading...</div>
        );
    }

    return (

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* name field */}
            <InputBox
                type='text'
                label='Name'
                placeholder='Your name'
                {...register("name", {required: true})}
            />
            {errors.name && <InputError>Please enter your name</InputError>}

            {/* email field */}
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

            {/* password field */}
            <InputBox
                type='password'
                label='Password'
                placeholder='Password'
                {...register("password", {
                    required: true,
                    
                })}
            />
            {errors.password && <InputError>Please enter password</InputError>}

            {/* confirm password field */}
            <InputBox
                type='password'
                label='Confirm Password'
                placeholder='Confirm Password'
                {...register("confirmPassword", {
                    required: true,
                    validate: (value)=>
                    {
                        return (value==getValues("password"));
                    }
                })}
            />
            {errors.confirmPassword && <InputError>Password and confirm password do not match</InputError>}

            {/* select for timezones */}
            <SelectInput
                label='Timezone'
                options={timezones.map((tz)=>
                    ({ value: tz, label: tz })
                )}
                {...register("timezone", {
                    required: true
                })}
            />
            {errors.timezone && <InputError>Please select timezone</InputError>}

            {/* submit button */}
            <Button
                type='submit'
                loading={submitLoading}
                className="w-full"
            >
                {submitLoading?"Signing up...":"Signup!"}
            </Button>

            {/* simplelink to login */}
            <div className="text-center mt-4">
                <SimpleLink
                    to="/auth/login"
                >
                    Already have an account? Login here
                </SimpleLink>
            </div>

        </form>

    );
}

export default SignupForm;