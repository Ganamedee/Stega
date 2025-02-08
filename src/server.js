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
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Do not pass a password to steggy; instead, manually prefix the message
    const conceal = steggy.conceal();
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

// Decode endpoint with manual password implementation
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Do not pass a password to steggy; just reveal the concealed message
    const reveal = steggy.reveal();
    const revealed = reveal(imageBuffer);
    const message = revealed.toString();

    // If a password was used during encoding, check for its presence at the start
    if (password && !message.startsWith(`${password}::`)) {
      throw new Error("Incorrect password");
    }
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the app for environments like Vercel or testing
module.exports = app;
