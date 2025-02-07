const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const port = process.env.PORT || 3000;

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// server.js
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/encode", upload.single("image"), async (req, res) => {
  try {
    const password = req.body.password || "";
    const message = req.body.message || "";

    // Save the uploaded image to a temporary file.
    const ext = path.extname(req.file.originalname) || ".jpg";
    const randomStr = crypto.randomBytes(8).toString("hex");
    const coverFilePath = path.join(os.tmpdir(), `cover-${randomStr}${ext}`);
    await fs.writeFile(coverFilePath, req.file.buffer);

    // Save the payload (secret message) to a temporary file.
    const payloadFilePath = path.join(os.tmpdir(), `payload-${randomStr}.txt`);
    await fs.writeFile(payloadFilePath, message, "utf8");

    // Run steghide embed command.
    await new Promise((resolve, reject) => {
      execFile(
        "steghide",
        [
          "embed",
          "-cf",
          coverFilePath,
          "-ef",
          payloadFilePath,
          "-p",
          password,
          "-f",
        ],
        (error, stdout, stderr) => {
          if (error) {
            return reject(error);
          }
          resolve();
        }
      );
    });

    // Read the modified image (stego image).
    const stegoBuffer = await fs.readFile(coverFilePath);

    // Clean up temporary files.
    await fs.unlink(coverFilePath);
    await fs.unlink(payloadFilePath);

    res.set("Content-Type", "image/jpeg");
    res.send(stegoBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image");
  }
});

app.post("/decode", upload.single("image"), async (req, res) => {
  try {
    const password = req.body.password || "";

    // Save the uploaded stego image to a temporary file.
    const ext = path.extname(req.file.originalname) || ".jpg";
    const randomStr = crypto.randomBytes(8).toString("hex");
    const stegoFilePath = path.join(os.tmpdir(), `stego-${randomStr}${ext}`);
    await fs.writeFile(stegoFilePath, req.file.buffer);

    // Create a temporary file for the extracted payload.
    const extractedFilePath = path.join(
      os.tmpdir(),
      `extracted-${randomStr}.txt`
    );

    // Run steghide extract command.
    await new Promise((resolve, reject) => {
      execFile(
        "steghide",
        [
          "extract",
          "-sf",
          stegoFilePath,
          "-xf",
          extractedFilePath,
          "-p",
          password,
          "-f",
        ],
        (error, stdout, stderr) => {
          if (error) {
            // Check if the error appears to be password-related.
            if (
              stderr.toLowerCase().includes("password") ||
              stderr.toLowerCase().includes("cannot extract")
            ) {
              return reject(new Error("Incorrect password"));
            }
            return reject(error);
          }
          resolve();
        }
      );
    });

    // Read the extracted payload.
    const extractedPayload = await fs.readFile(extractedFilePath, "utf8");

    // Clean up temporary files.
    await fs.unlink(stegoFilePath);
    await fs.unlink(extractedFilePath);

    res.json({ message: extractedPayload });
  } catch (error) {
    console.error(error);
    // If the error message indicates an incorrect password, send that message.
    if (error.message === "Incorrect password") {
      res.status(400).send("Incorrect password");
    } else {
      res.status(500).send("Error decoding image");
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
