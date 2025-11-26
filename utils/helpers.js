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
        
        if (!fechaISO) return 'No especificada';
        return new Date(fechaISO).toLocaleDateString('es-AR', { ...opcionesDefault, ...opciones });
    }

    static obtenerFechaValidezDefault() {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 30);
        return fecha.toISOString().split('T')[0];
    }

    static mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notification ${tipo}`;
        notificacion.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${mensaje}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Estilos para la notificación
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.obtenerColorNotificacion(tipo)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notificacion);

        // Auto-eliminar después de la duración
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, duracion);
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

    static cargarImagenComoDataURL(archivo) {
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

    static exportarDatos() {
        const datos = {
            configUsuario: userSettings.obtenerConfiguracion(),
            precios: JSON.parse(localStorage.getItem('preciosAAIERIC') || '{}'),
            ultimaActualizacion: localStorage.getItem('ultimaActualizacionPrecios'),
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
