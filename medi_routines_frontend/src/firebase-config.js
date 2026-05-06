// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// for messaging
import {getMessaging, getToken as getFCMTOken, onMessage} from "firebase/messaging"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcCaL_eNp3GALc9_pWkWM78Ibjq9AYjII",
  authDomain: "mediroutines-1967f.firebaseapp.com",
  projectId: "mediroutines-1967f",
  storageBucket: "mediroutines-1967f.firebasestorage.app",
  messagingSenderId: "231176824597",
  appId: "1:231176824597:web:93c164dbc240240f2aeb1c",
  measurementId: "G-Z0Y321VL0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

let messagingInstance;
// check if messaging supported
if(typeof window !== 'undefined' && typeof window.navigator !== 'undefined')
{
    try
    {
        messagingInstance = getMessaging(app);
    }
    catch(err)
    {
        console.log("Failed to initialize firebase messaging for frontend: ", err);
    }
}
else
{
    console.warn("Firebase cannot be initialized, not in a browser environment");
}

export {
    app,
    messagingInstance,
    getFCMTOken,
    onMessage
};