(function () {
  // Create and inject the Pokéball magnifying lens element
  const lens = document.createElement('div');
  lens.className = 'pokefont-lens-container';
  document.documentElement.appendChild(lens);

  let activeTarget = null;
  let activeClone = null;

  // Find nearest parent element that contains text nodes directly
  function getTargetElement(clientX, clientY) {
    let el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;

    // Tags that usually contain readable copy text
    const textTags = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'LI', 'B', 'STRONG', 'I', 'EM', 'TD', 'TH', 'LABEL', 'BUTTON', 'ARTICLE', 'SECTION'];

    while (el && el !== document.documentElement && el !== document.body) {
      // Ignore our own lens and clone elements
      if (el.classList.contains('pokefont-lens-container') || el.classList.contains('pokefont-clone-overlay')) {
        return null;
      }

      // Check if this element contains text nodes with actual text content
      const hasDirectText = Array.from(el.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0
      );

      if (hasDirectText && (textTags.includes(el.tagName) || el.innerText.trim().length > 0)) {
        return el;
      }

      el = el.parentElement;
    }
    return null;
  }

  // Remove the currently active overlay clone
  function removeActiveClone() {
    if (activeClone) {
      activeClone.remove();
      activeClone = null;
    }
    activeTarget = null;
  }

  // Handle cursor movement
  window.addEventListener('mousemove', (e) => {
    // 1. Move the Pokéball lens cursor container
    lens.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    lens.style.display = 'block';

    // 2. Identify the text element underneath the cursor
    const target = getTargetElement(e.clientX, e.clientY);

    if (target) {
      const rect = target.getBoundingClientRect();

      // If we hovered over a new text element, build its overlay clone
      if (activeTarget !== target) {
        removeActiveClone();

        activeTarget = target;

        // Clone the text content
        const clone = document.createElement('div');
        clone.className = 'pokefont-clone-overlay pokefont-clipped';
        clone.textContent = target.textContent;

        // Extract computed styles of original element to match sizes and wrap rules
        const styles = window.getComputedStyle(target);
        
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        
        clone.style.fontSize = styles.fontSize;
        clone.style.fontWeight = styles.fontWeight;
        clone.style.lineHeight = styles.lineHeight;
        clone.style.textAlign = styles.textAlign;
        clone.style.fontStyle = styles.fontStyle;
        clone.style.display = styles.display === 'inline' ? 'inline-block' : styles.display;
        
        // Match alignments & positioning details
        clone.style.paddingLeft = styles.paddingLeft;
        clone.style.paddingRight = styles.paddingRight;
        clone.style.paddingTop = styles.paddingTop;
        clone.style.paddingBottom = styles.paddingBottom;

        document.documentElement.appendChild(clone);
        activeClone = clone;

        // Force a layout pass before making visible to avoid transitions flash
        clone.offsetHeight;
        clone.classList.add('visible');
      }

      // 3. Update clip-path positions on the clone overlay relative to its own coordinate space
      if (activeClone) {
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        activeClone.style.setProperty('--lens-x', localX + 'px');
        activeClone.style.setProperty('--lens-y', localY + 'px');
      }
    } else {
      // If cursor is not hovering over readable text, clear overlays
      removeActiveClone();
    }
  });

  // Hide the lens when the mouse leaves the browser window
  document.addEventListener('mouseleave', () => {
    lens.style.display = 'none';
    removeActiveClone();
  });

  // Clear clones on scroll or resize events to avoid alignments shifting
  window.addEventListener('scroll', removeActiveClone, { passive: true });
  window.addEventListener('resize', removeActiveClone, { passive: true });
})();
