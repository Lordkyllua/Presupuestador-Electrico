// Generador de PDFs personalizados - Versión corregida
class PDFGenerator {
    constructor() {
        this.doc = null;
    }

    inicializar() {
        // Verificar que jsPDF esté disponible
        if (typeof jspdf === 'undefined') {
            throw new Error('jsPDF no está cargado correctamente');
        }
        this.doc = new jspdf.jsPDF();
        return this;
    }

    generarPresupuesto(presupuestoData, userConfig) {
        try {
            // Inicializar documento
            this.inicializar();
            
            // Configurar página
            this.doc.setProperties({
                title: `Presupuesto - ${presupuestoData.info.cliente}`,
                subject: 'Presupuesto eléctrico',
                author: userConfig.nombreEmpresa || 'Presupuestador Eléctrico',
                keywords: 'presupuesto, electricidad, aaiseric',
                creator: 'DC Electricista'
            });

            let yPosition = 20; // Posición vertical inicial

            // 1. HEADER con logo e información de la empresa
            yPosition = this.generarHeader(userConfig, yPosition);

            // 2. INFORMACIÓN DEL PRESUPUESTO
            yPosition = this.generarInformacionPresupuesto(presupuestoData.info, yPosition + 10);

            // 3. DETALLE DE ITEMS
            yPosition = this.generarDetalleItems(presupuestoData.items, yPosition + 10);

            // 4. TOTALES
            this.generarTotales(presupuestoData.totales, presupuestoData.info.descuento, yPosition);

            // 5. FOOTER
            this.generarFooter();

            return this.doc;

        } catch (error) {
            console.error('Error generando PDF:', error);
            throw new Error('No se pudo generar el PDF: ' + error.message);
        }
    }

    generarHeader(userConfig, yStart) {
        let yPos = yStart;

        // Logo de la empresa (si existe)
        if (userConfig.logo && userConfig.logo.startsWith('data:image')) {
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
                console.warn('No se pudo cargar el logo:', error);
            }
        }

        // Información de la empresa
        const textX = (userConfig.logo && userConfig.logo.startsWith('data:image')) ? 60 : 20;

        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(
            userConfig.nombreEmpresa || 'Presupuesto Eléctrico',
            textX,
            yPos + 10
        );

        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        
        if (userConfig.contacto) {
            this.doc.text(`Contacto: ${userConfig.contacto}`, textX, yPos + 18);
        }

        // Línea separadora
        yPos += 35;
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(20, yPos, 190, yPos);

        return yPos;
    }

    generarInformacionPresupuesto(info, yStart) {
        let yPos = yStart;

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PRESUPUESTO', 20, yPos);
        yPos += 8;

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');

        const lineHeight = 5;
        const infoLines = [
            `Cliente: ${info.cliente || 'No especificado'}`,
            `Trabajo: ${info.descripcion || 'No especificado'}`,
            `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
            `Válido hasta: ${this.formatearFecha(info.validez)}`,
            `Descuento: ${info.descuento || 0}%`
        ];

        infoLines.forEach(line => {
            // Verificar si necesita nueva página
            if (yPos > 270) {
                this.doc.addPage();
                yPos = 20;
            }
            this.doc.text(line, 20, yPos);
            yPos += lineHeight;
        });

        return yPos;
    }

    generarDetalleItems(items, yStart) {
        let yPos = yStart;

        // Encabezado de la tabla
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DETALLE DE TRABAJOS', 20, yPos);
        yPos += 8;

        // Línea bajo el encabezado
        this.doc.setDrawColor(100, 100, 100);
        this.doc.line(20, yPos, 190, yPos);
        yPos += 5;

        this.doc.setFont('helvetica', 'normal');

        if (items.length === 0) {
            this.doc.text('No hay items seleccionados', 20, yPos);
            return yPos + 10;
        }

        items.forEach((item, index) => {
            // Verificar si necesita nueva página
            if (yPos > 270) {
                this.doc.addPage();
                yPos = 20;
                
                // Volver a poner el encabezado de la tabla en la nueva página
                this.doc.setFont('helvetica', 'bold');
                this.doc.text('DETALLE DE TRABAJOS (continuación)', 20, yPos);
                yPos += 8;
                this.doc.line(20, yPos, 190, yPos);
                yPos += 5;
                this.doc.setFont('helvetica', 'normal');
            }

            const descripcion = this.acortarTexto(item.descripcion, 70);
            const cantidad = `x${item.cantidad}`;
            const precioUnitario = `$ ${this.formatearPrecio(item.precio)}`;
            const subtotal = `$ ${this.formatearPrecio(item.subtotal)}`;

            // Descripción (con salto de línea si es muy larga)
            const lineasDescripcion = this.dividirTexto(descripcion, 70);
            lineasDescripcion.forEach((linea, idx) => {
                this.doc.text(linea, 20, yPos + (idx * 4));
            });

            // Cantidad, precio unitario y subtotal
            const maxLineas = Math.max(1, lineasDescripcion.length);
            this.doc.text(cantidad, 140, yPos, { align: 'right' });
            this.doc.text(precioUnitario, 160, yPos, { align: 'right' });
            this.doc.text(subtotal, 190, yPos + ((maxLineas - 1) * 4), { align: 'right' });

            yPos += (maxLineas * 4) + 3;

            // Línea separadora entre items
            if (index < items.length - 1) {
                this.doc.setDrawColor(240, 240, 240);
                this.doc.line(20, yPos, 190, yPos);
                yPos += 2;
            }
        });

        return yPos;
    }

    generarTotales(totales, descuento, yStart) {
        let yPos = yStart + 10;

        // Línea separadora antes de los totales
        this.doc.setDrawColor(150, 150, 150);
        this.doc.line(120, yPos, 190, yPos);
        yPos += 8;

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);

        // Subtotal
        this.doc.text(
            `Subtotal: $ ${this.formatearPrecio(totales.subtotal)}`,
            190,
            yPos,
            { align: 'right' }
        );
        yPos += 6;

        // Descuento
        if (descuento > 0) {
            this.doc.text(
                `Descuento (${descuento}%): $ -${this.formatearPrecio(totales.descuentoMonto)}`,
                190,
                yPos,
                { align: 'right' }
            );
            yPos += 6;
        }

        // Línea para el total final
        this.doc.setDrawColor(100, 100, 100);
        this.doc.line(140, yPos, 190, yPos);
        yPos += 8;

        // Total final
        this.doc.setFontSize(12);
        this.doc.text(
            `TOTAL: $ ${this.formatearPrecio(totales.total)}`,
            190,
            yPos,
            { align: 'right' }
        );
    }

    generarFooter() {
        const yPos = 280;

        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(100, 100, 100);

        this.doc.text(
            `Precios según tabla AAIERIC - Generado el ${new Date().toLocaleDateString('es-AR')}`,
            20,
            yPos
        );

        this.doc.text(
            'Desarrollado por DC Electricista',
            20,
            yPos + 4
        );

        // Número de página
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.text(
                `Página ${i} de ${pageCount}`,
                190,
                290,
                { align: 'right' }
            );
        }
    }

    // Utilidades auxiliares
    acortarTexto(texto, maxLength) {
        if (!texto) return '';
        if (texto.length <= maxLength) return texto;
        return texto.substring(0, maxLength - 3) + '...';
    }

    dividirTexto(texto, maxLength) {
        if (!texto) return [''];
        if (texto.length <= maxLength) return [texto];

        const palabras = texto.split(' ');
        const lineas = [];
        let lineaActual = '';

        palabras.forEach(palabra => {
            if ((lineaActual + ' ' + palabra).length <= maxLength) {
                lineaActual += (lineaActual ? ' ' : '') + palabra;
            } else {
                if (lineaActual) lineas.push(lineaActual);
                lineaActual = palabra;
            }
        });

        if (lineaActual) lineas.push(lineaActual);
        return lineas;
    }

    formatearPrecio(precio) {
        if (typeof precio !== 'number') return '0';
        return new Intl.NumberFormat('es-AR').format(precio);
    }

    formatearFecha(fechaISO) {
        if (!fechaISO) return 'No especificada';
        try {
            return new Date(fechaISO).toLocaleDateString('es-AR');
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    descargar(nombreArchivo = 'presupuesto') {
        if (!this.doc) {
            throw new Error('No hay documento PDF para descargar');
        }

        // Limpiar nombre de archivo de caracteres inválidos
        const nombreLimpio = nombreArchivo.replace(/[^a-zA-Z0-9-_]/g, '_');
        const fecha = new Date().toISOString().split('T')[0];

        this.doc.save(`${nombreLimpio}_${fecha}.pdf`);
    }
}

// Crear instancia única
const pdfGenerator = new PDFGenerator();
