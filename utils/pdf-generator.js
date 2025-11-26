// Generador de PDFs personalizados
class PDFGenerator {
    constructor() {
        this.doc = null;
        this.config = DEFAULT_CONFIG.PDF;
    }

    inicializar() {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();
        return this;
    }

    generarPresupuesto(presupuestoData, userConfig) {
        if (!this.doc) this.inicializar();
        
        this.doc.deletePage(0);
        this.doc.addPage();
        
        this.generarHeader(userConfig);
        this.generarInformacionPresupuesto(presupuestoData.info);
        this.generarDetalleItems(presupuestoData.items);
        this.generarTotales(presupuestoData.totales, presupuestoData.info.descuento);
        this.generarFooter();
        
        return this.doc;
    }

    generarHeader(userConfig) {
        let yPos = this.config.MARGIN;
        
        // Logo de la empresa
        if (userConfig.logo) {
            try {
                this.doc.addImage(
                    userConfig.logo, 
                    'JPEG', 
                    this.config.MARGIN, 
                    yPos, 
                    30, 
                    30
                );
            } catch (error) {
                console.warn('Error cargando logo:', error);
            }
        }
        
        // Información de la empresa
        const textoX = userConfig.logo ? this.config.MARGIN + 35 : this.config.MARGIN;
        
        this.doc.setFontSize(this.config.FONT_SIZE.TITLE);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(
            userConfig.nombreEmpresa || DEFAULT_CONFIG.APP.NAME, 
            textoX, 
            yPos + 15
        );
        
        this.doc.setFontSize(this.config.FONT_SIZE.SMALL);
        this.doc.setFont(undefined, 'normal');
        
        if (userConfig.contacto) {
            this.doc.text(`Contacto: ${userConfig.contacto}`, textoX, yPos + 25);
        }
        
        // Línea separadora
        yPos += 40;
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(this.config.MARGIN, yPos, 190, yPos);
    }

    generarInformacionPresupuesto(info) {
        let yPos = 60;
        
        this.doc.setFontSize(this.config.FONT_SIZE.SUBTITLE);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('PRESUPUESTO', this.config.MARGIN, yPos);
        yPos += 10;
        
        this.doc.setFontSize(this.config.FONT_SIZE.NORMAL);
        this.doc.setFont(undefined, 'normal');
        
        const lineHeight = 6;
        const infoLines = [
            `Para: ${info.cliente}`,
            `Trabajo: ${info.descripcion}`,
            `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
            `Válido hasta: ${this.formatearFecha(info.validez)}`
        ];
        
        infoLines.forEach(line => {
            this.doc.text(line, this.config.MARGIN, yPos);
            yPos += lineHeight;
        });
        
        return yPos + 10;
    }

    generarDetalleItems(items) {
        let yPos = 100;
        
        // Encabezado de la tabla
        this.doc.setFont(undefined, 'bold');
        this.doc.text('DETALLE', this.config.MARGIN, yPos);
        yPos += 8;
        
        this.doc.setFont(undefined, 'normal');
        
        items.forEach((item, index) => {
            // Verificar si necesita nueva página
            if (yPos > 250) {
                this.doc.addPage();
                yPos = this.config.MARGIN;
            }
            
            const descripcion = this.acortarTexto(
                `${item.descripcion} (x${item.cantidad})`, 
                80
            );
            const precio = `$ ${this.formatearPrecio(item.subtotal)}`;
            
            this.doc.text(descripcion, this.config.MARGIN, yPos);
            this.doc.text(precio, 180, yPos, { align: 'right' });
            yPos += 6;
        });
        
        return yPos + 10;
    }

    generarTotales(totales, descuentoPorcentaje) {
        let yPos = 260;
        
        this.doc.setFont(undefined, 'bold');
        this.doc.text(
            `Subtotal: $ ${this.formatearPrecio(totales.subtotal)}`, 
            150, 
            yPos, 
            { align: 'right' }
        );
        yPos += 6;
        
        this.doc.text(
            `Descuento (${descuentoPorcentaje}%): $ -${this.formatearPrecio(totales.descuentoMonto)}`, 
            150, 
            yPos, 
            { align: 'right' }
        );
        yPos += 8;
        
        this.doc.setFontSize(this.config.FONT_SIZE.SUBTITLE);
        this.doc.text(
            `TOTAL: $ ${this.formatearPrecio(totales.total)}`, 
            150, 
            yPos, 
            { align: 'right' }
        );
    }

    generarFooter() {
        const yPos = 280;
        
        this.doc.setFontSize(this.config.FONT_SIZE.SMALL);
        this.doc.setFont(undefined, 'normal');
        
        this.doc.text(
            `Precios según tabla AAIERIC - ${new Date().toLocaleDateString('es-AR')}`, 
            this.config.MARGIN, 
            yPos
        );
        
        this.doc.text(
            `Desarrollado por ${DEFAULT_CONFIG.APP.DEVELOPER}`, 
            this.config.MARGIN, 
            yPos + 4
        );
    }

    acortarTexto(texto, maxLength) {
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength - 3) + '...';
    }

    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-AR').format(precio);
    }

    formatearFecha(fechaISO) {
        return new Date(fechaISO).toLocaleDateString('es-AR');
    }

    descargar(nombreArchivo = 'presupuesto') {
        if (!this.doc) {
            throw new Error('No hay documento PDF para descargar');
        }
        
        const fecha = new Date().toISOString().split('T')[0];
        this.doc.save(`${nombreArchivo}_${fecha}.pdf`);
    }
}

// Exportar clase
const pdfGenerator = new PDFGenerator();
