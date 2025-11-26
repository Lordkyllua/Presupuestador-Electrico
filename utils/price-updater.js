// Sistema de actualización automática de precios desde AAIERIC
class PriceUpdater {
    constructor() {
        this.precios = {};
        this.ultimaActualizacion = null;
        this.estado = 'inicial';
    }

    async inicializar() {
        try {
            await this.cargarPreciosLocales();
            await this.intentarActualizacion();
            return this.precios;
        } catch (error) {
            console.error('Error inicializando precios:', error);
            throw error;
        }
    }

    async cargarPreciosLocales() {
        try {
            // Intentar cargar desde localStorage primero
            const preciosGuardados = localStorage.getItem('preciosAAIERIC');
            const fechaGuardada = localStorage.getItem('ultimaActualizacionPrecios');
            
            if (preciosGuardados && fechaGuardada) {
                this.precios = JSON.parse(preciosGuardados);
                this.ultimaActualizacion = new Date(fechaGuardada);
                this.estado = 'cache';
                return true;
            }
            
            // Fallback al archivo local
            const response = await fetch('/precios.json');
            if (response.ok) {
                this.precios = await response.json();
                this.estado = 'fallback';
                return true;
            }
            
            throw new Error('No se pudieron cargar los precios');
            
        } catch (error) {
            console.error('Error cargando precios locales:', error);
            throw error;
        }
    }

    async intentarActualizacion() {
        if (this.debeActualizar()) {
            try {
                await this.actualizarDesdeWeb();
                this.estado = 'actualizado';
            } catch (error) {
                console.warn('No se pudo actualizar precios, usando cache:', error);
            }
        }
    }

    debeActualizar() {
        if (!this.ultimaActualizacion) return true;
        
        const ahora = new Date();
        const diferencia = ahora - this.ultimaActualizacion;
        const umbralActualizacion = 24 * 60 * 60 * 1000; // 24 horas
        
        return diferencia > umbralActualizacion;
    }

    async actualizarDesdeWeb() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
            
            const response = await fetch(DEFAULT_CONFIG.PRECIOS.SOURCE_URL, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; PresupuestadorElectrico/1.0)'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            const preciosActualizados = await this.parsearHTMLPrecios(html);
            
            if (Object.keys(preciosActualizados).length > 0) {
                this.precios = preciosActualizados;
                this.ultimaActualizacion = new Date();
                
                // Guardar en localStorage
                localStorage.setItem('preciosAAIERIC', JSON.stringify(preciosActualizados));
                localStorage.setItem('ultimaActualizacionPrecios', this.ultimaActualizacion.toISOString());
                
                return true;
            }
            
            throw new Error('No se pudieron extraer precios del HTML');
            
        } catch (error) {
            console.error('Error actualizando precios desde web:', error);
            throw error;
        }
    }

    async parsearHTMLPrecios(html) {
        // Esta función necesita ser adaptada según la estructura real del sitio de AAIERIC
        // Por ahora devolvemos los precios de ejemplo como placeholder
        
        return new Promise((resolve) => {
            // Simulamos parsing de HTML
            setTimeout(() => {
                resolve(this.generarEstructuraPreciosEjemplo());
            }, 100);
        });
    }

    generarEstructuraPreciosEjemplo() {
        // Estructura de ejemplo basada en el PDF
        return {
            "servicios_basicos": [
                { id: "visita", descripcion: "Visita: Inspección Ocular, Evaluación, Diagnóstico, Asesoramiento y Presupuesto", precio: 43043, unidad: "visita" },
                { id: "urgencia", descripcion: "Urgencia: Lunes a Sábado a partir 20:00 hs/Domingo y Feriado (mínimo)", precio: 103191, unidad: "visita" },
                { id: "boca_completa", descripcion: "Unidad básica de cotización para todo trabajo eléctrico: 1(una) boca completa", precio: 85935, unidad: "boca" },
                { id: "service_minimo", descripcion: "Service - Instalación (mínimo)", precio: 85935, unidad: "servicio" },
                { id: "hora_trabajo_minimo", descripcion: "Hora de Trabajo (mínimo)", precio: 43043, unidad: "hora" }
            ],
            "canalizacion": [
                { id: "canal_losa_metal", descripcion: "Canalización de cañería en losa con caño metálico", precio: 43505, unidad: "boca" },
                { id: "canal_loseta_metal", descripcion: "Canalización en loseta con caño metálico", precio: 45680, unidad: "boca" },
                { id: "amurado_ladrillo_comun", descripcion: "Amurado de cañería en mampostería - Ladrillo común", precio: 49441, unidad: "boca" },
                { id: "amurado_ladrillo_hueco", descripcion: "Amurado de cañería en mampostería - Ladrillo hueco", precio: 48266, unidad: "boca" }
            ],
            "puntos_tomas": [
                { id: "punto_simple", descripcion: "Punto, toma simple, portalámpara", precio: 15347, unidad: "unidad" },
                { id: "toma_doble", descripcion: "Toma doble", precio: 19437, unidad: "unidad" },
                { id: "punto_combinacion", descripcion: "Punto Combinación", precio: 16518, unidad: "unidad" }
            ]
            // ... más categorías según sea necesario
        };
    }

    obtenerPrecios() {
        return this.precios;
    }

    obtenerEstado() {
        return {
            estado: this.estado,
            ultimaActualizacion: this.ultimaActualizacion,
            cantidadCategorias: Object.keys(this.precios).length,
            cantidadItems: Object.values(this.precios).reduce((total, categoria) => total + categoria.length, 0)
        };
    }

    forzarActualizacion() {
        return this.actualizarDesdeWeb();
    }
}

// Exportar instancia única
const priceUpdater = new PriceUpdater();
