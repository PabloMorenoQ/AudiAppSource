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

// ✅ NUEVO: Limpiar todas las tablas
function clearAllTables() {
    const tables = [
        'tabla-fortalezas',
        'tabla-conformidades',
        'tabla-riesgos',
        'tabla-recomendaciones',
        'tabla-no-conformidades'
    ];
    
    tables.forEach(tableId => {
        const tbody = document.getElementById(tableId)?.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    });
    
    console.log('✅ Todas las tablas limpiadas');
}

// ✅ Función original: Cargar UN checklist individual
function fetchChecklistData(checklistId) {
    const pathSegments = window.location.pathname.split('/');
    const langPrefix = (pathSegments.length > 1 && pathSegments[1].length === 2) ? pathSegments[1] : 'es';

    console.log(`🔍 Cargando checklist individual: ${checklistId}`);

    fetch(`/${langPrefix}/audit/checklist/${checklistId}/data/`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const data = result.data;

                if (Array.isArray(data)) {
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
                            tipoProceso: item.tipo_proceso || item.process_type || 'N/A',
                            responsable: 'N/A'
                        };

                        let calificacion = item.calificacion;
                        if (typeof calificacion === 'object' && calificacion !== null) {
                            calificacion = calificacion.valor || '';
                        }

                        insertRowInTable(fila, calificacion);
                    });
                    
                    console.log(`✅ ${data.length} filas insertadas del checklist ${checklistId}`);
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

// ✅ NUEVO: Cargar TODOS los checklists de un Plan de Auditoría
function fetchChecklistsByPlan(planId) {
    const pathSegments = window.location.pathname.split('/');
    const langPrefix = (pathSegments.length > 1 && pathSegments[1].length === 2) ? pathSegments[1] : 'es';

    console.log(`🔍 Cargando todos los checklists del Plan: ${planId}`);

    // Mostrar loading
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Cargando Checklists...',
            html: `Obteniendo datos del Plan de Auditoría #${planId}`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    // Limpiar tablas antes de cargar nuevos datos
    clearAllTables();

    // Hacer fetch al endpoint del plan
    // ✅ IMPORTANTE: Incluye el prefijo 'audit/' porque está en i18n_patterns
    fetch(`/${langPrefix}/audit/auditPlan/${planId}/checklists/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const checklists = result.checklists;
                let totalRows = 0;

                console.log(`📋 Plan contiene ${checklists.length} checklist(s)`);

                // Procesar cada checklist
                checklists.forEach((checklist, checklistIndex) => {
                    const data = checklist.audit_data;

                    if (Array.isArray(data)) {
                        data.forEach((item, itemIndex) => {
                            totalRows++;
                            
                            const fila = {
                                no: item.indice || `${checklistIndex + 1}.${itemIndex + 1}`,
                                clausula: item.clausula || 'N/A',
                                norma: 'ISO 55001',
                                hallazgo: item.hallazgo || 'Sin hallazgo',
                                evidencia: item.evidencia || 'Sin evidencia',
                                dependencia: checklist.dependency || 'N/A',
                                lugar: item.lugar || checklist.place || 'N/A',
                                proceso: item.proceso || checklist.process || 'Sin proceso',
                                tipoProceso: item.process_type || item.tipo_proceso || checklist.process_type || 'N/A',
                                responsable: 'N/A'
                            };

                            let calificacion = item.calificacion;
                            if (typeof calificacion === 'object' && calificacion !== null) {
                                calificacion = calificacion.valor || '';
                            }

                            insertRowInTable(fila, calificacion);
                        });
                    }
                });

                // Cerrar loading y mostrar éxito
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Datos Cargados!',
                        html: `
                            <p><strong>${checklists.length}</strong> checklist(s) procesados</p>
                            <p><strong>${totalRows}</strong> filas insertadas</p>
                            <p>Plan de Auditoría: <strong>#${planId}</strong></p>
                        `,
                        timer: 3000,
                        showConfirmButton: false
                    });
                }

                console.log(`✅ Total de ${totalRows} filas insertadas de ${checklists.length} checklists`);
            } else {
                throw new Error(result.error || 'Error desconocido del servidor');
            }
        })
        .catch(err => {
            console.error('❌ Error al obtener checklists del plan:', err);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar datos',
                    html: `
                        <p>No se pudieron cargar los checklists del plan.</p>
                        <p><strong>Error:</strong> ${err.message}</p>
                    `,
                    confirmButtonColor: '#d33'
                });
            } else {
                alert(`Error al cargar checklists: ${err.message}`);
            }
        });
}

// ===================================
// EVENT LISTENERS
// ===================================
document.addEventListener('DOMContentLoaded', function () {
    const checklistSelector = document.getElementById('checklistSelector');
    const auditPlanSelector = document.getElementById('auditPlanSelector');
    const loadButton = document.getElementById('loadChecklistBtn');

    // ✅ Listener para cargar checklist individual o plan completo
    if (loadButton) {
        loadButton.addEventListener('click', () => {
            // Prioridad 1: Si hay un plan seleccionado, cargar todos sus checklists
            const planId = auditPlanSelector?.value;
            if (planId) {
                console.log('🎯 Modo: Cargar por Plan');
                fetchChecklistsByPlan(planId);
                return;
            }

            // Prioridad 2: Si hay un checklist individual seleccionado
            const checklistId = checklistSelector?.value;
            if (checklistId) {
                console.log('🎯 Modo: Cargar checklist individual');
                
                // Preguntar si quiere limpiar las tablas primero
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'question',
                        title: '¿Limpiar tablas?',
                        text: '¿Deseas limpiar las tablas antes de cargar este checklist?',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, limpiar',
                        cancelButtonText: 'No, agregar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            clearAllTables();
                        }
                        fetchChecklistData(checklistId);
                    });
                } else {
                    const limpiar = confirm('¿Deseas limpiar las tablas antes de cargar?');
                    if (limpiar) {
                        clearAllTables();
                    }
                    fetchChecklistData(checklistId);
                }
                return;
            }

            // Si no hay nada seleccionado
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Selección requerida',
                    text: 'Por favor selecciona un Plan de Auditoría o un Checklist individual.',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                alert("Selecciona un Plan de Auditoría o un Checklist antes de cargar los datos.");
            }
        });
    }

    // ✅ Listener: Cuando se selecciona un plan, limpiar selección de checklist
    if (auditPlanSelector && checklistSelector) {
        auditPlanSelector.addEventListener('change', function() {
            if (this.value) {
                checklistSelector.value = '';
                console.log('📋 Plan seleccionado, checklist individual deshabilitado');
            }
        });

        checklistSelector.addEventListener('change', function() {
            if (this.value) {
                auditPlanSelector.value = '';
                console.log('📋 Checklist individual seleccionado, plan deshabilitado');
            }
        });
    }

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