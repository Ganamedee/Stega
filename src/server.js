const express = require("express");
const Jimp = require("jimp");
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

// Helper functions for steganography
const embedMessage = async (imageBuffer, message, password) => {
  const image = await Jimp.read(imageBuffer);
  // Resize image to max 1024x1024 for performance
  if (image.bitmap.width > 1024 || image.bitmap.height > 1024) {
    image.resize(1024, Jimp.AUTO);
  }

  // Combine password and message with a delimiter
  const fullMessage = `${password}::${message}`;
  const binaryMessage = Buffer.from(fullMessage).toString("binary");
  const messageLength = binaryMessage.length * 8;

  if (messageLength > (image.bitmap.data.length * 3) / 4) {
    throw new Error("Message too large for image");
  }

  let bitIndex = 0;
  const data = image.bitmap.data;
  for (let i = 0; i < data.length; i += 4) {
    if (bitIndex >= messageLength) break;

    for (let channel = 0; channel < 3; channel++) {
      if (bitIndex >= messageLength) break;
      const byte = binaryMessage.charCodeAt(Math.floor(bitIndex / 8));
      const bit = (byte >> (7 - (bitIndex % 8))) & 1;
      data[i + channel] = (data[i + channel] & 0xfe) | bit; // Set LSB
      bitIndex++;
    }
  }

  // Use PNG for lossless encoding
  return image.getBufferAsync(Jimp.MIME_PNG);
};

const extractMessage = async (imageBuffer, password) => {
  const image = await Jimp.read(imageBuffer);
  // Resize image to max 512x512 for faster decoding
  if (image.bitmap.width > 512 || image.bitmap.height > 512) {
    image.resize(512, Jimp.AUTO);
  }

  let binaryString = "";
  let currentByte = 0;
  let bitCount = 0;

  const data = image.bitmap.data;
  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const bit = data[i + channel] & 1; // Read LSB
      currentByte = (currentByte << 1) | bit;
      bitCount++;

      if (bitCount === 8) {
        const char = String.fromCharCode(currentByte);
        binaryString += char;

        // Check if we've found the password delimiter
        if (binaryString.includes("::")) {
          const [pass, msg] = binaryString.split("::");
          if (pass !== password) {
            throw new Error("Incorrect password");
          }
          return msg;
        }

        currentByte = 0;
        bitCount = 0;
      }
    }
  }

  throw new Error("No hidden message found");
};

// Encode endpoint
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password = "" } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    const stegoBuffer = await embedMessage(imageBuffer, message, password);
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

    console.log("Starting decoding process...");
    const message = await extractMessage(imageBuffer, password);
    console.log("Decoding completed successfully.");
    res.json({ message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
