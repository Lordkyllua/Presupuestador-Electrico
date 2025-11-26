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
            const config = localStorage.getItem('configUsuario');
            return config ? JSON.parse(config) : null;
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

    eliminarLogo() {
        this.config.logo = null;
        return this.guardarConfiguracion(this.config);
    }
}

// Crear instancia única
const userSettings = new UserSettings();
