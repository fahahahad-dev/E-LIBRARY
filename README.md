# README — PDF Viewer & Annotation Tool

Version: 1.0
Date: 2025-09-01

## Project overview

This project is a web-based PDF viewer with a full text-layer, selection, highlighting, annotation, and text‑to‑speech (TTS) capabilities. It provides a responsive UI for reading books/PDFs, persisting user highlights/annotations to a Supabase backend, and loading them back when a book is opened. The viewer is designed to keep annotations local in memory for immediate UI response and persist them to the server asynchronously.

## Major features

* PDF rendering with a visual canvas layer and a separate selectable text-layer.
* Accurate text selection across lines and paragraphs with robust rect normalization.
* Highlights and annotations (notes) with color metadata, tooltips, and click-to-delete behavior.
* TTS playback using browser APIs with optional word/line synchronisation hooks.
* User authentication (Supabase Auth) and per-user annotation storage.
* Persistence of annotations to the `annotation_new` table and live fetching on book open.

## Architecture & components

1. Frontend

   * Renders PDF pages (canvas) and overlays a `highlightLayer` (absolutely positioned container) for highlights/annotations.
   * Maintains local arrays `highlights[]` and `annotations[]` for immediate UI interaction.
   * Selection lifecycle: `handleTextSelection()` → `addHighlight(color)` / `addAnnotation()` → `renderHighlights()`.
   * Uses inline styles for dynamic properties (position/size/color) and CSS classes for consistent behaviour (pointer events, z-index, tooltips).

2. Backend (Supabase)

   * Supabase provides Postgres database, authentication, and object storage (for PDF files) in this architecture.
   * Key tables: `books` (metadata + storage reference), `annotation_new` (persisted highlights/notes), `users` (managed by Supabase Auth).
   * Annotations are pushed to `annotation_new` and fetched per-book and per-user as needed.

3. Data flow summary

   * Open book: frontend fetches book metadata (books table), retrieves PDF from storage, renders pages.
   * Load annotations: frontend fetches `annotation_new` for the opened book and calls `renderHighlights()` to display them.
   * Add annotation/highlight: frontend creates a local object, pushes it into `highlights[]`, renders immediately, calls `saveAnnotationToDB()` which inserts into `annotation_new`.

## PDF rendering & text layer

Typical setup

* A common approach is PDF.js for parsing and rendering PDF pages to `<canvas>` elements. The library also exposes a text layer (DOM) that contains selectable text spans positioned above the canvas.
* Two visual layers are used:

  1. **Canvas layer**: raster rendering of the page content.
  2. **Text layer**: invisible or visible DOM elements representing text; allows `window.getSelection()` and `Range.getClientRects()` to produce accurate client rectangles for selections.

Selection & rects

* Selection uses the standard browser selection API:

  * `const selection = window.getSelection();`
  * `const range = selection.getRangeAt(0);`
  * `const clientRects = Array.from(range.getClientRects());`
* Each `ClientRect` represents one visual segment (commonly one line or fragment). Browsers may return many small rects for a single visible line because text is split into multiple inline elements.

Common problems & solutions

* Problem: multiple overlapping rects for a single visible line cause stacked/darker highlights.

  * Solution: normalize and merge rects by grouping rects with the same approximate `y` (top) coordinate and merging adjacent fragments horizontally. This yields one overlay per visible segment.
* Coordinate conversion: convert client coordinates to the highlight container's coordinate system by subtracting `canvas.getBoundingClientRect().left/top`.

## Highlight & annotation rendering

Rendering approach

* `renderHighlights()` iterates over `highlights` and `annotations` for the current page, normalizes rects, creates an absolutely-positioned `<div class="highlight-overlay">` for each rect and sets inline styles:

  * `left`, `top`, `width`, `height` (px)
  * `background-color` (from `item.color`)
  * `opacity` (e.g. 0.4) for readability
  * `border` is used to visually distinguish annotations (e.g. thicker orange border)
* A small tooltip child (`.highlight-tooltip`) and an optional marker (`.annotation-marker`) are appended to show text/notes and an icon for annotations.
* Click handler on each overlay calls `deleteHighlight(id)` or `deleteAnnotation(id)`.

Data model (example)

```json
{
  "id": "loc-12345",
  "user_id": "user-uuid",
  "book_id": "book-uuid",
  "page": 3,
  "type": "highlight",          // or "annotation"
  "rects": [                    // coordinates relative to highlight container
    { "x": 50, "y": 120, "width": 300, "height": 18 }
  ],
  "text": "Selected text...",
  "annotation": null,           // present for notes
  "color": "#ffeb3b",
  "created_at": "2025-08-01T12:00:00Z"
}
```

## Text-to-Speech (TTS)

* Implemented via the browser Web Speech API (SpeechSynthesis):

  * `const utter = new SpeechSynthesisUtterance(text);`
  * `speechSynthesis.speak(utter);`
* For synced read-aloud experience:

  * Use the text-layer to map sentences/words to rects so you can highlight the current spoken segment.
  * Listen for `utter.onboundary` events (supported in many browsers) to receive character/word boundary callbacks and move a small visual indicator or apply a temporary highlight class.
* Controls: play/pause/stop, speed, voice selection, and skip to next/previous paragraph.

## Supabase: connection & annotation table

Supabase setup (client-side)

* Initialize the client with environment variables:

```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
```

Persisting annotations (`annotation_new`)

* Common insert pattern used by the client (pseudo-code):

```js
async function saveAnnotationToDB(annotation) {
  const { data, error } = await supabase
    .from('annotation_new')
    .insert([{
      user_id: annotation.user_id,
      book_id: annotation.book_id,
      page: annotation.page,
      rects: annotation.rects,    // store as JSON
      text: annotation.text,
      annotation: annotation.annotation || null,
      color: annotation.color,
      type: annotation.type,
    }])
    .select();

  if (error) throw error;
  return data;
}
```

* `rects` should be stored as JSONB (Postgres) for easy retrieval and processing.

Fetching & loading annotations

* Typical fetch on book open:

```js
async function fetchAnnotations(bookId) {
  const { data, error } = await supabase
    .from('annotation_new')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
```

* After fetching, convert stored `rects` (which are relative to the saved container) back to DOM coordinates if necessary and call `renderHighlights()`.

Real-time updates (optional)

* Supabase Realtime can be used to listen for inserts/updates/deletes on `annotation_new` so multiple clients see live changes:

```js
supabase
  .channel('public:annotation_new')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'annotation_new' }, payload => {
    // push payload.new into local annotations[] and call renderHighlights()
  })
  .subscribe();
```

## User authentication

* Managed via Supabase Auth. Typical flows:

  * Sign up with email/password or OAuth providers (Google, GitHub, etc.).
  * On successful sign-in, the client receives an access token and user object.
  * Secure the `annotation_new` table with Row Level Security (RLS) policies that enforce only authenticated users can insert and users can only modify/delete their own annotations, or that certain annotations are public depending on your app rules.

Recommended RLS policies (high-level)

* `INSERT`: allow authenticated users to insert but validate that `user_id = auth.uid()`.
* `SELECT`: allow public reading for annotations belonging to the book if your app requires collaborative/public annotations; otherwise restrict to `user_id = auth.uid()`.
* `UPDATE` / `DELETE`: allow only when `user_id = auth.uid()`.

Database schema (example)

```sql
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  storage_path text,      -- object storage path to PDF
  created_at timestamptz default now()
);

create table annotation_new (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  book_id uuid references books(id) on delete cascade,
  page integer not null,
  rects jsonb not null,
  text text,
  annotation text,
  color text,
  type text,
  created_at timestamptz default now(),
  updated_at timestamptz
);
```

## Integration notes & best practices

* Always convert client `getClientRects()` coordinates to a consistent coordinate space (highlight container or canvas top-left). Use `canvas.getBoundingClientRect()` subtraction.
* Store rects as JSONB with integer coordinates rounded to avoid tiny floating differences.
* Normalize/merge rect fragments on the client before rendering to prevent overlapping visuals. Merge by similar `y` coordinate (line) and horizontal adjacency.
* Use `pointer-events: none` on the parent highlight layer and `pointer-events: auto` on the overlay children so underlying UI interactions are preserved while overlays remain clickable.
* Use `DocumentFragment` when appending many overlays for performance.
* Consider pagination or virtualized rendering for very large documents or thousands of annotations.
* Sanitize user text/annotations before saving to prevent XSS in any rendered tooltips.

## Troubleshooting

* Double/darker highlights on the same line: normalize rects returned by `range.getClientRects()` and merge fragments using a small y-tolerance.
* Click handlers not firing: ensure `.highlight-overlay` has `pointer-events: auto` and the parent container has a proper `z-index` above the canvas.
* Selection coordinates off after zoom/rescale: re-calc rects relative to the active viewport scale and container bounds.

## Developer: saving & loading flow (step-by-step)

1. User selects text; `handleTextSelection()` captures `range.getClientRects()`.
2. Client normalizes/merges rects and builds a highlight object with `rects`, `text`, `page`, `color`, `type`.
3. `addHighlight(color)` pushes the highlight to local `highlights[]` and calls `renderHighlights()` for instant UI feedback.
4. Client calls `saveAnnotationToDB(highlight)` which inserts into `annotation_new`. On success, server returns a definitive `id` — update local object if needed.
5. On book open, `fetchAnnotations(bookId)` retrieves all persisted annotations. Client maps `rects` to the highlight-layer coordinates and calls `renderHighlights()`.

## Final notes

This README is intended to be a single-source technical summary for developers working on the PDF viewer and annotation system. If you would like, I can also produce:

* A short developer quickstart (how to run locally with env variables),
* A dump of the exact SQL migration for `annotation_new` and `books`, or
* A dedicated TTS synchronization guide with example code for more accurate word-level highlighting.

---

End of README
