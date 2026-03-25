let currentIndex = 0;
const images = document.querySelectorAll('.window-frame img');
const modal = document.getElementById('img-modal');

// Find the caption belonging to a specific image by walking up to its
// nearest .demo-col or .demo-row container, then querying inside it.
function getCaptionFor(img) {
    const container = img.closest('.demo-col') || img.closest('.demo-row');
    return container ? container.querySelector('.demo-caption') : null;
}

if (images.length > 0 && modal) {

    images.forEach((img, i) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => showModal(i));
    });

    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
}

function showModal(index) {
    currentIndex = index;
    const modalImg = document.getElementById('modal-img');
    const title = document.querySelector('#modal-caption .cap-title');
    const desc = document.querySelector('#modal-caption .cap-desc');

    if (!modal || !modalImg) return;

    modalImg.src = images[index].src;

    const caption = getCaptionFor(images[index]);
    if (title) title.innerHTML = caption?.innerHTML || '';
    if (desc) desc.textContent = '';

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('img-modal');
    if (modal) modal.style.display = 'none';
}

function prevImg() {
    if (images.length === 0) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showModal(currentIndex);
}

function nextImg() {
    if (images.length === 0) return;
    currentIndex = (currentIndex + 1) % images.length;
    showModal(currentIndex);
}


// switch language 
function switchLang(lang) {
  const urls = {
    "CHANGELOG_URL": "changlog.html",
    "RSS_URL": "rss.xml", 
    "GITHUB_RELEASE_URL": "https://github.com/ninefourpark/QuickToot/releases"
  };

  document.documentElement.lang = lang;
  const key = lang.replace('-', '');

  document
    .querySelectorAll('[data-en], [data-zh-hans], [data-zh-hant]')
    .forEach(el => {
    let content = el.dataset[key];

    if (!content) content = el.dataset.zhHans;
    if (!content) return;

    Object.keys(urls).forEach(placeholder => {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      content = content.replace(regex, urls[placeholder]);
    });

    el.innerHTML = content;
  });

  // Handle Images
  document.querySelectorAll('.lang-img').forEach(img => {
    if (img.dataset[key]) img.src = img.dataset[key];
  });

  // Update the Table of Contents 
  generateToC(lang);

  // Save user choice so it persists across refresh/navigation
  try { localStorage.setItem('siteLang', lang); } catch (e) { }
}


document.addEventListener('DOMContentLoaded', () => {
  let lang = 'zh-Hans'; // Default

  try {
    const saved = localStorage.getItem('siteLang');
    if (saved) {
      lang = saved;
    } 
  } catch (e) {
    console.error("Storage error:", e);
  }

  // Now call switchLang once the DOM is definitely ready
  switchLang(lang);
});