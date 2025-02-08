const express = require("express");
const { encode, decode } = require("steggy"); // Correct import syntax
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

    // Correct encoding syntax
    const encoded = await encode(imageBuffer, fullMessage);

    res.set("Content-Type", "image/png");
    res.send(encoded.toString("base64"));
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

    // Correct decoding syntax
    const decoded = await decode(imageBuffer);

    // Verify password
    if (!decoded.startsWith(`${password}::`)) {
      throw new Error("Incorrect password or no hidden message");
    }

    const message = decoded.split("::")[1];
    res.json({ message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
