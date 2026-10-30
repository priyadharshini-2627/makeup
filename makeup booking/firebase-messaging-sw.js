importScripts(
    "https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js"
);


// Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyDgN9gATpaucdEEBZ9HVvJ4a-GuJasKjs",
    authDomain: "priya-makeup-artist-796e2.firebaseapp.com",
    projectId: "priya-makeup-artist-796e2",
    storageBucket: "priya-makeup-artist-796e2.firebasestorage.app",
    messagingSenderId: "831343231953",
    appId: "1:831343231953:web:d6437b93fa233885ee5e60",
    measurementId: "G-EDYY9PZJNS"
};


// Initialize Firebase

firebase.initializeApp(firebaseConfig);


// Initialize Firebase Messaging

const messaging = firebase.messaging();


// Receive background notification

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Background message:",
        payload
    );

    const notificationTitle =
        payload.notification?.title || "New Booking";

    const notificationOptions = {

        body:
            payload.notification?.body ||
            "You have received a new booking.",

        icon: "/favicon.ico"

    };


    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );

});