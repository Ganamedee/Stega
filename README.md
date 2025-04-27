# StegaCrypt: Hide Secrets in Plain Sight

StegaCrypt is a web application that lets you embed secret text messages within PNG images using steganography, with an optional layer of password protection. Decode messages hidden in images just as easily.

**Live Demo:** [https://stegocrypt.vercel.app](https://stegocrypt.vercel.app)

## What it Does

Steganography is the art of hiding information within other, non-secret information. StegaCrypt uses this to conceal text data inside the pixel data of a PNG image, making the presence of the secret message itself difficult to detect.

## Key Features

*   **Encode:** Hide text inside a cover PNG image. Upload JPEGs or PNGs – they'll be converted to PNG for encoding.
*   **Decode:** Extract hidden text from images previously encoded with StegaCrypt.
*   **Password Protection:** Optionally encrypt the hidden message. Only the correct password can reveal the secret.
*   **Image Preview:** See your images before encoding or decoding.
*   **Drag & Drop:** Easily upload images by dragging them onto the app.
*   **Download:** Get the final image with the embedded secret message.
*   **Responsive:** Works smoothly on various screen sizes.

## How it Works

*   **Frontend:** Built with standard HTML, CSS, and JavaScript for the user interface and interactions.
*   **Backend:** A Node.js server using Express handles the image processing requests.
*   **Steganography Engine:** The `steggy` library is used to manipulate the image data and embed/extract the text.