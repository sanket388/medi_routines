import { messagingInstance, getFCMTOken } from '../firebase-config';
import config from "../configs/config";
import {InvalidDataError, NetworkError, UnknownError} from "../utils/errors/sharedErrors";
import { InvalidCredentialsError } from "../utils/errors/userErrors";

export const requestNotificationPermission = async (userAuthToken) =>
{
    if (!messagingInstance)
    {
        console.warn("Firebase messaging not initialized or not supported. Cannot request permission.");
        return null;
    }

    try
    {
        const permission = await Notification.requestPermission(); // Standard browser API
        if (permission === 'granted') {
            console.log('Notification permission granted.');

            const vapidKey = "BE4kc2V6MFsQPlHUh2i0IwcLdgO9e2CoTOsNPuAiqhUeo00ZUEWcxyhNOEJyqcCGWLlN0GIrfjYwfrgO8kPnyDs";

            const fcmToken = await getFCMTOken(messagingInstance, { vapidKey: vapidKey });

            if (fcmToken)
            {
                // console.log('FCM Token:', fcmToken);
                // Send this token to your backend
                await sendTokenToBackend(fcmToken, userAuthToken);
                return fcmToken;
            } else {
                console.log('No registration token available. This can happen if permission was just granted and the service worker is not yet active, or if notifications are blocked at a higher level.');
                return null;
            }
        } else {
            console.log('Notification permission denied by user.');
            return null;
        }
    } catch (err) {
        console.error('Error during notification permission or token retrieval:', err);
        if (err.code === 'messaging/notifications-blocked' || err.code === 'messaging/permission-blocked') {
            alert('Notification permission was blocked. Please enable it in your browser settings for this site.');
        } else if (err.code === 'messaging/failed-serviceworker-registration') {
            alert('Failed to register the notification service worker. Please ensure your browser supports service workers and try again. Check console for details.');
        }
        return null;
    }
};

const sendTokenToBackend = async (fcmToken, userAuthToken) =>
{
    if (!fcmToken || !userAuthToken) return;
    let response;
    try
    {
        
        response = await fetch(`${config.baseUrl}/api/user/register-fcm-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userAuthToken}`
            },
            body: JSON.stringify({fcmToken})
        });
        
    }
    catch (error)
    {
        throw new NetworkError("Please check your connection");
    }

    if(response.status === 401)
    {
        throw new InvalidCredentialsError("Invalid credentials");
    }

    if(response.status === 422)
    {
        throw new InvalidDataError("Invalid data sent");
    }

    if(response.status != 200)
    {
        throw new UnknownError("Unknown error occured");
    }

};