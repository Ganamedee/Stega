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
app.post("/encode", async (req, res) => {
  try {
    const { image: base64Image, message, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Use password if provided
    const conceal = password ? steggy.conceal(password) : steggy.conceal();
    const concealed = conceal(imageBuffer, message);

    res.set("Content-Type", "image/png");
    res.send(Buffer.from(concealed).toString("base64"));
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).send(error.message);
  }
});

// Decode endpoint
app.post("/decode", async (req, res) => {
  try {
    const { image: base64Image, password } = req.body;
    const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");

    // Use password if provided
    const reveal = password ? steggy.reveal(password) : steggy.reveal();
    const revealed = reveal(imageBuffer).toString();

    // Verify password match
    if (password && !revealed.startsWith(`${password}::`)) {
      throw new Error("Incorrect password or no hidden message");
    }

    // Extract message (remove password prefix if exists)
    const message = revealed.replace(`${password}::`, "");
    res.json({ message });
  } catch (error) {
    console.error("Decoding error:", error);
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
