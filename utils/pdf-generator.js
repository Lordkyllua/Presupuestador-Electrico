// Generador de PDFs personalizados
class PDFGenerator {
    constructor() {
        this.doc = null;
    }

    inicializar() {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();
        return this;
    }

    generarPresupuesto(presupuestoData, userConfig) {
        if (!this.doc) this.inicializar();
        
        this.doc = new jsPDF();
        
        this.generarHeader(userConfig);
        this.generarInformacionPresupuesto(presupuestoData.info);
        this.generarDetalleItems(presupuestoData.items);
        this.generarTotales(presupuestoData.totales, presupuestoData.info.descuento);
        this.generarFooter();
        
        return this.doc;
    }

    generarHeader(userConfig) {
        let yPos = 20;
        
        // Logo de la empresa
        if (userConfig.logo) {
            try {
                this.doc.addImage(
                    userConfig.logo, 
                    'JPEG', 
                    20, 
                    yPos, 
                    30, 
                    30
                );
            } catch (error) {
                console.warn('Error cargando logo:', error);
            }
        }
        
        // Información de la empresa
        const textoX = userConfig.logo ? 60 : 20;
        
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(
            userConfig.nombreEmpresa || 'Presupuesto Eléctrico', 
            textoX, 
            yPos + 15
        );
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        if (userConfig.contacto) {
            this.doc.text(`Contacto: ${userConfig.contacto}`, textoX, yPos + 25);
        }
        
        // Línea separadora
        yPos += 40;
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(20, yPos, 190, yPos);
    }

    generarInformacionPresupuesto(info) {
        let yPos = 60;
        
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PRESUPUESTO', 20, yPos);
        yPos += 10;
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        const lineHeight = 6;
        const infoLines = [
            `Para: ${info.cliente}`,
            `Trabajo: ${info.descripcion}`,
            `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
            `Válido hasta: ${this.formatearFecha(info.validez)}`
        ];
        
        infoLines.forEach(line => {
            this.doc.text(line, 20, yPos);
            yPos += lineHeight;
        });
    }

    generarDetalleItems(items) {
        let yPos = 100;
        
        // Encabezado de la tabla
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DETALLE', 20, yPos);
        yPos += 8;
        
        this.doc.setFont('helvetica', 'normal');
        
        items.forEach((item) => {
            // Verificar si necesita nueva página
            if (yPos > 250) {
                this.doc.addPage();
                yPos = 20;
            }
            
            const descripcion = this.acortarTexto(
                `${item.descripcion} (x${item.cantidad})`, 
                100
            );
            const precio = `$ ${this.formatearPrecio(item.subtotal)}`;
            
            this.doc.text(descripcion, 20, yPos);
            this.doc.text(precio, 180, yPos, { align: 'right' });
            yPos += 6;
        });
    }

    generarTotales(totales, descuentoPorcentaje) {
        let yPos = 260;
        
        this.doc.setFont('helvetica', 'bold');
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
        
        this.doc.setFontSize(12);
        this.doc.text(
            `TOTAL: $ ${this.formatearPrecio(totales.total)}`, 
            150, 
            yPos, 
            { align: 'right' }
        );
    }

    generarFooter() {
        const yPos = 280;
        
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        
        this.doc.text(
            `Precios según tabla AAIERIC - ${new Date().toLocaleDateString('es-AR')}`, 
            20, 
            yPos
        );
        
        this.doc.text(
            `Desarrollado por DC Electricista`, 
            20, 
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
        if (!fechaISO) return 'No especificada';
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

// Crear instancia única
const pdfGenerator = new PDFGenerator();
