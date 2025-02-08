const express = require("express");
const steganography = require("steganography.js");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Static files middleware
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json({ limit: "5mb" }));

// Root route handler
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Encode endpoint
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password = "" } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Combine password and message
    const fullMessage = `${password}::${message}`;

    // Encode the message into the image
    const stegoBuffer = steganography.encode(imageBuffer, fullMessage);

    res.set("Content-Type", "image/png"); // Use PNG for lossless encoding
    res.send(Buffer.from(stegoBuffer).toString("base64"));
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).send(error.message);
  }
});

// Decode endpoint
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password = "" } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Decode the message from the image
    const decodedMessage = steganography.decode(imageBuffer);

    // Verify the password
    if (!decodedMessage.startsWith(`${password}::`)) {
      throw new Error("Incorrect password or no hidden message found");
    }

    // Extract the actual message
    const message = decodedMessage.split("::")[1];
    res.json({ message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
