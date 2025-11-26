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

function valid
