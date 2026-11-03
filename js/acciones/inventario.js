// ═══════════ ACCIONES: INVENTARIO Y VENTAS ═══════════

// Inventario
function resetPrecioVenta() {
  const sel=document.getElementById('f-vprod'); if(!sel||!sel.value) return;
  const precio=parseFloat(sel.options[sel.selectedIndex].dataset.precio)||0;
  const pi=document.getElementById('f-vprecio'); if(pi) pi.value=precio.toFixed(2);
  actualizarPrecioVenta();
}
function actualizarPrecioVenta() {
  const cant=parseInt(document.getElementById('f-vcantidad')?.value)||1;
  const precio=parseFloat(document.getElementById('f-vprecio')?.value)||0;
  const el=document.getElementById('venta-total');
  if(el) el.innerHTML=`Total: <strong style="color:var(--text);font-size:16px">$${(precio*cant).toFixed(2)}</strong>`;
}
async function saveNuevoProducto() {
  const nombre=document.getElementById('f-pnombre').value.trim();
  if(!nombre){toast('Nombre obligatorio','error');return;}
  setBtnLoading('save-btn',true);
  await db.from('productos').insert({nombre,categoria:document.getElementById('f-pcat').value,costo:parseFloat(document.getElementById('f-pcosto').value)||0,precio_venta:parseFloat(document.getElementById('f-pprecio').value)||0,stock:parseInt(document.getElementById('f-pstock').value)||0,stock_minimo:parseInt(document.getElementById('f-pmin').value)||5});
  toast('Producto creado ✓','ok'); closeModal(); await loadAll();
}
async function saveEditarProducto(id) {
  setBtnLoading('save-btn',true);
  await db.from('productos').update({nombre:document.getElementById('f-pnombre').value,categoria:document.getElementById('f-pcat').value,costo:parseFloat(document.getElementById('f-pcosto').value)||0,precio_venta:parseFloat(document.getElementById('f-pprecio').value)||0,stock:parseInt(document.getElementById('f-pstock').value)||0,stock_minimo:parseInt(document.getElementById('f-pmin').value)||5}).eq('id',id);
  toast('Actualizado ✓','ok'); closeModal(); await loadAll();
}
async function eliminarProducto(id) {
  if(!confirm('¿Eliminar este producto?')) return;
  await db.from('productos').delete().eq('id',id);
  toast('Eliminado'); closeModal(); await loadAll();
}
async function reponerStock(id, stockActual) {
  const cantidad=parseInt(document.getElementById('f-reponer').value)||0;
  if(cantidad<=0){toast('Cantidad inválida','error');return;}
  setBtnLoading('save-btn',true);
  await db.from('productos').update({stock:stockActual+cantidad}).eq('id',id);
  toast(`+${cantidad} unidades ✓`,'ok'); closeModal(); await loadAll();
}
async function registrarVentaRapida(productoId) {
  const p=state.productos.find(x=>x.id===productoId);
  const cantidad=parseInt(document.getElementById('f-vcantidad').value)||1;
  if(cantidad>p.stock){toast('Stock insuficiente','error');return;}
  setBtnLoading('save-btn',true);
  const total=cantidad*p.precio_venta;
  await db.from('ventas').insert({producto_id:productoId,cantidad,precio_venta:p.precio_venta,costo:p.costo,total});
  await db.from('productos').update({stock:p.stock-cantidad}).eq('id',productoId);
  toast(`Venta $${total.toFixed(2)} ✓`,'ok'); closeModal(); await loadAll();
}
async function registrarVenta() {
  const prodId=parseInt(document.getElementById('f-vprod').value); if(!prodId){toast('Selecciona producto','error');return;}
  const p=state.productos.find(x=>x.id===prodId);
  const cantidad=parseInt(document.getElementById('f-vcantidad').value)||1;
  const precio=parseFloat(document.getElementById('f-vprecio').value)||p.precio_venta;
  if(cantidad>p.stock){toast('Stock insuficiente','error');return;}
  setBtnLoading('save-btn',true);
  const total=cantidad*precio;
  await db.from('ventas').insert({producto_id:prodId,cantidad,precio_venta:precio,costo:p.costo,total});
  await db.from('productos').update({stock:p.stock-cantidad}).eq('id',prodId);
  toast(`Venta $${total.toFixed(2)} ✓`,'ok'); closeModal(); await loadAll();
}

