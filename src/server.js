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

    // Add password formatting
    const formattedMessage = password ? `${password}::${message}` : message;
    const conceal = steggy.conceal();
    const concealed = conceal(imageBuffer, formattedMessage);

    // Send JSON response with image data
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

    const reveal = steggy.reveal();
    const revealed = reveal(imageBuffer).toString();

    // Improved password verification
    if (password && !revealed.startsWith(`${password}::`)) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Clean message extraction
    const message = revealed.replace(`${password}::`, "");
    res.json({ message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).json({ error: error.message });
  }
});
