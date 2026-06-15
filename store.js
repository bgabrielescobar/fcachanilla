/* ===================================================================
   Store — Farmacias Cachanilla (shared module used on every page)
   - Data and product-image helpers.
   - Shopping cart that is sent as a WhatsApp order.
=================================================================== */

const WA = '526863495716'; // Pharmacy WhatsApp number

/* ---------- Load data ---------- */
async function loadMedicines(){
  try{
    const res = await fetch('medicines.json', { cache:'no-store' });
    if(res.ok) return await res.json();
    throw new Error('not ok');
  }catch(e){
    if(window.MEDICINES) return window.MEDICINES; // file:// fallback
    throw e;
  }
}
const allMedicines = () => window.MEDICINES || [];
const medById = id => allMedicines().find(m => m.id === id);

/* ---------- Utilities ---------- */
const money = n => '$' + Number(n).toFixed(2);
const esc = s => String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
const getParam = k => new URLSearchParams(location.search).get(k);

/* ---------- Product images ---------- */
function productImg(med, variant=0){
  if(med.images && med.images.length) return med.images[variant % med.images.length];
  return svgImg(med, variant);
}
function viewsOf(med){
  const real = (med.images || []).slice();
  const svgs = [svgImg(med,0), svgImg(med,1), svgImg(med,2)];
  if(!real.length) return svgs;
  return real.concat(svgs).slice(0, Math.max(3, real.length));
}
function shade(hex, amt){
  const n = parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  const f = amt<0 ? v=>Math.round(v*(1+amt)) : v=>Math.round(v+(255-v)*amt);
  return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function svgImg(med, variant=0){
  const c = med.color || '#2456b8';
  const dark = shade(c, -0.25), light = shade(c, 0.85);
  const name = med.name.toUpperCase();
  const dose = name.split(' ').filter(p => /mg|ml|g/i.test(p)).join(' ');
  const title = name.replace(dose,'').trim();
  const rx = med.prescription ? `<g><circle cx="500" cy="92" r="34" fill="#fff"/><text x="500" y="104" font-family="Poppins,Arial" font-weight="800" font-size="34" fill="${c}" text-anchor="middle">℞</text></g>` : '';
  let svg;
  if(variant === 1){
    // Tablet blister
    let pills = '';
    for(let r=0;r<3;r++) for(let col=0;col<4;col++){
      const x=150+col*80, y=170+r*90;
      pills += `<rect x="${x-30}" y="${y-30}" width="60" height="60" rx="14" fill="#eef2f8" stroke="#d7e0ee"/><circle cx="${x}" cy="${y}" r="20" fill="${light}" stroke="${c}" stroke-width="2"/>`;
    }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f3f7fd"/><rect x="90" y="110" width="420" height="380" rx="24" fill="#ffffff" stroke="#e3eaf5"/>${pills}<text x="300" y="540" font-family="Poppins,Arial" font-weight="700" font-size="30" fill="${dark}" text-anchor="middle">${esc(title)} ${esc(dose)}</text></svg>`;
  } else if(variant === 2){
    // Capsule on a colored background
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="${c}"/><rect width="600" height="600" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.18"/></linearGradient></defs><g transform="rotate(-25 300 300)"><rect x="180" y="250" width="240" height="100" rx="50" fill="#ffffff"/><rect x="180" y="250" width="120" height="100" rx="50" fill="${light}"/><line x1="300" y1="250" x2="300" y2="350" stroke="${dark}" stroke-width="3"/></g><text x="300" y="500" font-family="Poppins,Arial" font-weight="800" font-size="38" fill="#fff" text-anchor="middle">${esc(title)}</text><text x="300" y="545" font-family="Inter,Arial" font-weight="600" font-size="26" fill="#ffffff" opacity="0.9" text-anchor="middle">${esc(dose)}</text></svg>`;
  } else {
    // Front of the box (default)
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f3f7fd"/><rect x="120" y="70" width="360" height="460" rx="20" fill="#ffffff" stroke="#e3eaf5" stroke-width="2"/><rect x="120" y="70" width="360" height="120" rx="20" fill="${c}"/><rect x="120" y="150" width="360" height="40" fill="${c}"/>${rx}<g transform="translate(160 110)"><rect x="-8" y="-22" width="16" height="44" rx="4" fill="#ffffff"/><rect x="-22" y="-8" width="44" height="16" rx="4" fill="#ffffff"/></g><text x="300" y="270" font-family="Poppins,Arial" font-weight="800" font-size="40" fill="${dark}" text-anchor="middle">${esc(title)}</text><text x="300" y="320" font-family="Poppins,Arial" font-weight="700" font-size="34" fill="${c}" text-anchor="middle">${esc(dose)}</text><line x1="170" y1="360" x2="430" y2="360" stroke="#e3eaf5" stroke-width="2"/><text x="300" y="410" font-family="Inter,Arial" font-weight="500" font-size="22" fill="#5b6477" text-anchor="middle">${esc(med.category)}</text><text x="300" y="500" font-family="Nunito,Arial" font-weight="700" font-size="22" fill="${dark}" text-anchor="middle">FARMACIAS CACHANILLA</text></svg>`;
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ---------- Reusable product card ---------- */
function cardHTML(m){
  return `<article class="card">
    ${m.prescription?'<span class="card__rx">Receta</span>':''}
    ${m.oldPrice?`<span class="card__save">-${Math.round((1-m.price/m.oldPrice)*100)}%</span>`:''}
    <a class="card__link" href="product.html?id=${encodeURIComponent(m.id)}">
      <div class="card__img"><img src="${productImg(m,0)}" alt="${esc(m.name)}" loading="lazy" onerror="this.onerror=null;this.src='${svgImg(m,0)}'"></div>
      <div class="card__body">
        <span class="card__cat">${esc(m.category)}</span>
        <h3 class="card__name">${esc(m.name)}</h3>
        <p class="card__pres">${esc(m.presentation)}</p>
        <div class="card__price"><strong>${money(m.price)}</strong>${m.oldPrice?`<s>${money(m.oldPrice)}</s>`:''}</div>
      </div>
    </a>
    <button class="card__add" data-add="${m.id}">🛒 Agregar</button>
  </article>`;
}

/* ===================================================================
   CART (sent as a WhatsApp order)
=================================================================== */
const CART_KEY = 'cachanilla_cart';
const getCart  = () => { try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } };
const setCart  = c => { localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); };

function addToCart(id, qty=1){
  const cart = getCart();
  const row = cart.find(r => r.id === id);
  if(row) row.qty += qty; else cart.push({ id, qty });
  setCart(cart);
  openCart(true);
}
function setQty(id, qty){
  let cart = getCart();
  const row = cart.find(r => r.id === id);
  if(!row) return;
  row.qty = qty;
  if(row.qty <= 0) cart = cart.filter(r => r.id !== id);
  setCart(cart);
}
const cartCount = () => getCart().reduce((s,r)=>s+r.qty,0);
const cartTotal = () => getCart().reduce((s,r)=>{ const m=medById(r.id); return s + (m? m.price*r.qty : 0); },0);

function whatsappMessage(){
  const cart = getCart();
  if(!cart.length) return '';
  const lines = cart.map(r=>{
    const m = medById(r.id); if(!m) return '';
    return `• ${r.qty} x ${m.name} (${m.presentation}) — ${money(m.price*r.qty)}`;
  }).filter(Boolean);
  return `¡Hola Farmacias Cachanilla! 🛒\n`+
         `Quiero hacer el siguiente pedido:\n\n`+
         `${lines.join('\n')}\n\n`+
         `Total estimado: ${money(cartTotal())}\n\n`+
         `¿Me confirman disponibilidad y total final? Paso a pagar/recoger. ¡Gracias!`;
}

/* ----- Cart UI (built on each page automatically) ----- */
function mountCart(){
  if(document.getElementById('cartBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'cartBtn'; btn.className = 'cartbtn'; btn.setAttribute('aria-label','Ver carrito');
  btn.innerHTML = `🛒<span class="cartbtn__badge" id="cartBadge">0</span>`;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="cart-overlay" id="cartOverlay"></div>
    <aside class="cart" id="cartDrawer" aria-hidden="true">
      <header class="cart__head">
        <h3>Tu pedido 🛒</h3>
        <button class="cart__close" id="cartClose" aria-label="Cerrar">✕</button>
      </header>
      <div class="cart__items" id="cartItems"></div>
      <footer class="cart__foot">
        <div class="cart__total"><span>Total estimado</span><strong id="cartTotal">$0.00</strong></div>
        <a class="btn btn--wa cart__send" id="cartSend" target="_blank" rel="noopener">💬 Enviar pedido por WhatsApp</a>
        <button class="cart__clear" id="cartClear">Vaciar carrito</button>
        <p class="cart__note">Envías tu lista por WhatsApp y el personal te arma el pedido y confirma el total. Solo llegas a pagar o recoger. 💙</p>
      </footer>
    </aside>`;

  document.body.appendChild(btn);
  document.body.appendChild(wrap);

  btn.addEventListener('click', ()=>openCart());
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('cartClear').addEventListener('click', ()=>{ setCart([]); });

  // Controls inside the cart (event delegation)
  document.getElementById('cartItems').addEventListener('click', e=>{
    const b = e.target.closest('[data-act]'); if(!b) return;
    const id = b.dataset.id, cart = getCart(), row = cart.find(r=>r.id===id);
    if(!row) return;
    if(b.dataset.act==='more')   setQty(id, row.qty+1);
    if(b.dataset.act==='less')   setQty(id, row.qty-1);
    if(b.dataset.act==='remove') setQty(id, 0);
  });

  renderCart();
}

function openCart(force){
  const d = document.getElementById('cartDrawer'), o = document.getElementById('cartOverlay');
  if(!d) return;
  if(force && d.classList.contains('is-open')) { renderCart(); return; }
  d.classList.add('is-open'); o.classList.add('is-open'); d.setAttribute('aria-hidden','false');
}
function closeCart(){
  const d = document.getElementById('cartDrawer'), o = document.getElementById('cartOverlay');
  if(!d) return;
  d.classList.remove('is-open'); o.classList.remove('is-open'); d.setAttribute('aria-hidden','true');
}

function renderCart(){
  const badge = document.getElementById('cartBadge'); if(badge){ badge.textContent = cartCount(); badge.style.display = cartCount()? 'grid':'none'; }
  const list = document.getElementById('cartItems'); if(!list) return;
  const cart = getCart();
  if(!cart.length){
    list.innerHTML = `<p class="cart__empty">Tu carrito está vacío.<br>Agrega medicamentos y envíalos por WhatsApp. 🛒</p>`;
  } else {
    list.innerHTML = cart.map(r=>{
      const m = medById(r.id); if(!m) return '';
      return `<div class="citem">
        <img class="citem__img" src="${productImg(m,0)}" alt="${esc(m.name)}" onerror="this.onerror=null;this.src='${svgImg(m,0)}'">
        <div class="citem__info">
          <h4>${esc(m.name)}</h4>
          <span>${money(m.price)} c/u</span>
          <div class="citem__qty">
            <button data-act="less" data-id="${m.id}" aria-label="Quitar uno">−</button>
            <b>${r.qty}</b>
            <button data-act="more" data-id="${m.id}" aria-label="Agregar uno">+</button>
            <button class="citem__del" data-act="remove" data-id="${m.id}" aria-label="Eliminar">🗑</button>
          </div>
        </div>
        <strong class="citem__line">${money(m.price*r.qty)}</strong>
      </div>`;
    }).join('');
  }
  const total = document.getElementById('cartTotal'); if(total) total.textContent = money(cartTotal());
  const send = document.getElementById('cartSend');
  if(send){
    if(cart.length){ send.classList.remove('is-disabled'); send.href = `https://wa.me/${WA}?text=${encodeURIComponent(whatsappMessage())}`; }
    else { send.classList.add('is-disabled'); send.removeAttribute('href'); }
  }
}

/* ---------- Common startup (all pages) ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
  const t = document.getElementById('navToggle'), l = document.getElementById('navList');
  if(t && l) t.addEventListener('click', ()=>l.classList.toggle('is-open'));
  mountCart();
});

/* "Add" button anywhere (global delegation) */
document.addEventListener('click', e=>{
  const add = e.target.closest('[data-add]');
  if(!add) return;
  e.preventDefault();
  addToCart(add.dataset.add);
  add.classList.add('added');
  setTimeout(()=>add.classList.remove('added'), 700);
});
