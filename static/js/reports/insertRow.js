function insertRowInTable(rowData, calificacion) {
    let tableBody = null;

    // Verificar que calificacion sea una cadena válida
    const calif = (typeof calificacion === 'string' ? calificacion : '').toLowerCase();

    // Seleccionamos el cuerpo de la tabla según la calificación
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

    // Crear nueva fila
    const newRow = tableBody.insertRow();

    // Orden y contenido de columnas
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
    
    // Crear las celdas según el tipo de tabla
    if (tableId === 'tabla-planAud') {
        // Proceso
        const procesoCell = document.createElement('td');
        const procesoInput = document.createElement('input');
        procesoInput.type = 'text';
        procesoInput.className = 'form-control';
        procesoInput.placeholder = 'Ingrese el proceso';
        procesoInput.required = true;
        procesoCell.appendChild(procesoInput);
        
        // Área
        const areaCell = document.createElement('td');
        const areaInput = document.createElement('input');
        areaInput.type = 'text';
        areaInput.className = 'form-control';
        areaInput.placeholder = 'Ingrese el área';
        areaInput.required = true;
        areaCell.appendChild(areaInput);
        
        // Lugar
        const lugarCell = document.createElement('td');
        const lugarInput = document.createElement('input');
        lugarInput.type = 'text';
        lugarInput.className = 'form-control';
        lugarInput.placeholder = 'Ingrese el lugar';
        lugarInput.required = true;
        lugarCell.appendChild(lugarInput);
        
        // Método
        const metodoCell = document.createElement('td');
        const metodoInput = document.createElement('input');
        metodoInput.type = 'text';
        metodoInput.className = 'form-control';
        metodoInput.placeholder = 'Ingrese el método';
        metodoInput.required = true;
        metodoCell.appendChild(metodoInput);
        
        // Cláusula
        const clausulaCell = document.createElement('td');
        const clausulaInput = document.createElement('input');
        clausulaInput.type = 'text';
        clausulaInput.className = 'form-control';
        clausulaInput.placeholder = 'Ej: 7.1, 7.2, etc.';
        clausulaInput.required = true;
        clausulaCell.appendChild(clausulaInput);
        
        // Fecha
        const fechaCell = document.createElement('td');
        const fechaInput = document.createElement('input');
        fechaInput.type = 'date';
        fechaInput.className = 'form-control';
        fechaInput.required = true;
        fechaCell.appendChild(fechaInput);
        
        // Hora
        const horaCell = document.createElement('td');
        const horaInput = document.createElement('input');
        horaInput.type = 'time';
        horaInput.className = 'form-control';
        horaInput.required = true;
        horaCell.appendChild(horaInput);
        
        // Responsable
        const responsableCell = document.createElement('td');
        const responsableInput = document.createElement('input');
        responsableInput.type = 'text';
        responsableInput.className = 'form-control';
        responsableInput.placeholder = 'Nombre del responsable';
        responsableInput.required = true;
        responsableCell.appendChild(responsableInput);
        
        // Auditor
        const auditorCell = document.createElement('td');
        const auditorInput = document.createElement('input');
        auditorInput.type = 'text';
        auditorInput.className = 'form-control';
        auditorInput.placeholder = 'Nombre del auditor';
        auditorInput.required = true;
        auditorCell.appendChild(auditorInput);
        
        // Observaciones
        const observacionesCell = document.createElement('td');
        const observacionesInput = document.createElement('input');
        observacionesInput.type = 'text';
        observacionesInput.className = 'form-control';
        observacionesInput.placeholder = 'Ingrese observaciones';
        observacionesCell.appendChild(observacionesInput);
        
        // Agregar todas las celdas a la fila
        newRow.appendChild(procesoCell);
        newRow.appendChild(areaCell);
        newRow.appendChild(lugarCell);
        newRow.appendChild(metodoCell);
        newRow.appendChild(clausulaCell);
        newRow.appendChild(fechaCell);
        newRow.appendChild(horaCell);
        newRow.appendChild(responsableCell);
        newRow.appendChild(auditorCell);
        newRow.appendChild(observacionesCell);
    } else {
        // Para otras tablas, mantener el comportamiento existente
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

// Agregar event listeners para los botones de agregar y eliminar filas
document.addEventListener('DOMContentLoaded', function() {
    // Botones de agregar fila
    document.querySelectorAll('.add-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tableId = this.getAttribute('data-table');
            insertRow(tableId);
        });
    });
    
    // Botones de eliminar fila
    document.querySelectorAll('.remove-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            const tbody = table.querySelector('tbody');
            if (tbody.rows.length > 0) {
                tbody.deleteRow(tbody.rows.length - 1);
            }
        });
    });
});
