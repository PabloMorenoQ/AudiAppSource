function recuentoProcesos() {
    const resumenTable = document.getElementById('reportTableSummary');
    const tablas = ['tabla-fortalezas', 'tabla-conformidades', 'tabla-recomendaciones', 'tabla-riesgos', 'tabla-no-conformidades'];

    // ✅ Limpiar solo el tbody para preservar el thead
    const tbody = resumenTable.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = '';
    } else {
        // Si insertRow() apunta directo a la tabla sin tbody explícito, limpiar así:
        while (resumenTable.rows.length > 0) {
            resumenTable.deleteRow(0);
        }
    }

    // Contadores de procesos
    const procesosContador = {};

    tablas.forEach(tablaId => {
        const table = document.getElementById(tablaId);
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const proceso = row.querySelector('td:nth-child(8)');
                const tipoProceso = row.querySelector('td:nth-child(9)');
                if (proceso) {
                    const procesoText = proceso.textContent.trim();
                    const tipoProceoText = tipoProceso ? tipoProceso.textContent.trim() : 'N/A';
                    if (procesoText) {
                        if (!procesosContador[procesoText]) {
                            procesosContador[procesoText] = { tipoProceso: tipoProceoText, fortalezas: 0, conformidades: 0, recomendaciones: 0, riesgos: 0, noConformidades: 0 };
                        }
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

    // ✅ Si no hay datos, la tabla queda vacía (comportamiento correcto)
    Object.keys(procesosContador).forEach(proceso => {
        const count = procesosContador[proceso];
        const total = count.fortalezas + count.conformidades + count.recomendaciones + count.riesgos + count.noConformidades;

        const targetBody = tbody || resumenTable;
        const newRow = targetBody.insertRow();
        newRow.insertCell().textContent = count.tipoProceso;
        newRow.insertCell().textContent = proceso;
        newRow.insertCell().textContent = count.fortalezas;
        newRow.insertCell().textContent = count.conformidades;
        newRow.insertCell().textContent = count.recomendaciones;
        newRow.insertCell().textContent = count.riesgos;
        newRow.insertCell().textContent = count.noConformidades;
        newRow.insertCell().textContent = total;
    });
}

document.getElementById('recuentoBtn').addEventListener('click', recuentoProcesos);