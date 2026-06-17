/**
 * Flag helpers: build local image paths and an offline emoji fallback.
 * Flags are bundled in the local `flags/` folder (SVG) so the game works with
 * no internet connection.
 */

/** Path to the locally bundled SVG flag for a given ISO alpha-2 code. */
function flagImageUrl(code) {
  return `flags/${code.toLowerCase()}.svg`;
}

/**
 * Convert an ISO alpha-2 code into a Unicode flag emoji using regional
 * indicator symbols. Works offline; rendering quality varies by OS/browser.
 */
function flagEmoji(code) {
  const base = 0x1f1e6; // 'A' regional indicator
  return code
    .toUpperCase()
    .split("")
    .map((ch) => String.fromCodePoint(base + (ch.charCodeAt(0) - 65)))
    .join("");
}

/**
 * Return an <img> element for a flag that falls back to an emoji span if the
 * local image fails to load.
 */
function createFlagElement(code, { className = "flag-img" } = {}) {
  const img = document.createElement("img");
  img.className = className;
  img.alt = "Flag";
  img.loading = "lazy";
  img.src = flagImageUrl(code);
  img.addEventListener("error", () => {
    const span = document.createElement("span");
    span.className = "flag-emoji";
    span.textContent = flagEmoji(code);
    span.setAttribute("role", "img");
    span.setAttribute("aria-label", "Flag");
    if (img.parentNode) img.parentNode.replaceChild(span, img);
  });
  return img;
}
