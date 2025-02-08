document.addEventListener("DOMContentLoaded", () => {
  // Notification system (unchanged)
  const notificationEl = document.getElementById("notification");
  function showNotification(message, type = "error", duration = 3000) {
    notificationEl.textContent = message;
    notificationEl.className = "notification " + type;
    notificationEl.style.display = "block";
    notificationEl.style.animation = "fadeInNotification 0.5s ease forwards";
    setTimeout(() => {
      notificationEl.style.display = "none";
    }, duration);
  }

  // Mode toggle functionality (unchanged)
  const modeToggle = document.getElementById("modeToggle");
  const encodeSection = document.getElementById("encodeSection");
  const decodeSection = document.getElementById("decodeSection");

  modeToggle.addEventListener("change", () => {
    if (modeToggle.checked) {
      encodeSection.classList.add("hidden");
      decodeSection.classList.remove("hidden");
    } else {
      decodeSection.classList.add("hidden");
      encodeSection.classList.remove("hidden");
    }
  });

  // ENCODE functionality (unchanged UI handling)
  const dropZone = document.getElementById("dropZone");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const secretMessage = document.getElementById("secretMessage");
  const passwordEncode = document.getElementById("passwordEncode");
  const encodeBtn = document.getElementById("encodeBtn");

  // Image upload handling (unchanged)
  dropZone.addEventListener("click", () => imageInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.background = "rgba(108, 99, 255, 0.1)";
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.style.background = "transparent";
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.background = "transparent";
    const file = e.dataTransfer.files[0];
    handleImageUpload(file, imagePreview, dropZone);
  });
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleImageUpload(file, imagePreview, dropZone);
  });

  // DECODE functionality (unchanged UI handling)
  const decodeDropZone = document.getElementById("decodeDropZone");
  const decodeImageInput = document.getElementById("decodeImageInput");
  const passwordDecode = document.getElementById("passwordDecode");
  const decodeBtn = document.getElementById("decodeBtn");
  const decodedMessage = document.getElementById("decodedMessage");
  const decodePreview = document.getElementById("decodePreview");

  decodeDropZone.addEventListener("click", () => decodeImageInput.click());
  decodeDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    decodeDropZone.style.background = "rgba(108, 99, 255, 0.1)";
  });
  decodeDropZone.addEventListener("dragleave", () => {
    decodeDropZone.style.background = "transparent";
  });
  decodeDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    decodeDropZone.style.background = "transparent";
    const file = e.dataTransfer.files[0];
    handleImageUpload(file, decodePreview, decodeDropZone);
  });
  decodeImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleImageUpload(file, decodePreview, decodeDropZone);
  });

  // Image upload handler (unchanged)
  function handleImageUpload(file, previewElement, dropZoneElement) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.transform = "none";
        img.style.imageOrientation = "none";

        const clearBtn = document.createElement("button");
        clearBtn.className = "clear-button";
        clearBtn.textContent = "Clear";
        clearBtn.onclick = () => {
          previewElement.innerHTML = "";
          dropZoneElement.style.display = "flex";
          if (previewElement === imagePreview) {
            imageInput.value = "";
          } else {
            decodeImageInput.value = "";
            decodedMessage.textContent = "";
          }
        };

        previewElement.innerHTML = "";
        previewElement.appendChild(img);
        previewElement.appendChild(clearBtn);
        dropZoneElement.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  }

  // Encode button handler (updated for proper API integration)
  encodeBtn.addEventListener("click", async () => {
    if (!imagePreview.querySelector("img") || !secretMessage.value.trim()) {
      showNotification("Please select an image and enter a message.", "error");
      return;
    }

    const img = imagePreview.querySelector("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize logic (unchanged)
    const maxSize = 1024;
    const scale = Math.min(
      maxSize / img.naturalWidth,
      maxSize / img.naturalHeight
    );
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    try {
      showNotification("Encoding message...", "info", 5000);

      // Convert canvas directly to base64
      const imageData = canvas.toDataURL("image/png");

      const response = await fetch("/encode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          message: secretMessage.value,
          password: passwordEncode.value || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showNotification(`Error: ${result.error}`, "error");
        return;
      }

      // Create download link
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${result.image}`;
      a.download = "encoded-image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reset form
      imagePreview.innerHTML = "";
      dropZone.style.display = "flex";
      secretMessage.value = "";
      passwordEncode.value = "";
      showNotification("Message encoded successfully!", "success");
    } catch (error) {
      showNotification("Error encoding message: " + error.message, "error");
    }
  });

  // Decode button handler (updated for proper API integration)
  decodeBtn.addEventListener("click", async () => {
    if (!decodePreview.querySelector("img")) {
      showNotification("Please select an image to decode.", "error");
      return;
    }

    const img = decodePreview.querySelector("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize logic
    const maxSize = 512;
    const scale = Math.min(
      maxSize / img.naturalWidth,
      maxSize / img.naturalHeight
    );
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    try {
      showNotification("Decoding image...", "info", 5000);
      const imageData = canvas.toDataURL("image/png");

      // Handle response properly
      const response = await fetch("/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          password: passwordDecode.value || null,
        }),
      });

      // Clone the response to read it multiple times if needed
      const responseClone = response.clone();

      try {
        const data = await response.json();

        if (!response.ok) {
          showNotification(`Error: ${data.error}`, "error");
          return;
        }

        decodedMessage.textContent = data.message;
        decodedMessage.classList.add("fade-in");
        showNotification("Message decoded successfully!", "success");
      } catch (error) {
        // Fallback to text if JSON parsing fails
        const text = await responseClone.text();
        showNotification(`Decoding failed: ${text}`, "error");
      }
    } catch (error) {
      showNotification("Error decoding image: " + error.message, "error");
    }
  });
});
