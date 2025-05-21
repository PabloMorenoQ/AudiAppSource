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
            tableBody = document.getElementById('tabla-conformidad')?.querySelector('tbody');
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
