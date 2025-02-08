const express = require("express");
const steggy = require("steggy");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json({ limit: "5mb" }));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Encode endpoint
// Encode endpoint - fix response format
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Add password directly to conceal
    const conceal = password ? steggy.conceal(password) : steggy.conceal();

    // Prepend password to message for verification
    const formattedMessage = password ? `${password}::${message}` : message;

    const concealed = conceal(imageBuffer, formattedMessage);

    res.json({
      image: concealed.toString("base64"),
      message: "Encoding successful",
    });
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Decode endpoint - fix password validation
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Use password directly in reveal
    const reveal = password ? steggy.reveal(password) : steggy.reveal();
    const revealed = reveal(imageBuffer);

    // Convert to string and handle checksum
    let message;
    try {
      message = revealed.toString();
    } catch (error) {
      throw new Error("Invalid message format or corrupted data");
    }

    // If password was used, verify it's present at start
    if (password && !message.startsWith(`${password}::`)) {
      throw new Error("Incorrect password");
    }

    // Remove password prefix if exists
    const cleanMessage = password
      ? message.replace(`${password}::`, "")
      : message;

    res.json({ message: cleanMessage });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).json({
      error: error.message.includes("Shasum")
        ? "Data corrupted or invalid password"
        : error.message,
    });
  }
});

// Add this line at the very end of server.js
module.exports = app;
