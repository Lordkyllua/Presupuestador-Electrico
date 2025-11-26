// Configuración por defecto de la aplicación
const DEFAULT_CONFIG = {
    APP: {
        NAME: 'Presupuestador Eléctrico',
        VERSION: '1.0.0',
        DEVELOPER: 'DC Electricista'
    },
    
    PWA: {
        CACHE_NAME: 'presupuestador-electrico-v1.0.0',
        UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
        RETRY_ATTEMPTS: 3
    },
    
    PRECIOS: {
        SOURCE_URL: 'https://aaieric.org.ar/costos-mano-de-obra',
        FALLBACK_FILE: '/precios.json',
        CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 horas
    },
    
    UI: {
        DEFAULT_DISCOUNT: 0,
        DEFAULT_VALIDITY_DAYS: 30,
        ITEMS_PER_PAGE: 50,
        CURRENCY: 'ARS',
        DATE_FORMAT: 'es-AR'
    },
    
    PDF: {
        MARGIN: 20,
        FONT_SIZE: {
            TITLE: 20,
            SUBTITLE: 14,
            NORMAL: 10,
            SMALL: 8
        },
        COLORS: {
            PRIMARY: [37, 99, 235],
            SECONDARY: [100, 116, 139],
            SUCCESS: [16, 185, 129]
        }
    }
};

// Categorías predefinidas para organizar los trabajos
const CATEGORIAS = {
    SERVICIOS_BASICOS: {
        id: 'servicios_basicos',
        nombre: '🛠️ Obra Completa & Servicios Básicos',
        icono: '🛠️'
    },
    CANALIZACION: {
        id: 'canalizacion',
        nombre: '🔌 Canalización & Cableado',
        icono: '🔌'
    },
    PUNTOS_TOMAS: {
        id: 'puntos_tomas',
        nombre: '⚡ Puntos y Tomas',
        icono: '⚡'
    },
    TABLEROS: {
        id: 'tableros',
        nombre: '🔋 Tableros',
        icono: '🔋'
    },
    ARTEFACTOS: {
        id: 'artefactos',
        nombre: '💡 Artefactos de Iluminación',
        icono: '💡'
    },
    ACOMETIDAS: {
        id: 'acometidas',
        nombre: '🏢 Acometidas',
        icono: '🏢'
    },
    BANDEJAS: {
        id: 'bandejas',
        nombre: '📦 Bandejas Portacables',
        icono: '📦'
    },
    AUTOMATISMOS: {
        id: 'automatismos',
        nombre: '🔧 Automatismos & Documentación',
        icono: '🔧'
    },
    CERTIFICADOS: {
        id: 'certificados',
        nombre: '📄 Certificados',
        icono: '📄'
    }
};
