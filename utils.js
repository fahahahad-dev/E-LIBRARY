// utils.js
// Safe DOM and event helpers (exact behavior as original)
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID '${id}' not found`);
  }
  return element;
}

function addEventListenerSafe(element, event, handler) {
  if (element) {
    element.addEventListener(event, handler);
  } else {
    console.warn(`Cannot add ${event} listener to null element`);
  }
}

// expose to window (keeps parity with original code usage)
window.safeGetElement = safeGetElement;
window.addEventListenerSafe = addEventListenerSafe;
