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

// Encode endpoint without manual password prefixing
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Let steggy handle the password internally
    const conceal = steggy.conceal(password);
    const concealed = conceal(imageBuffer, message);

    res.json({
      image: concealed.toString("base64"),
      message: "Encoding successful",
    });
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Decode endpoint without manual password checking
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    const reveal = steggy.reveal(password);
    const revealed = reveal(imageBuffer);

    res.json({ message: revealed.toString() });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).json({
      error: error.message.includes("Shasum")
        ? "Data corrupted or invalid password"
        : error.message,
    });
  }
});

// Export app for vercel or further usage
module.exports = app;
