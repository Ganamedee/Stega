const express = require("express");
const steggy = require("steggy");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
// Update the maxSize constant at the top of server.js
const MAX_IMAGE_SIZE = 1024; // Set a single consistent size limit
// Middleware
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json({ limit: "5mb" }));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Encode endpoint with manual password implementation
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password } = req.body;
    // Ensure we're working with a clean PNG buffer
    const imageBuffer = Buffer.from(
      base64Image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const conceal = steggy.conceal();
    const formattedMessage = password ? `${password}::${message}` : message;

    // Add validation to ensure message is properly formatted
    if (!formattedMessage || formattedMessage.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Force UTF-8 encoding for the message
    const messageBuffer = Buffer.from(formattedMessage, "utf8");
    const concealed = conceal(imageBuffer, messageBuffer);

    res.json({
      image: concealed.toString("base64"),
      message: "Encoding successful",
    });
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).json({ error: "Failed to encode message into image" });
  }
});
// Decode endpoint with manual password implementation
// Update the decode endpoint with better error handling
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    const reveal = steggy.reveal();
    let revealed;

    try {
      revealed = reveal(imageBuffer);
    } catch (e) {
      return res
        .status(400)
        .json({ error: "No hidden message found in image" });
    }

    const message = revealed.toString();

    // Only check password if one was provided
    if (password) {
      if (!message.startsWith(`${password}::`)) {
        return res.status(400).json({ error: "Incorrect password" });
      }
      return res.json({ message: message.replace(`${password}::`, "") });
    }

    // If no password was provided, return the full message
    res.json({ message: message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).json({
      error:
        "Unable to decode image. Please ensure this is a valid steganographic image.",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the app for environments like Vercel or testing
module.exports = app;
