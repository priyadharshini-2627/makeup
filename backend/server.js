
const http = require("node:http");
const fs = require("node:fs");

// Firebase Admin SDK
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

// Firebase service account
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin ONCE
initializeApp({
    credential: cert(serviceAccount)
});

const messaging = getMessaging();

const PORT = 3000;

const bookingFile = "bookings.json";
const tokenFile = "tokens.json";

// Create bookings.json if it doesn't exist
if (!fs.existsSync(bookingFile)) {
    fs.writeFileSync(bookingFile, "[]");
}

// Create tokens.json if it doesn't exist
if (!fs.existsSync(tokenFile)) {
    fs.writeFileSync(tokenFile, "[]");
}


// ================================
// SERVER
// ================================

const server = http.createServer((req, res) => {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, GET, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    // Browser preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }


    // ================================
    // SAVE FCM TOKEN
    // ================================

    if (req.method === "POST" && req.url === "/save-token") {

        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {

            try {

                const data = JSON.parse(body);

                if (!data.token) {

                    res.writeHead(400, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        success: false,
                        message: "FCM token missing."
                    }));

                    return;
                }


                // Read existing tokens
                const tokens = JSON.parse(
                    fs.readFileSync(tokenFile, "utf8")
                );


                // Add token only if it doesn't already exist
                if (!tokens.includes(data.token)) {

                    tokens.push(data.token);

                    fs.writeFileSync(
                        tokenFile,
                        JSON.stringify(tokens, null, 2)
                    );
                }


                console.log("✅ FCM token saved.");


                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    success: true,
                    message: "FCM token saved."
                }));

            }

            catch (error) {

                console.log("❌ Token error:", error);

                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid token data."
                }));
            }

        });

        return;
    }



    // ================================
    // BOOKING REQUEST
    // ================================

    if (req.method === "POST" && req.url === "/booking") {

        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });


        req.on("end", async () => {

            try {

                const booking = JSON.parse(body);


                // Read existing bookings
                const bookings = JSON.parse(
                    fs.readFileSync(bookingFile, "utf8")
                );


                // Check date
                const dateAlreadyBooked = bookings.some(
                    item => item.date === booking.date
                );


                if (dateAlreadyBooked) {

                    res.writeHead(409, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        success: false,
                        message:
                            "Sorry! This date is already booked. Please choose another date."
                    }));

                    return;
                }


                // Save booking
                bookings.push(booking);

                fs.writeFileSync(
                    bookingFile,
                    JSON.stringify(bookings, null, 2)
                );


                // ================================
                // TERMINAL BOOKING DETAILS
                // ================================

                console.log("");
                console.log("==============================");
                console.log("💄 NEW BOOKING CONFIRMED");
                console.log("==============================");

                console.log("Name:", booking.name);
                console.log("Phone:", booking.phone);
                console.log("Service:", booking.service);
                console.log("Package:", booking.packageName);
                console.log("Date:", booking.date);
                console.log("Location:", booking.location);
                console.log("Details:", booking.message);

                console.log("==============================");


                // ================================
                // SEND FCM NOTIFICATION
                // ================================

                try {

                    const tokens = JSON.parse(
                        fs.readFileSync(tokenFile, "utf8")
                    );


                    if (tokens.length > 0) {

                        console.log(
                            "🔔 Sending booking notification..."
                        );


                        const notificationPromises =
                            tokens.map(async (token) => {

                                try {

                                    await messaging.send({
                                        token: token,

                                        notification: {
                                            title: "💄 New Booking Received!",
                                            body:
                                                booking.name +
                                                " booked " +
                                                booking.service +
                                                " on " +
                                                booking.date
                                        },

                                        webpush: {
                                            notification: {
                                                title:
                                                    "💄 New Booking Received!",
                                                body:
                                                    booking.name +
                                                    " booked " +
                                                    booking.service +
                                                    " on " +
                                                    booking.date,
                                                icon: "/logo.png"
                                            }
                                        }
                                    });


                                    console.log(
                                        "✅ Notification sent."
                                    );

                                }

                                catch (error) {

                                    console.log(
                                        "❌ Notification failed:",
                                        error.message
                                    );
                                }

                            });


                        await Promise.all(
                            notificationPromises
                        );

                    }

                    else {

                        console.log(
                            "⚠️ No FCM tokens saved yet."
                        );
                    }

                }

                catch (notificationError) {

                    console.log(
                        "❌ Notification system error:",
                        notificationError
                    );
                }



                // ================================
                // SEND BOOKING SUCCESS
                // ================================

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    success: true,
                    message:
                        "Booking successfully confirmed!"
                }));

            }

            catch (error) {

                console.log(
                    "❌ Booking error:",
                    error
                );

                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    success: false,
                    message:
                        "Invalid booking data."
                }));
            }

        });

        return;
    }



    // ================================
    // TEST PAGE
    // ================================

    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end(
        "Priya Makeup Artist Backend is Working 💄✨"
    );

});



// ================================
// START SERVER
// ================================

server.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("💄 PRIYA MAKEUP ARTIST BACKEND");
    console.log("================================");
    console.log("Server running at:");
    console.log("http://localhost:3000");
    console.log("================================");
    console.log("");

});