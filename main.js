/* ===================================================================
   Farmacias Cachanilla — Home page JavaScript
=================================================================== */

/* The footer year, mobile menu and cart are handled in store.js */

/* ---------- Close the mobile menu when a link is chosen ---------- */
const navList = document.getElementById('navList');
if (navList) navList.addEventListener('click', e => {
  if (e.target.tagName === 'A') navList.classList.remove('is-open');
});

/* ---------- Active link based on scroll ---------- */
const sections = ['inicio','promociones','medicamento','quienes-somos','localizanos'];
const navLinks = [...document.querySelectorAll('.nav__list a')];
const onScroll = () => {
  let current = sections[0];
  for (const id of sections){
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 120) current = id;
  }
  navLinks.forEach(a =>
    a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
};
window.addEventListener('scroll', onScroll, { passive:true });

/* ---------- Promotions carousel ---------- */
const track = document.getElementById('bannerTrack');
const slides = [...track.children];
const dotsBox = document.getElementById('bannerDots');
let index = 0, timer;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.setAttribute('aria-label', 'Ir a la promoción ' + (i + 1));
  if (i === 0) dot.classList.add('is-active');
  dot.addEventListener('click', () => goTo(i));
  dotsBox.appendChild(dot);
});
const dots = [...dotsBox.children];

function goTo(i){
  index = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
  restart();
}
const next = () => goTo(index + 1);
const prev = () => goTo(index - 1);

document.getElementById('bannerNext').addEventListener('click', next);
document.getElementById('bannerPrev').addEventListener('click', prev);

function restart(){ clearInterval(timer); timer = setInterval(next, 5000); }
restart();

/* ---------- Brands we sell ---------- */
/* Real (verified) logos served from Wikimedia Commons, with Clearbit as a
   fallback and the brand name as a last resort. */
const wiki = file => 'https://upload.wikimedia.org/wikipedia/commons/' + file;
const clearbit = domain => `https://logo.clearbit.com/${domain}?size=128&format=png`;
const brands = [
  { name:'Pfizer',              srcs:[wiki('5/57/Pfizer_%282021%29.svg'), clearbit('pfizer.com')] },
  { name:'Bayer',               srcs:[wiki('f/f7/Logo_Bayer.svg'), clearbit('bayer.com')] },
  { name:'Sanofi',              srcs:[wiki('f/f5/Sanofi-2022.svg'), clearbit('sanofi.com')] },
  { name:'Abbott',              srcs:[wiki('a/a4/Abbott_Laboratories_logo.svg'), clearbit('abbott.com')] },
  { name:'Novartis',            srcs:[wiki('7/7c/Novartis-Logo-2023.svg'), clearbit('novartis.com')] },
  { name:'Roche',               srcs:[wiki('f/f4/F._Hoffmann-La_Roche_2021_logo.svg'), clearbit('roche.com')] },
  { name:'Boehringer Ingelheim',srcs:[wiki('7/7a/Boehringer_Ingelheim_Logo_RGB_Dark_Green.svg'), clearbit('boehringer-ingelheim.com')] },
  { name:'Genomma Lab',         srcs:[wiki('3/32/Genomma_Lab_Internacional.png'), clearbit('genommalab.com')] },
];

function createBrand(b){
  const card = document.createElement('div');
  card.className = 'brand-card';
  const img = document.createElement('img');
  img.alt = b.name;
  img.loading = 'lazy';
  let i = 0;
  img.src = b.srcs[0];
  img.onerror = () => {            // try the next source; otherwise show the name
    i++;
    if (i < b.srcs.length) img.src = b.srcs[i];
    else { card.textContent = b.name; }
  };
  card.appendChild(img);
  return card;
}

const brandsGrid = document.getElementById('brandsGrid');
// Rendered twice so the carousel loops seamlessly with no jump
[...brands, ...brands].forEach((b, idx) => {
  const card = createBrand(b);
  if (idx >= brands.length) card.setAttribute('aria-hidden', 'true'); // copy
  brandsGrid.appendChild(card);
});

/* ---------- Search box ---------- */
const searchInput = document.getElementById('searchInput');
const searchForm  = searchInput.closest('form');
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const q = searchInput.value.trim();
  // Goes to the medicines catalog, filtering by the search term
  window.location.href = 'medicines.html' + (q ? '?q=' + encodeURIComponent(q) : '');
});

/* ---------- Featured medicines (4) ---------- */
const featured = document.getElementById('featuredMeds');
if (featured && window.MEDICINES && typeof cardHTML === 'function'){
  const ids = ['paracetamol-500','ibuprofeno-400','omeprazol-20','naproxeno-250'];
  const items = ids.map(id => window.MEDICINES.find(m => m.id === id)).filter(Boolean);
  featured.innerHTML = items.map(cardHTML).join('');
}
