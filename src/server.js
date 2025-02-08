const express = require("express");
const multer = require("multer");
const path = require("path");
const jimp = require("jimp");
const Steggy = require("steggy");
const port = process.env.PORT || 3000;

const app = express();
const steggy = new Steggy();

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/encode", upload.single("image"), async (req, res) => {
  try {
    const message = req.body.message;
    const password = req.body.password || "";
    const imageBuffer = req.file.buffer;

    // Include password in encoding
    const encoded = await steggy.encode(imageBuffer, message, password);

    res.set("Content-Type", "image/png");
    res.send(encoded);
  } catch (error) {
    console.error("Encoding error:", error);
    res.status(500).send("Error processing image: " + error.message);
  }
});

app.post("/decode", upload.single("image"), async (req, res) => {
  try {
    const password = req.body.password || "";
    const imageBuffer = req.file.buffer;

    // Include password in decoding
    const decoded = await steggy.decode(imageBuffer, password);

    if (!decoded) {
      throw new Error("No message found or incorrect password");
    }

    res.json({ message: decoded });
  } catch (error) {
    console.error("Decoding error:", error);
    if (error.message.includes("password")) {
      res.status(401).send("Incorrect password");
    } else {
      res.status(400).send(error.message || "Error decoding image");
    }
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
