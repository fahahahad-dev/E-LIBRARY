// globals.js
// Global variables and DOM element references
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let currentBookLang = null; // Remove default "en-US"
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let highlights = [];
let annotations = [];
let currentSelection = null;
let currentBookId = null; // Store the current book ID
let annotationIdCounter = 1;
let speechSynthesisUtterance = null;

// DOM elements (utils.js must be loaded before globals.js)
const canvas = safeGetElement("pdf-canvas");
const textLayer = safeGetElement("textLayer");
const pageContainer = safeGetElement("pageContainer");
const ctx = canvas ? canvas.getContext("2d") : null;
const fileInput = safeGetElement("fileInput");
const dropArea = safeGetElement("dropArea");
const pdfContainer = safeGetElement("pdfContainer");
const selectionToolbar = safeGetElement("selectionToolbar");
const sidebarContent = safeGetElement("sidebarContent");

function generateLocalId() {
  return annotationIdCounter++;
}

// expose minimal helpers to window if needed elsewhere
window.generateLocalId = generateLocalId;
