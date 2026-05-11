import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AuthLayout from './AuthLayout.tsx'
import SignupPage from './components/pages/SignupPage.tsx'
import LoginPage from './components/pages/LoginPage.tsx'
import VerifyEmailPage from './components/pages/VerifyEmailPage.tsx'
import RequestVerificationLinkPage from './components/pages/RequestVerificationLinkPage.tsx'
import ForgotPasswordPage from './components/pages/ForgotPasswordPage.tsx'
import ChangePasswordPage from './components/pages/ChangePasswordPage.tsx'
import AllUserDefinedMedicinesPage from './components/pages/AllUserDefinedMedicinesPage.tsx'
import CreateUserDefinedMedicinePage from './components/pages/CreateUserDefinedMedicinePage.tsx'
import AllRoutinesPage from './components/pages/AllRoutinesPage.tsx'
import CreateRoutinePage from './components/pages/CreateRoutinePage.tsx'
import RoutinePage from './components/pages/RoutinePage.tsx'
import UpcomingRoutinesPage from './components/pages/UpcomingRoutinesPage.tsx'
import { Provider } from 'react-redux'
import store from './store/store.ts'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* redux providrer */}
        <Provider store={store}>
            {/* routing */}
            <BrowserRouter>
                
                {/* configuring routes */}
                <Routes>
                    
                    {/* parent most component is App itself, fetches user's data if user is present on app load and login*/}
                    <Route path="/" element={<App />}>

                        {/* on the index, redirect to upcoming routines */}
                        <Route index element={<Navigate to={"/routines/upcoming"} replace/>} />

                        {/* on /auth, login is not required */}
                        <Route path="auth" element={<AuthLayout authRequired={false} />}>

                            <Route path="signup" element={<SignupPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="verify-email" element={<VerifyEmailPage />} />
                            <Route path="request-verification-link" element={<RequestVerificationLinkPage />} />
                            <Route path="forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="change-password" element={<ChangePasswordPage />} />

                        </Route>

                        {/* on the rest of the routes, login is required */}
                        <Route element={<AuthLayout authRequired={true} />}>

                            {/* user defined medicines routes */}
                            <Route path="medicines">

                                {/* all user defined medicines page */}
                                <Route index element={<AllUserDefinedMedicinesPage />} />
                                {/* create user defined medicine page */}
                                <Route path="create" element={<CreateUserDefinedMedicinePage />} />

                            </Route>

                            {/* routines routes */}
                            <Route path="routines">

                                {/* all routines page */}
                                <Route index element={<AllRoutinesPage />} />
                                {/* create routine page */}
                                <Route path="create" element={<CreateRoutinePage />} />
                                {/* one routine's page */}
                                <Route path=":routineIndex" element={<RoutinePage />} />
                                {/* upcoming routines page */}
                                <Route path="upcoming" element={<UpcomingRoutinesPage />} />

                            </Route>

                        </Route>

                    </Route>

                </Routes>

            </BrowserRouter>
        </Provider>
    </StrictMode>,
)
