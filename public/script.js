document.addEventListener("DOMContentLoaded", () => {
  // Custom notification function
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

  // Mode toggle (slider) functionality
  const modeToggle = document.getElementById("modeToggle");
  const encodeSection = document.getElementById("encodeSection");
  const decodeSection = document.getElementById("decodeSection");

  modeToggle.addEventListener("change", () => {
    if (modeToggle.checked) {
      // Show Decode mode
      encodeSection.classList.add("hidden");
      decodeSection.classList.remove("hidden");
    } else {
      // Show Encode mode
      decodeSection.classList.add("hidden");
      encodeSection.classList.remove("hidden");
    }
  });

  // ENCODE functionality
  const dropZone = document.getElementById("dropZone");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const secretMessage = document.getElementById("secretMessage");
  const passwordEncode = document.getElementById("passwordEncode");
  const encodeBtn = document.getElementById("encodeBtn");

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
    handleImageUpload(file);
  });
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  });

  function handleImageUpload(file) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.transform = "none";
        img.style.imageOrientation = "none";
        // Create a clear button below the image
        const clearBtn = document.createElement("button");
        clearBtn.className = "clear-button";
        clearBtn.textContent = "Clear";
        clearBtn.onclick = () => {
          imagePreview.innerHTML = "";
          dropZone.style.display = "flex";
          imageInput.value = "";
        };

        imagePreview.innerHTML = "";
        imagePreview.appendChild(img);
        imagePreview.appendChild(clearBtn);
        dropZone.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  }

  encodeBtn.addEventListener("click", async () => {
    if (!imageInput.files[0] || !secretMessage.value.trim()) {
      showNotification("Please select an image and enter a message.", "error");
      return;
    }
    const formData = new FormData();
    formData.append("image", imageInput.files[0]);
    formData.append("message", secretMessage.value);
    formData.append("password", passwordEncode.value);

    try {
      const response = await fetch("/encode", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        showNotification("Error encoding message: " + errText, "error");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      // Reset form elements
      imagePreview.innerHTML = "";
      dropZone.style.display = "flex";
      imageInput.value = "";
      secretMessage.value = "";
      passwordEncode.value = "";
      showNotification("Message encoded successfully!", "success");
      // Trigger download of the stego image
      const a = document.createElement("a");
      a.href = url;
      a.download = "encoded-image.jpg";
      a.click();
    } catch (error) {
      showNotification("Error encoding message.", "error");
    }
  });

  // DECODE functionality
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
    if (file && file.type.startsWith("image/")) {
      decodeImageInput.files = e.dataTransfer.files;
      handleDecodeImageUpload(file);
    }
  });
  decodeImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleDecodeImageUpload(file);
  });

  function handleDecodeImageUpload(file) {
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
          decodePreview.innerHTML = "";
          decodeDropZone.style.display = "flex";
          decodeImageInput.value = "";
          decodedMessage.textContent = "";
        };

        decodePreview.innerHTML = "";
        decodePreview.appendChild(img);
        decodePreview.appendChild(clearBtn);
        decodeDropZone.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  }

  decodeBtn.addEventListener("click", async () => {
    if (!decodeImageInput.files[0]) {
      showNotification("Please select an image to decode.", "error");
      return;
    }
    const formData = new FormData();
    formData.append("image", decodeImageInput.files[0]);
    formData.append("password", passwordDecode.value);

    try {
      const response = await fetch("/decode", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        showNotification(errText || "Error decoding image", "error");
        return;
      }
      const data = await response.json();
      decodedMessage.textContent = data.message;
      decodedMessage.classList.add("fade-in");
      // Reset decode form elements
      decodePreview.innerHTML = "";
      decodeDropZone.style.display = "flex";
      decodeImageInput.value = "";
      passwordDecode.value = "";
      showNotification("Message decoded successfully!", "success");
    } catch (error) {
      showNotification("Error decoding image.", "error");
    }
  });
});

// Inside tab click event listener
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Existing tab code...

    // Update body attribute for background pattern
    document.body.dataset.activeTab = tab.dataset.tab;
  });
});

// Set initial active tab
document.body.dataset.activeTab = "encode";

themeToggle.addEventListener("click", () => {
  const isDark = document.body.dataset.theme === "dark";
  document.body.dataset.theme = isDark ? "light" : "dark";
  themeToggle.innerHTML = `<i class="fas ${
    isDark ? "fa-sun" : "fa-moon"
  }"></i>`;
  localStorage.setItem("theme", document.body.dataset.theme);
});

// Set initial theme icon
const isDark = localStorage.getItem("theme") === "dark";
themeToggle.innerHTML = `<i class="fas ${isDark ? "fa-moon" : "fa-sun"}"></i>`;

// Create background pattern
function createBackgroundPattern() {
  const pattern = document.createElement("div");
  pattern.className = "background-pattern";

  for (let i = 0; i < 64; i++) {
    const icon = document.createElement("i");
    icon.className = "fas fa-lock";
    pattern.appendChild(icon);
  }

  document.body.appendChild(pattern);
}

// Update pattern on tab switch
function updatePattern(tab) {
  const icons = document.querySelectorAll(".background-pattern i");
  icons.forEach((icon) => {
    icon.className = tab === "decode" ? "fas fa-unlock" : "fas fa-lock";
  });
}

// Add to your existing tab click listeners
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // ... existing code ...
    updatePattern(tab.dataset.tab);
  });
});

// Initialize background pattern
createBackgroundPattern();
