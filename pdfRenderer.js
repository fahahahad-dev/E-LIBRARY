// pdfRenderer.js
// PDF loading / rendering and file drag/drop handlers

// File input handler
addEventListenerSafe(fileInput, "change", handleFile);

// Drag and drop handlers
addEventListenerSafe(dropArea, "dragover", (e) => {
  e.preventDefault();
  if (dropArea) dropArea.style.borderColor = "#00b894";
});

addEventListenerSafe(dropArea, "dragleave", () => {
  if (dropArea) dropArea.style.borderColor = "#ddd";
});

addEventListenerSafe(dropArea, "drop", (e) => {
  e.preventDefault();
  if (dropArea) dropArea.style.borderColor = "#ddd";
  const files = e.dataTransfer.files;
  if (files[0] && files[0].type === "application/pdf") {
    handleFile({ target: { files: [files[0]] } });
  }
});

addEventListenerSafe(dropArea, "click", () => {
  if (fileInput) fileInput.click();
});

function handleFile(event) {
  const file = event.target.files[0];
  if (file && file.type === "application/pdf") {
    const reader = new FileReader();
    reader.onload = function (e) {
      const typedarray = new Uint8Array(e.target.result);
      loadPDF(typedarray);
    };
    reader.readAsArrayBuffer(file);

    // Show controls with safe element access
    const pageControls = safeGetElement("pageControls");
    const resetBtn = safeGetElement("resetBtn");

    if (pageControls) pageControls.style.display = "flex";
    if (resetBtn) resetBtn.style.display = "block";
    if (dropArea) dropArea.style.display = "none";
    if (pageContainer) pageContainer.style.display = "block";
  }
}

async function loadPDF(data) {
  try {
    pdfDoc = await pdfjsLib.getDocument(data).promise;
    const pageInfo = safeGetElement("pageInfo");
    if (pageInfo) {
      pageInfo.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
    }
    renderPage(pageNum);
    setupEventListeners();

    // Load annotations from database if available
    if (typeof window.loadAnnotationsFromDB === "function") {
      await window.loadAnnotationsFromDB();
    }
  } catch (error) {
    console.error("Error loading PDF:", error);
    alert("Failed to load PDF. Please try a different file.");
  }
}

function renderPage(num) {
  if (!pdfDoc) {
    console.error("PDF document not loaded");
    return;
  }

  pageRendering = true;

  pdfDoc
    .getPage(num)
    .then(function (page) {
      const viewport = page.getViewport({ scale: scale });

      if (canvas && ctx) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
      }

      if (pageContainer) {
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
      }

      if (!ctx) {
        console.error("Canvas context not available");
        pageRendering = false;
        return;
      }

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTask.promise
        .then(function () {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
          if (textLayer) {
            textLayer.style.setProperty("--scale-factor", scale.toString());
          }
          renderHighlights(viewport);
          renderTextLayer(page, viewport);
        })
        .catch((error) => {
          console.error("Error rendering page:", error);
          pageRendering = false;
        });
    })
    .catch((error) => {
      console.error("Error getting page:", error);
      pageRendering = false;
    });

  const pageInfo = safeGetElement("pageInfo");
  if (pageInfo) {
    pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
  }
}

function renderTextLayer(page, viewport) {
  if (!textLayer) return;

  textLayer.innerHTML = "";
  textLayer.style.left = "0px";
  textLayer.style.top = "0px";
  textLayer.style.height = `${viewport.height}px`;
  textLayer.style.width = `${viewport.width}px`;

  page
    .getTextContent()
    .then(function (textContent) {
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: [],
      });
    })
    .catch((error) => {
      console.error("Error rendering text layer:", error);
    });
}

function queueRenderPage(num) {
  console.log('Queueing page render:', num);
  if (pageRendering) {
    pageNumPending = num;
    console.log('Page rendering in progress, queued:', num);
  } else {
    renderPage(num);
  }
}
