let currentIndex = 0;
const images = document.querySelectorAll('.masonry-item img');
const captions = document.querySelectorAll('.masonry-item .caption');
const modal = document.getElementById('img-modal');

// Only add event listeners if the images and modal actually exist on the current page
if (images.length > 0 && modal) {
    
    images.forEach((img, i) => {
        img.addEventListener('click', () => showModal(i));
    });

    modal.addEventListener('click', e => {
        if (e.target.id === 'img-modal') closeModal();
    });
}

function showModal(index) {
    currentIndex = index;
    const modalImg = document.getElementById('modal-img');
    const title = document.querySelector('#modal-caption .cap-title');
    const desc = document.querySelector('#modal-caption .cap-desc');

    // Extra safety check
    if (!modal || !modalImg) return;

    modalImg.src = images[index].src;
    const cap = captions[index] ? captions[index].querySelectorAll('p') : [];

    if (title) title.textContent = cap[0]?.textContent || '';
    if (desc) desc.textContent = cap[1]?.textContent || '';

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


// swithc language 
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

    if (!content) content = el.dataset.en ;
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
    } else {
      const nav = navigator.language || 'zh-Hans';
      if (nav.startsWith('en')) lang = 'en';
      else if (nav.startsWith('zh')) {
        if (/TW|HK|MO|Hant/i.test(nav)) lang = 'zh-Hant';
      }
    }
  } catch (e) {
    console.error("Storage error:", e);
  }

  // Now call switchLang once the DOM is definitely ready
  switchLang(lang);
});
