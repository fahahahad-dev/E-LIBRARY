// main.js
// Initialization and window.onload behavior (keeps original logic as-is)

// Initialize with error handling
try {
  updateSidebar();
} catch (error) {
  console.error("Error during initialization:", error);
}

// Window onload with error handling
window.onload = function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");

    // Store the book ID for later use
    currentBookId = params.get("id");

    if (file) {
      fetch(file)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.arrayBuffer();
        })
        .then((data) => {
          loadPDF(new Uint8Array(data));

          const pageControls = safeGetElement("pageControls");
          const resetBtn = safeGetElement("resetBtn");
          const dropArea = safeGetElement("dropArea");
          const pageContainer = safeGetElement("pageContainer");

          if (pageControls) pageControls.style.display = "flex";
          if (resetBtn) resetBtn.style.display = "block";
          if (dropArea) dropArea.style.display = "none";
          if (pageContainer) pageContainer.style.display = "block";
        })
        .catch((error) => {
          console.error("Error loading PDF file:", error);
          alert("Failed to load PDF file from URL");
        });
    }
  } catch (error) {
    console.error("Error in window.onload:", error);
  }
};

// Make functions and state available globally for the HTML module to use
window.highlights = highlights;
window.annotations = annotations;
window.renderHighlights = renderHighlights;
window.updateSidebar = updateSidebar;
window.annotationIdCounter = annotationIdCounter;
