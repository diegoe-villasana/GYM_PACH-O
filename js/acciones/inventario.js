// ═══════════ ACCIONES: INVENTARIO Y VENTAS ═══════════

// Comisión de la terminal por pago con tarjeta (3.5%)
const COMISION_TARJETA = 0.035;

function calcComision(total, metodo) {
  return metodo==='tarjeta' ? Math.round(total*COMISION_TARJETA*100)/100 : 0;
}
// Ganancia real de una venta: margen del producto menos la comisión (si fue con tarjeta)
function gananciaVenta(v) {
  return (Number(v.precio_venta)-Number(v.costo))*Number(v.cantidad) - Number(v.comision||0);
}
function campoMetodoPago() {
  return `<div class="form-group"><label class="form-label">Método de pago</label>
      <select class="form-input" id="f-vpago" onchange="actualizarPrecioVenta()">
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta (comisión ${(COMISION_TARJETA*100).toFixed(1)}%)</option>
      </select></div>`;
}

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
  const prod=state.productos.find(x=>x.id==document.getElementById('f-vprod')?.value);
  const metodo=document.getElementById('f-vpago')?.value==='tarjeta'?'tarjeta':'efectivo';
  const total=precio*cant;
  const comision=calcComision(total,metodo);
  const el=document.getElementById('venta-total');
  if(!el) return;
  let html=`Total: <strong style="color:var(--text);font-size:16px">$${total.toFixed(2)}</strong>`;
  if(comision>0) html+=`<div style="font-size:12px;margin-top:4px">Comisión tarjeta: <span style="color:var(--red)">-$${comision.toFixed(2)}</span></div>`;
  if(prod) html+=`<div style="font-size:12px;margin-top:2px">Ganancia: <strong style="color:var(--green)">$${((precio-Number(prod.costo))*cant-comision).toFixed(2)}</strong></div>`;
  el.innerHTML=html;
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
  const metodo=document.getElementById('f-vpago')?.value==='tarjeta'?'tarjeta':'efectivo';
  setBtnLoading('save-btn',true);
  const total=cantidad*p.precio_venta;
  const comision=calcComision(total,metodo);
  const {error}=await db.from('ventas').insert({producto_id:productoId,cantidad,precio_venta:p.precio_venta,costo:p.costo,total,metodo_pago:metodo,comision});
  if(error){toast('Error al registrar la venta: '+error.message,'error');setBtnLoading('save-btn',false);return;}
  await db.from('productos').update({stock:p.stock-cantidad}).eq('id',productoId);
  toast(`Venta $${total.toFixed(2)} (${metodo}) ✓`,'ok'); closeModal(); await loadAll();
}
async function registrarVenta() {
  const prodId=parseInt(document.getElementById('f-vprod').value); if(!prodId){toast('Selecciona producto','error');return;}
  const p=state.productos.find(x=>x.id===prodId);
  const cantidad=parseInt(document.getElementById('f-vcantidad').value)||1;
  const precio=parseFloat(document.getElementById('f-vprecio').value)||p.precio_venta;
  if(cantidad>p.stock){toast('Stock insuficiente','error');return;}
  const metodo=document.getElementById('f-vpago')?.value==='tarjeta'?'tarjeta':'efectivo';
  setBtnLoading('save-btn',true);
  const total=cantidad*precio;
  const comision=calcComision(total,metodo);
  const {error}=await db.from('ventas').insert({producto_id:prodId,cantidad,precio_venta:precio,costo:p.costo,total,metodo_pago:metodo,comision});
  if(error){toast('Error al registrar la venta: '+error.message,'error');setBtnLoading('save-btn',false);return;}
  await db.from('productos').update({stock:p.stock-cantidad}).eq('id',prodId);
  toast(`Venta $${total.toFixed(2)} (${metodo}) ✓`,'ok'); closeModal(); await loadAll();
}

