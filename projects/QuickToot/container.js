// Initial language
let currentLang = 'en';

function generateToC(lang) {
  const tocContainers = document.querySelectorAll(".auto-toc");
  const contentArea = document.getElementById("main-content");
  
  if (!tocContainers.length || !contentArea) return;

  const headings = contentArea.querySelectorAll("h2, h3");
  const key = lang.replace('-', '');
  
  // Clear all containers
  tocContainers.forEach(c => c.innerHTML = "");

  headings.forEach((heading) => {
    if (!heading.id) {
      const fallback = heading.dataset.en || heading.textContent;
      heading.id = fallback.toLowerCase().trim().replace(/\s+/g, "-").substring(0, 30);
    }

    const levelClass = heading.tagName.toLowerCase() === "h2" ? "level-1" : "level-2";
    let titleText = heading.dataset[key] || heading.dataset.en || heading.childNodes[0].textContent.trim();
    titleText = titleText.replace(/<[^>]*>?/gm, '');

    // Build the HTML string for one item
    const tocItemHTML = `
      <div class="toc-item ${levelClass}">
        <a href="#${heading.id}">${titleText}</a>
      </div>
    `;

    // Append the HTML to EVERY container found
    tocContainers.forEach(container => {
      container.insertAdjacentHTML('beforeend', tocItemHTML);
    });
  });

  // Re-attach the mobile-close listener to all new links
  document.querySelectorAll('.auto-toc a').forEach(link => {
    link.addEventListener('click', () => {
      const mobileContainer = document.getElementById('toc-mobile-container');
      if (mobileContainer) mobileContainer.open = false;
    });
  });
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem('siteLang') || 'en';
  switchLang(savedLang);
});

