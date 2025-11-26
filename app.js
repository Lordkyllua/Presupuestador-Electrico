// Estado de la aplicación
let estado = {
    precios: {},
    configUsuario: {},
    presupuestoActual: {
        info: {},
        items: [],
        totales: {}
    },
    pasoActual: 0
};

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    await inicializarApp();
});

async function inicializarApp() {
    try {
        mostrarCargando(true);
        
        // Inicializar configuración de usuario
        estado.configUsuario = userSettings.obtenerConfiguracion();
        aplicarConfiguracionUI();
        
        // Inicializar sistema de precios
        estado.precios = await priceUpdater.inicializar();
        estado.ultimaActualizacion = priceUpdater.ultimaActualizacion;
        
        // Inicializar UI
        inicializarEventListeners();
        actualizarUI();
        actualizarUIEstadoPrecios();
        
        mostrarCargando(false);
        Helpers.mostrarNotificacion('Aplicación cargada correctamente', 'success');
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        mostrarCargando(false);
        Helpers.mostrarNotificacion('Error al cargar la aplicación: ' + error.message, 'error');
    }
}

// Sistema de configuración de usuario
function aplicarConfiguracionUI() {
    if (estado.configUsuario.nombreEmpresa) {
        document.getElementById('nombre-empresa').value = estado.configUsuario.nombreEmpresa;
    }
    if (estado.configUsuario.descuentoPredeterminado) {
        document.getElementById('descuento-default').value = estado.configUsuario.descuentoPredeterminado;
        document.getElementById('descuento-presupuesto').value = estado.configUsuario.descuentoPredeterminado;
    }
    if (estado.configUsuario.contacto) {
        document.getElementById('contacto-empresa').value = estado.configUsuario.contacto;
    }
    if (estado.configUsuario.logo) {
        mostrarLogoPreview();
        document.getElementById('btn-eliminar-logo').style.display = 'inline-block';
    }
}

async function guardarConfiguracion() {
    const config = {
        nombreEmpresa: document.getElementById('nombre-empresa').value,
        descuentoPredeterminado: parseInt(document.getElementById('descuento-default').value) || 0,
        contacto: document.getElementById('contacto-empresa').value
    };
    
    // Manejar logo
    const logoInput = document.getElementById('logo-empresa');
    if (logoInput.files[0]) {
        try {
            const logoDataURL = await Helpers.cargarImagenComoDataURL(logoInput.files[0]);
            const logoComprimido = await Helpers.comprimirImagen(logoDataURL);
            config.logo = logoComprimido;
        } catch (error) {
            Helpers.mostrarNotificacion('Error procesando el logo', 'error');
        }
    }
    
    const resultado = userSettings.guardarConfiguracion(config);
    estado.configUsuario = userSettings.obtenerConfiguracion();
    
    if (resultado) {
        aplicarConfiguracionUI();
        Helpers.mostrarNotificacion('Configuración guardada correctamente', 'success');
    } else {
        Helpers.mostrarNotificacion('Error guardando la configuración', 'error');
    }
}

function eliminarLogo() {
    userSettings.eliminarLogo();
    estado.configUsuario = userSettings.obtenerConfiguracion();
    document.getElementById('logo-preview').innerHTML = '';
    document.getElementById('btn-eliminar-logo').style.display = 'none';
    document.getElementById('logo-empresa').value = '';
    Helpers.mostrarNotificacion('Logo eliminado correctamente', 'success');
}

function mostrarLogoPreview() {
    const preview = document.getElementById('logo-preview');
    if (estado.configUsuario.logo) {
        preview.innerHTML = `<img src="${estado.configUsuario.logo}" alt="Logo preview">`;
        document.getElementById('btn-eliminar-logo').style.display = 'inline-block';
    }
}

function cargarConfiguracionDemo() {
    document.getElementById('nombre-empresa').value = 'Electricidad DC Ejemplo';
    document.getElementById('descuento-default').value = '5';
    document.getElementById('descuento-presupuesto').value = '5';
    document.getElementById('contacto-empresa').value = '11-1234-5678 | info@electricidaddc.com';
    Helpers.mostrarNotificacion('Configuración demo cargada', 'info');
}

// Sistema de navegación
function siguientePaso(paso) {
    // Validar datos antes de avanzar
    if (paso === 2 && !validarPaso1()) return;
    if (paso === 3 && !validarPaso2()) return;
    
    estado.pasoActual = paso;
    
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`step-${paso}`).classList.add('active');
    document.querySelector(`[data-step="${paso}"]`).classList.add('active');
    
    if (paso === 2) {
        generarCategoriasTrabajos();
        actualizarResumenRapido();
    }
    if (paso === 3) generarResumen();
}

function validarPaso1() {
    const cliente = document.getElementById('cliente-nombre').value;
    const trabajo = document.getElementById('trabajo-descripcion').value;
    
    if (!cliente || !trabajo) {
        Helpers.mostrarNotificacion('Por favor completa todos los campos obligatorios', 'error');
        return false;
    }
    
    // Guardar información del presupuesto
    estado.presupuestoActual.info = {
        cliente: cliente,
        descripcion: trabajo,
        descuento: parseInt(document.getElementById('descuento-presupuesto').value) || 0,
        validez: document.getElementById('validez-presupuesto').value || Helpers.obtenerFechaValidezDefault()
    };
    
    return true;
}

function validarPaso2() {
    const itemsConCantidad = estado.presupuestoActual.items.filter(item => item.cantidad > 0);
    if (itemsConCantidad.length === 0) {
        Helpers.mostrarNotificacion('Debes seleccionar al menos un trabajo o concepto', 'error');
        return false;
    }
    return true;
}

// Generación de categorías y items
function generarCategoriasTrabajos() {
    const container = document.getElementById('categorias-trabajos');
    container.innerHTML = '';
    
    const categorias = {
        "servicios_basicos": "🛠️ Obra Completa & Servicios Básicos",
        "canalizacion": "🔌 Canalización & Cableado", 
        "puntos_tomas": "⚡ Puntos y Tomas",
        "tableros": "🔋 Tableros",
        "artefactos": "💡 Artefactos de Iluminación"
    };
    
    for (const [key, titulo] of Object.entries(categorias)) {
        if (estado.precios[key]) {
            const categoriaHTML = crearCategoriaHTML(key, titulo, estado.precios[key]);
            container.innerHTML += categoriaHTML;
        }
    }
    
    // Agregar event listeners
    document.querySelectorAll('.cantidad-input').forEach(input => {
        input.addEventListener('input', actualizarItemPresupuesto);
    });
    
    // Aplicar filtros y búsqueda
    document.getElementById('buscar-item').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
}

function crearCategoriaHTML(id, titulo, items) {
    let html = `
        <details class="categoria" id="cat-${id}" data-categoria="${id}">
            <summary>${titulo} <small>(${items.length} items)</small></summary>
            <div class="categoria-items">
    `;
    
    items.forEach(item => {
        const itemExistente = estado.presupuestoActual.items.find(i => i.id === item.id);
        const cantidad = itemExistente ? itemExistente.cantidad : 0;
        const subtotal = item.precio * cantidad;
        
        html += `
            <div class="item-cotizacion" data-id="${item.id}" data-categoria="${id}">
                <div class="descripcion">${item.descripcion}</div>
                <div class="precio-unitario">$ ${Helpers.formatearPrecio(item.precio)}</div>
                <div class="cantidad">
                    <input type="number" class="cantidad-input" min="0" value="${cantidad}" 
                           data-precio="${item.precio}" data-id="${item.id}">
                </div>
                <div class="subtotal">$ ${Helpers.formatearPrecio(subtotal)}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </details>
    `;
    
    return html;
}

function actualizarItemPresupuesto(event) {
    const input = event.target;
    const itemId = input.dataset.id;
    const precio = parseInt(input.dataset.precio);
    const cantidad = parseInt(input.value) || 0;
    const subtotal = precio * cantidad;
    
    // Actualizar UI del item
    const itemElement = input.closest('.item-cotizacion');
    itemElement.querySelector('.subtotal').textContent = `$ ${Helpers.formatearPrecio(subtotal)}`;
    
    // Actualizar estado
    const itemIndex = estado.presupuestoActual.items.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
        if (cantidad > 0) {
            estado.presupuestoActual.items[itemIndex] = {
                ...estado.presupuestoActual.items[itemIndex],
                cantidad: cantidad,
                subtotal: subtotal
            };
        } else {
            estado.presupuestoActual.items.splice(itemIndex, 1);
        }
    } else if (cantidad > 0) {
        // Buscar la descripción completa en los precios
        let descripcion = '';
        for (const categoria of Object.values(estado.precios)) {
            const item = categoria.find(i => i.id === itemId);
            if (item) {
                descripcion = item.descripcion;
                break;
            }
        }
        
        estado.presupuestoActual.items.push({
            id: itemId,
            descripcion: descripcion,
            precio: precio,
            cantidad: cantidad,
            subtotal: subtotal
        });
    }
    
    actualizarResumenRapido();
}

function aplicarFiltros() {
    const searchTerm = document.getElementById('buscar-item').value.toLowerCase();
    const categoriaFiltro = document.getElementById('filtro-categoria').value;
    
    document.querySelectorAll('.item-cotizacion').forEach(item => {
        const descripcion = item.querySelector('.descripcion').textContent.toLowerCase();
        const categoria = item.dataset.categoria;
        
        const coincideBusqueda = !searchTerm || descripcion.includes(searchTerm);
        const coincideCategoria = !categoriaFiltro || categoria === categoriaFiltro;
        
        if (coincideBusqueda && coincideCategoria) {
            item.style.display = 'grid';
            // Abrir categoría padre si está cerrada
            const categoriaElement = item.closest('.categoria');
            if (searchTerm || categoriaFiltro) {
                categoriaElement.open = true;
            }
        } else {
            item.style.display = 'none';
        }
    });
}

function actualizarResumenRapido() {
    const itemsCount = estado.presupuestoActual.items.length;
    const subtotal = estado.presupuestoActual.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    document.getElementById('contador-items').textContent = itemsCount;
    document.getElementById('subtotal-rapido').textContent = Helpers.formatearPrecio(subtotal);
}

// Generación de resumen
function generarResumen() {
    const container = document.getElementById('resumen-presupuesto');
    const { info, items } = estado.presupuestoActual;
    
    let html = `
        <div class="info-box">
            <h3>📋 Información del Presupuesto</h3>
            <p><strong>Cliente:</strong> ${info.cliente}</p>
            <p><strong>Trabajo:</strong> ${info.descripcion}</p>
            <p><strong>Válido hasta:</strong> ${Helpers.formatearFecha(info.validez)}</p>
            <p><strong>Descuento aplicado:</strong> ${info.descuento}%</p>
        </div>
        
        <h3>📦 Detalle del Presupuesto:</h3>
        <div class="resumen-items">
    `;
    
    let subtotal = 0;
    
    if (items.length === 0) {
        html += `<div class="info-box"><p>No hay items seleccionados</p></div>`;
    } else {
        items.forEach(item => {
            html += `
                <div class="resumen-item">
                    <div class="descripcion">${item.descripcion} (x${item.cantidad})</div>
                    <div class="precio-unitario">$ ${Helpers.formatearPrecio(item.precio)} c/u</div>
                    <div class="subtotal">$ ${Helpers.formatearPrecio(item.subtotal)}</div>
                </div>
            `;
            subtotal += item.subtotal;
        });
    }
    
    const descuentoMonto = subtotal * (info.descuento / 100);
    const total = subtotal - descuentoMonto;
    
    html += `
        </div>
        <div class="resumen-totales">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>$ ${Helpers.formatearPrecio(subtotal)}</span>
            </div>
            <div class="total-line">
                <span>Descuento (${info.descuento}%):</span>
                <span>$ -${Helpers.formatearPrecio(descuentoMonto)}</span>
            </div>
            <div class="total-line total-final">
                <span>TOTAL:</span>
                <span>$ ${Helpers.formatearPrecio(total)}</span>
            </div>
        </div>
    `;
    
    // Guardar totales para el PDF
    estado.presupuestoActual.totales = { subtotal, descuentoMonto, total };
    
    container.innerHTML = html;
}


// Generación de PDF - Versión corregida
async function generarPDF() {
    try {
        // Validar que haya datos para el PDF
        if (!estado.presupuestoActual.info.cliente || estado.presupuestoActual.items.length === 0) {
            Helpers.mostrarNotificacion('No hay datos suficientes para generar el PDF', 'error');
            return;
        }

        // Mostrar mensaje de generación
        Helpers.mostrarNotificacion('Generando PDF...', 'info');

        // Pequeño delay para que se vea el mensaje
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generar el PDF
        const pdfDoc = pdfGenerator.generarPresupuesto(
            estado.presupuestoActual, 
            estado.configUsuario
        );

        // Crear nombre de archivo seguro
        const nombreCliente = estado.presupuestoActual.info.cliente
            .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        const nombreArchivo = `Presupuesto_${nombreCliente}`;

        // Descargar el PDF
        pdfGenerator.descargar(nombreArchivo);

        Helpers.mostrarNotificacion('PDF generado correctamente', 'success');

    } catch (error) {
        console.error('Error generando PDF:', error);
        
        let mensajeError = 'Error generando el PDF';
        if (error.message.includes('jsPDF')) {
            mensajeError += '. La librería PDF no está cargada correctamente.';
        } else if (error.message.includes('addImage')) {
            mensajeError += '. Problema con el logo de la empresa.';
        } else {
            mensajeError += ': ' + error.message;
        }
        
        Helpers.mostrarNotificacion(mensajeError, 'error');
    }
}

function limpiarPresupuesto() {
    estado.presupuestoActual = {
        info: {},
        items: [],
        totales: {}
    };
    
    // Limpiar formularios
    document.getElementById('cliente-nombre').value = '';
    document.getElementById('trabajo-descripcion').value = '';
    document.getElementById('descuento-presupuesto').value = estado.configUsuario.descuentoPredeterminado || 0;
    document.getElementById('validez-presupuesto').value = Helpers.obtenerFechaValidezDefault();
    
    // Volver al paso 1
    siguientePaso(1);
    Helpers.mostrarNotificacion('Presupuesto reiniciado', 'info');
}

// Sistema de precios
async function actualizarPreciosManual() {
    try {
        document.getElementById('estado-precios').textContent = 'Actualizando precios...';
        await priceUpdater.forzarActualizacion();
        
        estado.precios = priceUpdater.obtenerPrecios();
        estado.ultimaActualizacion = priceUpdater.ultimaActualizacion;
        
        actualizarUIEstadoPrecios();
        
        // Regenerar categorías si estamos en el paso 2
        if (estado.pasoActual === 2) {
            generarCategoriasTrabajos();
        }
        
        Helpers.mostrarNotificacion('Precios actualizados correctamente', 'success');
    } catch (error) {
        document.getElementById('estado-precios').textContent = 'Error al actualizar precios';
        Helpers.mostrarNotificacion('Error actualizando precios: ' + error.message, 'error');
    }
}

function actualizarUIEstadoPrecios() {
    const estadoElement = document.getElementById('estado-precios');
    const versionElement = document.getElementById('version-precios');
    
    if (estado.ultimaActualizacion) {
        const fecha = Helpers.formatearFecha(estado.ultimaActualizacion);
        const estadoPrecios = priceUpdater.obtenerEstado();
        
        let estadoTexto = '';
        switch (estadoPrecios.estado) {
            case 'actualizado':
                estadoTexto = `Precios actualizados al: ${fecha}`;
                break;
            case 'cache':
                estadoTexto = `Precios en cache del: ${fecha}`;
                break;
            case 'fallback':
                estadoTexto = `Precios de respaldo del: ${fecha}`;
                break;
            case 'emergencia':
                estadoTexto = `Precios de emergencia cargados`;
                break;
            default:
                estadoTexto = `Precios cargados: ${fecha}`;
        }
        
        estadoElement.textContent = estadoTexto;
        versionElement.textContent = `Última actualización: ${fecha} | ${estadoPrecios.cantidadItems} items en ${estadoPrecios.cantidadCategorias} categorías`;
    }
}

// Utilidades de datos
function exportarDatos() {
    Helpers.exportarDatos();
    Helpers.mostrarNotificacion('Datos exportados correctamente', 'success');
}

async function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        await Helpers.importarDatos(file);
        
        // Recargar configuración
        estado.configUsuario = userSettings.obtenerConfiguracion();
        aplicarConfiguracionUI();
        
        // Recargar precios
        estado.precios = await priceUpdater.inicializar();
        estado.ultimaActualizacion = priceUpdater.ultimaActualizacion;
        
        actualizarUIEstadoPrecios();
        
        Helpers.mostrarNotificacion('Datos importados correctamente', 'success');
    } catch (error) {
        Helpers.mostrarNotificacion('Error importando datos: ' + error.message, 'error');
    }
    
    // Limpiar input
    event.target.value = '';
}

// Utilidades UI
function mostrarCargando(mostrar) {
    const loading = document.getElementById('loading');
    if (mostrar) {
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
    }
}

function inicializarEventListeners() {
    // Navegación por pasos
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            siguientePaso(parseInt(e.target.dataset.step));
        });
    });
    
    // Configuración de validez por defecto
    if (!document.getElementById('validez-presupuesto').value) {
        document.getElementById('validez-presupuesto').value = Helpers.obtenerFechaValidezDefault();
    }
}

function actualizarUI() {
    // Actualizar cualquier elemento de UI que necesite refresco
    actualizarResumenRapido();
        }
