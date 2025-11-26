// Gestión de configuración de usuario
class UserSettings {
    constructor() {
        this.config = this.cargarConfiguracion() || this.getConfiguracionDefault();
    }

    getConfiguracionDefault() {
        return {
            nombreEmpresa: '',
            descuentoPredeterminado: 0,
            contacto: '',
            logo: null,
            tema: 'claro',
            moneda: 'ARS'
        };
    }

    cargarConfiguracion() {
        try {
            return JSON.parse(localStorage.getItem('configUsuario'));
        } catch (error) {
            console.error('Error cargando configuración:', error);
            return null;
        }
    }

    guardarConfiguracion(config) {
        try {
            this.config = { ...this.config, ...config };
            localStorage.setItem('configUsuario', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Error guardando configuración:', error);
            return false;
        }
    }

    obtenerConfiguracion() {
        return this.config;
    }

    limpiarConfiguracion() {
        localStorage.removeItem('configUsuario');
        this.config = this.getConfiguracionDefault();
    }

    // Métodos específicos para manejo del logo
    guardarLogo(logoData) {
        return new Promise((resolve, reject) => {
            try {
                this.config.logo = logoData;
                this.guardarConfiguracion(this.config);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    eliminarLogo() {
        this.config.logo = null;
        return this.guardarConfiguracion(this.config);
    }
}

// Exportar instancia única
const userSettings = new UserSettings();
