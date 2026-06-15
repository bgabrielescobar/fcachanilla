/* ===================================================================
   Medicines catalog and detail — uses helpers from store.js
=================================================================== */

/* ---------- List (medicines.html) ---------- */
async function initCatalog(){
  const grid = document.getElementById('catalogGrid');
  if(!grid) return;
  const meds = await loadMedicines();
  const searchBox = document.getElementById('catSearch');
  const chips = document.getElementById('catChips');
  const counter = document.getElementById('catCount');

  const cats = ['Todos', ...new Set(meds.map(m => m.category))];
  let catFilter = 'Todos';
  chips.innerHTML = cats.map((c,i)=>
    `<button class="chip${i===0?' is-active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

  function render(){
    const q = (searchBox.value||'').toLowerCase().trim();
    const list = meds.filter(m=>{
      const okCat = catFilter==='Todos' || m.category===catFilter;
      const okQ = !q || (m.name+' '+m.category+' '+m.brand).toLowerCase().includes(q);
      return okCat && okQ;
    });
    counter.textContent = `${list.length} producto${list.length!==1?'s':''}`;
    grid.innerHTML = list.map(cardHTML).join('') ||
      `<p class="empty">No se encontraron medicamentos para "${esc(q)}".</p>`;
  }

  searchBox.addEventListener('input', render);
  chips.addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    catFilter = b.dataset.cat;
    [...chips.children].forEach(c=>c.classList.toggle('is-active', c===b));
    render();
  });

  const q0 = getParam('q');
  if(q0){ searchBox.value = q0; }
  render();
}

/* ---------- Detail (product.html) ---------- */
async function initProduct(){
  const cont = document.getElementById('productDetail');
  if(!cont) return;
  const meds = await loadMedicines();
  const med = meds.find(m => m.id === getParam('id')) || meds[0];
  document.title = `${med.name} · Farmacias Cachanilla`;

  const views = viewsOf(med);
  const discount = med.oldPrice
    ? `<span class="pd__save">Ahorras ${money(med.oldPrice-med.price)} (${Math.round((1-med.price/med.oldPrice)*100)}%)</span>` : '';

  cont.innerHTML = `
    <nav class="pd__crumbs"><a href="medicines.html">‹ Volver a medicamentos</a></nav>
    <div class="pd">
      <div class="pd__gallery">
        <div class="pd__main"><img id="pdMain" src="${views[0]}" alt="${esc(med.name)}"
             onerror="this.onerror=null;this.src='${svgImg(med,0)}'"></div>
        <div class="pd__thumbs">
          ${views.map((v,i)=>`<button class="pd__thumb${i===0?' is-active':''}" data-src="${v}"><img src="${v}" alt="Vista ${i+1}" onerror="this.onerror=null;this.src='${svgImg(med,i)}'"></button>`).join('')}
        </div>
      </div>
      <div class="pd__info">
        <span class="pd__cat">${esc(med.category)}</span>
        <h1 class="pd__name">${esc(med.name)}</h1>
        <p class="pd__brand">Marca: <strong>${esc(med.brand)}</strong> · ${esc(med.presentation)}</p>
        ${med.prescription?'<span class="pd__rx">⚠ Requiere receta médica</span>':'<span class="pd__otc">✔ Venta libre</span>'}
        <div class="pd__pricebox">
          <strong class="pd__price">${money(med.price)}</strong>
          ${med.oldPrice?`<s>${money(med.oldPrice)}</s>`:''}
          ${discount}
        </div>
        <h3 class="pd__h3">Descripción</h3>
        <p class="pd__desc">${esc(med.description)}</p>
        <div class="pd__actions">
          <button class="btn btn--add" data-add="${med.id}">🛒 Agregar al carrito</button>
          <a class="btn btn--ghost" href="medicines.html">Seguir viendo</a>
        </div>
        <p class="pd__note">Las imágenes son ilustrativas. Consulta a tu médico antes de usar cualquier medicamento.</p>
      </div>
    </div>`;

  const main = document.getElementById('pdMain');
  cont.querySelectorAll('.pd__thumb').forEach(t=>{
    t.addEventListener('click', ()=>{
      main.src = t.dataset.src;
      cont.querySelectorAll('.pd__thumb').forEach(x=>x.classList.remove('is-active'));
      t.classList.add('is-active');
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{ initCatalog(); initProduct(); });
