function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function insertRowInTable(rowData, calificacion) {
    let tableBody = null;
    const calif = removeAccents((typeof calificacion === 'string' ? calificacion : '').toLowerCase());

    switch (calif) {
        case 'fortaleza':
            tableBody = document.getElementById('tabla-fortalezas')?.querySelector('tbody');
            break;
        case 'no conformidad':
            tableBody = document.getElementById('tabla-no-conformidades')?.querySelector('tbody');
            break;
        case 'conformidad':
            tableBody = document.getElementById('tabla-conformidades')?.querySelector('tbody');
            break;
        case 'recomendacion':
            tableBody = document.getElementById('tabla-recomendaciones')?.querySelector('tbody');
            break;
        case 'riesgo':
            tableBody = document.getElementById('tabla-riesgos')?.querySelector('tbody');
            break;
        default:
            console.warn(`Calificación desconocida o vacía: "${calificacion}". Fila omitida.`);
            return;
    }

    if (!tableBody) {
        console.error(`No se encontró el <tbody> para la calificación: "${calificacion}"`);
        return;
    }

    const newRow = tableBody.insertRow();
    const columnas = [
        'no', 'clausula', 'norma', 'hallazgo',
        'evidencia', 'dependencia', 'lugar',
        'proceso', 'tipoProceso', 'responsable'
    ];

    columnas.forEach(key => {
        const cell = newRow.insertCell();
        cell.textContent = rowData[key] || 'N/A';
    });
}

// Nota: función clearAllTables queda intacta pero no la usamos en fetchChecklistData

function insertRow(tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const newRow = document.createElement('tr');

    if (tableId === 'tabla-planAud') {
        const campos = [
            { placeholder: 'Ingrese el proceso' },
            { placeholder: 'Ingrese el área' },
            { placeholder: 'Ingrese el lugar' },
            { placeholder: 'Ingrese el método' },
            { placeholder: 'Ej: 7.1, 7.2, etc.' },
            { type: 'date' },
            { type: 'time' },
            { placeholder: 'Nombre del responsable' },
            { placeholder: 'Nombre del auditor' },
            { placeholder: 'Ingrese observaciones' }
        ];

        campos.forEach(campo => {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = campo.type || 'text';
            input.className = 'form-control';
            input.placeholder = campo.placeholder || '';
            input.required = true;
            cell.appendChild(input);
            newRow.appendChild(cell);
        });

    } else {
        const cellCount = table.querySelector('thead tr').cells.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            cell.appendChild(input);
            newRow.appendChild(cell);
        }
    }

    tbody.appendChild(newRow);
}

function fetchChecklistData(checklistId) {
    const pathSegments = window.location.pathname.split('/');
    const langPrefix = (pathSegments.length > 1 && pathSegments[1].length === 2) ? pathSegments[1] : 'es';

    fetch(`/${langPrefix}/audit/checklist/${checklistId}/data/`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const data = result.data;

                if (Array.isArray(data)) {
                    // Ya NO borramos las tablas, para agregar filas nuevas
                    // clearAllTables();

                    data.forEach((item, index) => {
                        const fila = {
                            no: item.indice || index + 1,
                            clausula: item.clausula || 'N/A',
                            norma: 'ISO 55001',
                            hallazgo: item.hallazgo || 'Sin hallazgo',
                            evidencia: item.evidencia || 'Sin evidencia',
                            dependencia: 'N/A',
                            lugar: item.lugar || 'N/A',
                            proceso: item.proceso || item.pregunta || 'Sin proceso',
                            tipoProceso: item.tipo_proceso || 'N/A',
                            responsable: 'N/A'
                        };

                        let calificacion = item.calificacion;
                        if (typeof calificacion === 'object' && calificacion !== null) {
                            calificacion = calificacion.valor || '';
                        }

                        insertRowInTable(fila, calificacion);
                    });
                } else {
                    console.error('El campo audit_data no es una lista válida.');
                }
            } else {
                console.error('Error desde el servidor:', result.error);
            }
        })
        .catch(err => {
            console.error('Error al obtener los datos de la checklist:', err);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const checklistSelector = document.getElementById('checklistSelector');
    const loadButton = document.getElementById('loadChecklistBtn');

    if (loadButton && checklistSelector) {
        loadButton.addEventListener('click', () => {
            const checklistId = checklistSelector.value;
            if (checklistId) {
                fetchChecklistData(checklistId);
            } else {
                alert("Selecciona una checklist antes de cargar los datos.");
            }
        });
    }

    // Quitamos el evento change para evitar carga automática al cambiar selección
    // if (checklistSelector) {
    //     checklistSelector.addEventListener('change', function () {
    //         const checklistId = this.value;
    //         if (checklistId) {
    //             fetchChecklistData(checklistId);
    //         }
    //     });
    // }

    // Botones para agregar y eliminar filas manualmente
    document.querySelectorAll('.add-row-btn').forEach(button => {
        button.addEventListener('click', function () {
            const tableId = this.getAttribute('data-table');
            insertRow(tableId);
        });
    });

    document.querySelectorAll('.remove-row-btn').forEach(button => {
        button.addEventListener('click', function () {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.rows.length > 0) {
                tbody.deleteRow(tbody.rows.length - 1);
            }
        });
    });
});
