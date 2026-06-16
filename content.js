(function () {
  // Prevent duplicate injections
  if (window.pokefontLoaded) return;
  window.pokefontLoaded = true;

  // Create and inject the Pokéball magnifying lens element
  const lens = document.createElement('div');
  lens.className = 'pokefont-lens-container';
  document.documentElement.appendChild(lens);

  // Active overlays map: maps element unique key/id to its clone info
  // { element: HTMLElement, clone: HTMLElement, rect: DOMRect }
  let activeOverlays = new Map();
  
  // Viewport cached elements list:
  // Array of { element, left, top, right, bottom, width, height }
  let cachedElements = [];
  let cacheTimer = null;

  // Helper to determine the background color of an element's parent container
  function getElementBackgroundColor(el) {
    let current = el;
    while (current && current !== document.documentElement && current !== document.body) {
      const bg = window.getComputedStyle(current).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      current = current.parentElement;
    }
    // Check body background
    if (document.body) {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
        return bodyBg;
      }
    }
    return '#ffffff'; // final default fallback (e.g. white background)
  }

  // Scan the document to build a spatial index of text elements in the viewport
  function rebuildTextCache() {
    // Select all potential text container tags
    const textSelectors = 'p, span, h1, h2, h3, h4, h5, h6, a, li, b, strong, i, em, button, label, td, th';
    const rawElements = Array.from(document.querySelectorAll(textSelectors));
    
    // Filter out elements that have an ancestor in the selected set of elements
    // to prevent duplicate overlays for nested elements (like span or a inside p)
    const elementsToCache = rawElements.filter((el) => {
      let parent = el.parentElement;
      while (parent) {
        if (rawElements.includes(parent)) {
          return false; // Skip this element as its ancestor will be cloned
        }
        parent = parent.parentElement;
      }
      return true;
    });

    const list = [];
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    elementsToCache.forEach((el) => {
      // Skip overlay clones or visual helper elements
      if (
        el.classList.contains('pokefont-lens-container') ||
        el.classList.contains('pokefont-clone-overlay')
      ) {
        return;
      }

      // Check if it has text content (direct or indirect)
      if (el.textContent.trim().length > 0) {
        const rect = el.getBoundingClientRect();
        
        // Skip hidden or collapsed elements
        if (rect.width === 0 || rect.height === 0) return;

        // Skip elements completely outside the current viewport boundaries (with 100px padding for safety)
        if (
          rect.right < -100 ||
          rect.left > viewportW + 100 ||
          rect.bottom < -100 ||
          rect.top > viewportH + 100
        ) {
          return;
        }

        list.push({
          element: el,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
      }
    });

    cachedElements = list;
  }

  // Debounced cache rebuilding to maintain high performance during DOM updates
  function triggerCacheRebuild() {
    clearTimeout(cacheTimer);
    cacheTimer = setTimeout(rebuildTextCache, 150);
  }

  // Remove a single overlay clone safely
  function removeOverlay(el, clone) {
    if (clone) {
      clone.remove();
    }
    activeOverlays.delete(el);
  }

  // Clear all overlays when scrolling or resizing
  function clearAllOverlays() {
    activeOverlays.forEach((info, el) => {
      if (info.clone) info.clone.remove();
    });
    activeOverlays.clear();
  }

  // Check if a rectangle intersects with a circle centered at (cx, cy) with radius r
  function intersectsCircle(rect, cx, cy, r) {
    const closestX = Math.max(rect.left, Math.min(cx, rect.right));
    const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));

    const distanceX = cx - closestX;
    const distanceY = cy - closestY;

    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared <= (r * r);
  }

  // Initialize content script cache
  rebuildTextCache();

  // Watch for dynamic DOM changes (e.g. infinite scroll, search results loading)
  const observer = new MutationObserver(triggerCacheRebuild);
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle cursor moves
  window.addEventListener('mousemove', (e) => {
    // 1. Move Pokéball lens cursor container
    lens.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    lens.style.display = 'block';

    const lensRadius = 70; // Half of 140px lens container size
    const currentIntersecting = new Set();

    // 2. Evaluate all text elements currently inside the circle range
    cachedElements.forEach((item) => {
      if (intersectsCircle(item, e.clientX, e.clientY, lensRadius)) {
        currentIntersecting.add(item.element);

        // If not cloned yet, build the overlay clone
        if (!activeOverlays.has(item.element)) {
          const original = item.element;
          // Clone the node itself to preserve original HTML structures, classes, and formatting tags
          const clone = original.cloneNode(true);
          
          // Remove ID attributes in the cloned subtree to avoid DOM duplication conflicts
          clone.removeAttribute('id');
          clone.querySelectorAll('[id]').forEach((child) => child.removeAttribute('id'));

          clone.classList.add('pokefont-clone-overlay', 'pokefont-clipped');

          // Align clone coordinates exactly on top of the original element
          const styles = window.getComputedStyle(original);
          const scale = 0.48; // Bypass Chrome's min font size clamping using visual scaling

          clone.style.setProperty('--pokefont-scale', scale);
          clone.style.position = 'fixed';
          clone.style.left = item.left + 'px';
          clone.style.top = item.top + 'px';
          clone.style.width = (item.width / scale) + 'px';
          clone.style.height = (item.height / scale) + 'px';
          
          clone.style.fontSize = styles.fontSize;
          clone.style.fontWeight = styles.fontWeight;
          
          const parsedLineHeight = parseFloat(styles.lineHeight);
          if (!isNaN(parsedLineHeight)) {
            clone.style.lineHeight = (parsedLineHeight / scale) + 'px';
          } else {
            clone.style.lineHeight = styles.lineHeight;
          }
          
          clone.style.textAlign = styles.textAlign;
          clone.style.fontStyle = styles.fontStyle;
          clone.style.display = styles.display === 'inline' ? 'inline-block' : styles.display;
          
          // Scale paddings to keep layout spacing proportions identical
          const padL = parseFloat(styles.paddingLeft);
          const padR = parseFloat(styles.paddingRight);
          const padT = parseFloat(styles.paddingTop);
          const padB = parseFloat(styles.paddingBottom);
          clone.style.paddingLeft = (isNaN(padL) ? 0 : padL / scale) + 'px';
          clone.style.paddingRight = (isNaN(padR) ? 0 : padR / scale) + 'px';
          clone.style.paddingTop = (isNaN(padT) ? 0 : padT / scale) + 'px';
          clone.style.paddingBottom = (isNaN(padB) ? 0 : padB / scale) + 'px';

          // Set clone solid background to block/hide original black text underneath
          clone.style.backgroundColor = getElementBackgroundColor(original);

          document.documentElement.appendChild(clone);
          
          activeOverlays.set(original, {
            element: original,
            clone: clone,
            rect: item
          });

          // Trigger layout draw and apply opacity transition
          clone.offsetHeight;
          clone.classList.add('visible');
        }

        // Update clip-path positions relative to the clone overlay box, adjusting for scale
        const info = activeOverlays.get(item.element);
        if (info && info.clone) {
          const scale = 0.48;
          const localX = (e.clientX - info.rect.left) / scale;
          const localY = (e.clientY - info.rect.top) / scale;
          info.clone.style.setProperty('--lens-x', localX + 'px');
          info.clone.style.setProperty('--lens-y', localY + 'px');
        }
      }
    });

    // 3. Remove clones of elements that have left the lens circle
    activeOverlays.forEach((info, originalEl) => {
      if (!currentIntersecting.has(originalEl)) {
        removeOverlay(originalEl, info.clone);
      }
    });
  });

  // Hide the lens cursor when the mouse leaves the viewport
  document.addEventListener('mouseleave', () => {
    lens.style.display = 'none';
    clearAllOverlays();
  });

  // Re-cache text positioning on scroll and window resize actions
  window.addEventListener('scroll', () => {
    clearAllOverlays();
    rebuildTextCache();
  }, { passive: true });

  window.addEventListener('resize', () => {
    clearAllOverlays();
    rebuildTextCache();
  }, { passive: true });
})();
