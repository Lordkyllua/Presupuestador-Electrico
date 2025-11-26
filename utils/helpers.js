// Utilidades y helpers para la aplicación
class Helpers {
    static formatearPrecio(precio) {
        return new Intl.NumberFormat('es-AR').format(precio);
    }

    static formatearFecha(fechaISO, opciones = {}) {
        const opcionesDefault = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        return new Date(fechaISO).toLocaleDateString(
            DEFAULT_CONFIG.UI.DATE_FORMAT, 
            { ...opcionesDefault, ...opciones }
        );
    }

    static obtenerFechaValidezDefault() {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + DEFAULT_CONFIG.UI.DEFAULT_VALIDITY_DAYS);
        return fecha.toISOString().split('T')[0];
    }

    static generarIdUnico() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validarTelefono(telefono) {
        const regex = /^[0-9+\-\s()]{10,}$/;
        return regex.test(telefono);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static async cargarImagenComoDataURL(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(archivo);
        });
    }

    static comprimirImagen(dataURL, maxWidth = 200, calidad = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
            img.src = dataURL;
        });
    }

    static mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo}`;
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-icono">${this.obtenerIconoNotificacion(tipo)}</span>
                <span class="notificacion-mensaje">${mensaje}</span>
                <button class="notificacion-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Estilos para la notificación
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.obtenerColorNotificacion(tipo)};
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notificacion);

        // Auto-eliminar después de la duración
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notificacion.remove(), 300);
            }
        }, duracion);
    }

    static obtenerIconoNotificacion(tipo) {
        const iconos = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return iconos[tipo] || 'ℹ️';
    }

    static obtenerColorNotificacion(tipo) {
        const colores = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colores[tipo] || '#3b82f6';
    }

    static exportarDatos() {
        const datos = {
            configUsuario: userSettings.obtenerConfiguracion(),
            precios: priceUpdater.obtenerPrecios(),
            ultimaActualizacion: priceUpdater.ultimaActualizacion,
            exportado: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_presupuestador_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static importarDatos(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const datos = JSON.parse(e.target.result);
                    
                    if (datos.configUsuario) {
                        userSettings.guardarConfiguracion(datos.configUsuario);
                    }
                    
                    if (datos.precios) {
                        localStorage.setItem('preciosAAIERIC', JSON.stringify(datos.precios));
                    }
                    
                    if (datos.ultimaActualizacion) {
                        localStorage.setItem('ultimaActualizacionPrecios', datos.ultimaActualizacion);
                    }
                    
                    resolve(datos);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(archivo);
        });
    }
}

// Añadir estilos CSS para las animaciones de notificación
const estilosNotificacion = document.createElement('style');
estilosNotificacion.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notificacion-contenido {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notificacion-cerrar {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
    }
`;
document.head.appendChild(estilosNotificacion);
