import toast from "react-hot-toast";
import { NetworkError, InvalidDataError, UnknownError } from "./sharedErrors";
import { InvalidCredentialsError, UserExistsError, UserNotFoundError, EmailNotVerifiedError } from "./userErrors";
import { MedicineNotFoundError, RoutineNotFoundError } from "./routineErrors";
import { TakenAlreadyExistsError } from "./takenErrors";
import { RoutineExistsWhileDeletingMedicineError } from "./medicineErrors";

// Error messages
const NETWORK_ERROR = "Network error. Please check your internet connection.";
const UNKNOWN_ERROR = "An unknown error occurred. Please try again later.";
const INVALID_DATA_ERROR = "Invalid data. Please check your inputs and try again.";
const EMAIL_ALREADY_EXISTS = "Email already exists. Please try another email or login.";
const EMAIL_NOT_FOUND = "User not found. Please try another email or register.";
const INVALID_CREDENTIALS = "Invalid credentials. Please try again.";
const SESSION_EXPIRED = "Session expired. Please login again.";
const MEDICINE_NOT_FOUND = "Some medicines could not be found.";
const ROUTINE_NOT_FOUND = "Routine not found.";
const TAKEN_ALREADY_EXISTS = "This medicine has already been marked as taken.";
const ROUTINE_EXISTS_WHILE_DELETING_MEDICINE = "Cannot delete medicine as it is used in one or more routines.";
const EMAIL_NOT_VERIFIED = "Email not verified. Please verify your email or request a new link.";

// For errors before login (signup, login, etc.)
function handleErrorsBeforeLogin(error: unknown) {
    if (error instanceof NetworkError) {
        toast.error(NETWORK_ERROR);
    } else if (error instanceof InvalidDataError) {
        toast.error(INVALID_DATA_ERROR);
    } else if (error instanceof UserExistsError) {
        toast.error(EMAIL_ALREADY_EXISTS);
    } else if (error instanceof UserNotFoundError) {
        toast.error(EMAIL_NOT_FOUND);
    } else if (error instanceof InvalidCredentialsError) {
        toast.error(INVALID_CREDENTIALS);
    } else if (error instanceof EmailNotVerifiedError) {
        toast.error(EMAIL_NOT_VERIFIED);
    } else if (error instanceof UnknownError) {
        toast.error(UNKNOWN_ERROR);
    } else {
        toast.error(UNKNOWN_ERROR);
    }
}

// For errors after login (protected routes, routines, medicines, etc.)
function handleErrorsAfterLogin(error: unknown, navigate: (path: string) => void) {
    if (error instanceof NetworkError) {
        toast.error(NETWORK_ERROR);
    } else if (error instanceof InvalidCredentialsError) {
        toast.error(SESSION_EXPIRED);
        navigate("/auth/login");
    } else if (error instanceof InvalidDataError) {
        toast.error(INVALID_DATA_ERROR);
    } else if (error instanceof MedicineNotFoundError) {
        toast.error(MEDICINE_NOT_FOUND);
    } else if (error instanceof RoutineNotFoundError) {
        toast.error(ROUTINE_NOT_FOUND);
    } else if (error instanceof RoutineExistsWhileDeletingMedicineError) {
        toast.error(ROUTINE_EXISTS_WHILE_DELETING_MEDICINE);
    } else if (error instanceof TakenAlreadyExistsError) {
        toast.error(TAKEN_ALREADY_EXISTS);
    } else if (error instanceof UnknownError) {
        toast.error(UNKNOWN_ERROR);
    } else {
        toast.error(UNKNOWN_ERROR);
    }
}

export { handleErrorsBeforeLogin, handleErrorsAfterLogin };