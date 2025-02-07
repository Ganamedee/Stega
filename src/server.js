const express = require("express");
const multer = require("multer");
const path = require("path");
const jimp = require("jimp");
const port = process.env.PORT || 3000;

const app = express();

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
    const image = await jimp.read(req.file.buffer);

    let messageIndex = 0;
    image.scan(
      0,
      0,
      image.bitmap.width,
      image.bitmap.height,
      function (x, y, idx) {
        if (messageIndex < message.length) {
          const char = message.charCodeAt(messageIndex);
          this.bitmap.data[idx] =
            (this.bitmap.data[idx] & 254) | ((char >> 7) & 1);
          this.bitmap.data[idx + 1] =
            (this.bitmap.data[idx + 1] & 254) | ((char >> 6) & 1);
          this.bitmap.data[idx + 2] =
            (this.bitmap.data[idx + 2] & 254) | ((char >> 5) & 1);
          messageIndex++;
        }
      }
    );

    const processedBuffer = await image.getBufferAsync(jimp.MIME_PNG);
    res.set("Content-Type", "image/png");
    res.send(processedBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image");
  }
});

app.post("/decode", upload.single("image"), async (req, res) => {
  try {
    const image = await jimp.read(req.file.buffer);
    let message = "";
    let char = 0;
    let bitIndex = 0;

    image.scan(
      0,
      0,
      image.bitmap.width,
      image.bitmap.height,
      function (x, y, idx) {
        if (bitIndex < 8) {
          char = (char << 1) | (this.bitmap.data[idx] & 1);
          bitIndex++;
          if (bitIndex === 8) {
            message += String.fromCharCode(char);
            char = 0;
            bitIndex = 0;
          }
        }
      }
    );

    res.json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error decoding image");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
