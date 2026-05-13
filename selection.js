// selection.js
// Text selection, highlights, annotations, and delete logic

function handleTextSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();

  if (selectedText.length === 0) return;

  // Get the exact pixel boxes for only the selected portion
  const rects = Array.from(range.getClientRects());

  if (rects.length > 0 && canvas) {
    const canvasRect = canvas.getBoundingClientRect();
    currentSelection = {
      text: selectedText,
      rects: rects.map((r) => ({
        x: r.left - canvasRect.left,
        y: r.top - canvasRect.top,
        width: r.width,
        height: r.height,
      })),
      page: pageNum,
    };

    const selectionText = safeGetElement("selectionText");
    if (selectionText) {
      selectionText.textContent = `Selected: "${selectedText}"`;
    }
    if (selectionToolbar) {
      selectionToolbar.style.display = "flex";
    }
  }
}

function addHighlight(color) {
  if (currentSelection) {
    const highlight = {
      ...currentSelection,
      id: generateLocalId(), // Use local ID for immediate UI updates
      color: color,
      type: "highlight",
    };
    highlights.push(highlight);

    // Save to database if function exists
    if (typeof window.saveAnnotationToDB === "function") {
      try {
        window.saveAnnotationToDB(highlight);
      } catch (error) {
        console.error("Error saving highlight to database:", error);
      }
    }

    renderHighlights();
    updateSidebar();
    cancelSelection();
  }
}

function showAnnotationInput() {
  const annotationInput = safeGetElement("annotationInput");
  const noteInput = safeGetElement("noteInput");

  if (annotationInput) annotationInput.style.display = "flex";
  if (noteInput) noteInput.focus();
}

function hideAnnotationInput() {
  const annotationInput = safeGetElement("annotationInput");
  const noteInput = safeGetElement("noteInput");

  if (annotationInput) annotationInput.style.display = "none";
  if (noteInput) noteInput.value = "";
}

function saveAnnotation() {
  const noteInput = safeGetElement("noteInput");
  const noteText = noteInput ? noteInput.value.trim() : "";

  if (currentSelection && noteText) {
    const annotation = {
      ...currentSelection,
      id: generateLocalId(), // Use local ID for immediate UI updates
      annotation: noteText,
      color: "#ffeb3b",
      type: "annotation",
    };
    annotations.push(annotation);

    // Save to database if function exists
    if (typeof window.saveAnnotationToDB === "function") {
      try {
        window.saveAnnotationToDB(annotation);
      } catch (error) {
        console.error("Error saving annotation to database:", error);
      }
    }

    renderHighlights();
    updateSidebar();
    hideAnnotationInput();
    cancelSelection();
  }
}

function cancelSelection() {
  currentSelection = null;
  if (selectionToolbar) selectionToolbar.style.display = "none";
  hideAnnotationInput();
  window.getSelection().removeAllRanges();
}

function renderHighlights(viewport) {
  const highlightLayer = safeGetElement("highlightLayer");
  if (!highlightLayer) return;

  highlightLayer.innerHTML = "";

  [...highlights, ...annotations]
    .filter((item) => item.page === pageNum)
    .forEach((item) => {
      // Ensure rects exists and is an array
      if (!item.rects || !Array.isArray(item.rects)) {
        console.warn("Invalid rects for annotation:", item);
        return;
      }

      item.rects.forEach((r) => {
        const div = document.createElement("div");
        div.className = "highlight-overlay";
        div.style.left = r.x + "px";
        div.style.top = r.y + "px";
        div.style.width = r.width + "px";
        div.style.height = r.height + "px";
        div.style.backgroundColor = item.color;
        div.style.opacity = "0.4";
        div.style.border =
          item.type === "annotation"
            ? "2px solid #f57c00"
            : "1px solid rgba(0,0,0,0.1)";

        const tooltip = document.createElement("div");
        tooltip.className = "highlight-tooltip";
        tooltip.textContent =
          item.type === "annotation"
            ? `Note: ${item.annotation}`
            : `Highlight: ${item.text}`;
        div.appendChild(tooltip);

        if (item.type === "annotation") {
          const marker = document.createElement("div");
          marker.className = "annotation-marker";
          marker.innerHTML = "📝"; // new note icon
          div.appendChild(marker);
        }

        div.addEventListener("click", () => {
          if (item.type === "highlight") {
            deleteHighlight(item.id);
          } else {
            deleteAnnotation(item.id);
          }
        });

        highlightLayer.appendChild(div);
      });
    });
}

function deleteHighlight(id) {
  const highlight = highlights.find((h) => h.id === id);
  if (highlight && typeof window.deleteAnnotationFromDB === "function") {
    try {
      window.deleteAnnotationFromDB(highlight);
    } catch (error) {
      console.error("Error deleting highlight from database:", error);
    }
  }
  highlights = highlights.filter((h) => h.id !== id);
  renderHighlights();
  updateSidebar();
}

function deleteAnnotation(id) {
  const annotation = annotations.find((a) => a.id === id);
  if (annotation && typeof window.deleteAnnotationFromDB === "function") {
    try {
      window.deleteAnnotationFromDB(annotation);
    } catch (error) {
      console.error("Error deleting annotation from database:", error);
    }
  }
  annotations = annotations.filter((a) => a.id !== id);
  renderHighlights();
  updateSidebar();
}
