// ui.js
// Sidebar updates, toolbar handling, reset, and main event wiring

function updateSidebar() {
  if (!sidebarContent) return;

  let html = "";

  if (highlights.length > 0) {
    html += `<div class="section-title">🎨 Highlights (${highlights.length})</div>`;
    highlights.forEach((highlight) => {
      // Ensure required properties exist
      const text = highlight.text || "No text";
      const page = highlight.page || 1;
      const color = highlight.color || "#ffff00";

      html += `
        <div class="annotation-item highlight" data-id="${highlight.id}" style="border-left-color: ${color}">
          <div class="annotation-text">"${text}"</div>
          <div class="annotation-note">Page ${page}</div>
          <button class="delete-btn">Delete</button>
        </div>
      `;
    });
  }

  if (annotations.length > 0) {
    html += `<div class="section-title" style="margin-top: 20px;">📝 Notes (${annotations.length})</div>`;
    annotations.forEach((annotation) => {
      // Ensure required properties exist
      const annotationText = annotation.annotation || "No note";
      const text = annotation.text || "No text";
      const page = annotation.page || 1;

      html += `
        <div class="annotation-item note" data-id="${annotation.id}">
          <div class="annotation-text"><strong>Note:</strong> ${annotationText}</div>
          <div class="annotation-note">Selected: "${text}" (Page ${page})</div>
          <button class="delete-btn">Delete</button>
        </div>
      `;
    });
  }

  if (highlights.length === 0 && annotations.length === 0) {
    html = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>Select text in the PDF to add highlights and notes</p>
      </div>
    `;
  }

  sidebarContent.innerHTML = html;

  // Add event listeners after updating the HTML
  document
    .querySelectorAll(".annotation-item.highlight .delete-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.parentElement.dataset.id);
        if (!isNaN(id)) {
          deleteHighlight(id);
        }
      });
    });

  document
    .querySelectorAll(".annotation-item.note .delete-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.parentElement.dataset.id);
        if (!isNaN(id)) {
          deleteAnnotation(id);
        }
      });
    });
}

function resetApp() {
  // Stop TTS immediately if speaking
  if (
    typeof speechSynthesis !== "undefined" &&
    (speechSynthesis.speaking || speechSynthesis.pending)
  ) {
    speechSynthesis.cancel();
  }

  // Reset PDF state
  pdfDoc = null;
  pageNum = 1;
  highlights = [];
  annotations = [];
  currentSelection = null;
  annotationIdCounter = 1; // Reset counter

  // Hide UI elements with safe access
  if (pageContainer) {
    pageContainer.innerHTML = "";
    pageContainer.style.display = "none";
  }
  if (dropArea) dropArea.style.display = "block";

  const pageControls = safeGetElement("pageControls");
  const resetBtn = safeGetElement("resetBtn");

  if (pageControls) pageControls.style.display = "none";
  if (resetBtn) resetBtn.style.display = "none";
  if (selectionToolbar) selectionToolbar.style.display = "none";

  // Clear sidebar
  updateSidebar();
}

function setupEventListeners() {
  const prevBtn = safeGetElement("prevBtn");
  const nextBtn = safeGetElement("nextBtn");

  addEventListenerSafe(prevBtn, "click", () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    console.log('Navigating to page:', pageNum); // Debug log
  });

  addEventListenerSafe(nextBtn, "click", () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    console.log('Navigating to page:', pageNum); // Debug log
  });

  // Text selection
  addEventListenerSafe(pdfContainer, "mouseup", handleTextSelection);

  // Highlight buttons
  const yellowBtn = safeGetElement("highlightYellow");
  const greenBtn = safeGetElement("highlightGreen");
  const pinkBtn = safeGetElement("highlightPink");

  addEventListenerSafe(yellowBtn, "click", () => addHighlight("#ffff00"));
  addEventListenerSafe(greenBtn, "click", () => addHighlight("#90EE90"));
  addEventListenerSafe(pinkBtn, "click", () => addHighlight("#FFB6C1"));

  // Annotation buttons
  const addNoteBtn = safeGetElement("addNoteBtn");
  const saveNote = safeGetElement("saveNote");
  const cancelNote = safeGetElement("cancelNote");
  const cancelSelectionBtn = safeGetElement("cancelSelection");
  const resetBtn = safeGetElement("resetBtn");
  const readAloudBtn = safeGetElement("readAloudBtn");

  addEventListenerSafe(addNoteBtn, "click", showAnnotationInput);
  addEventListenerSafe(saveNote, "click", saveAnnotation);
  addEventListenerSafe(cancelNote, "click", hideAnnotationInput);
  addEventListenerSafe(cancelSelectionBtn, "click", () => {
    cancelSelection();
  });
  addEventListenerSafe(resetBtn, "click", resetApp);
  addEventListenerSafe(readAloudBtn, "click", () => {
    if (currentSelection) {
      readAloud(currentSelection.text);
    }
  });
}
