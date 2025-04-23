function recuentoProcesos() {
    const resumenTable = document.getElementById('reportTableSummary');
    const tablas = ['tabla-fortalezas', 'tabla-conformidades', 'tabla-recomendaciones', 'tabla-riesgos', 'tabla-no-conformidades'];

    // Limpiar tabla de resumen antes de actualizar
    resumenTable.innerHTML = '';

    // Contadores de procesos
    const procesosContador = {};

    tablas.forEach(tablaId => {
        const table = document.getElementById(tablaId);
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const proceso = row.querySelector('td:nth-child(8)'); // Columna de "proceso" (ajustar si es necesario)
                if (proceso) {
                    const procesoText = proceso.textContent.trim();
                    if (procesoText) {
                        if (!procesosContador[procesoText]) {
                            procesosContador[procesoText] = { fortalezas: 0, conformidades: 0, recomendaciones: 0, riesgos: 0, noConformidades: 0 };
                        }
                        // Incrementar el contador por tipo de tabla
                        switch (tablaId) {
                            case 'tabla-fortalezas':
                                procesosContador[procesoText].fortalezas++;
                                break;
                            case 'tabla-conformidades':
                                procesosContador[procesoText].conformidades++;
                                break;
                            case 'tabla-recomendaciones':
                                procesosContador[procesoText].recomendaciones++;
                                break;
                            case 'tabla-riesgos':
                                procesosContador[procesoText].riesgos++;
                                break;
                            case 'tabla-no-conformidades':
                                procesosContador[procesoText].noConformidades++;
                                break;
                        }
                    }
                }
            });
        }
    });

    // Crear filas en el resumen
    Object.keys(procesosContador).forEach(proceso => {
        const count = procesosContador[proceso];
        const total = count.fortalezas + count.conformidades + count.recomendaciones + count.riesgos + count.noConformidades;

        const newRow = resumenTable.insertRow();
        newRow.insertCell().textContent = 'Ciclo de Vida'; // Ajusta si tienes un ciclo de vida específico
        newRow.insertCell().textContent = proceso;
        newRow.insertCell().textContent = count.fortalezas;
        newRow.insertCell().textContent = count.conformidades;
        newRow.insertCell().textContent = count.recomendaciones;
        newRow.insertCell().textContent = count.riesgos;
        newRow.insertCell().textContent = count.noConformidades;
        newRow.insertCell().textContent = total;
    });
}

// Añadir el evento al botón
document.getElementById('recuentoBtn').addEventListener('click', recuentoProcesos);
