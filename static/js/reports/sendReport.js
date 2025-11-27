function sendReportToServer(event) {
    // Prevenir comportamiento por defecto (submit o navegación)
    if (event) event.preventDefault();

    function extractTableData(tableId) {
        const rows = document.querySelectorAll(`#${tableId} tbody tr`);
        let data = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let rowData = [];
            cells.forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            data.push(rowData);
        });

        return data;
    }

    // Obtener la checklist seleccionada
    const checklistSelector = document.getElementById('checklistSelector');
    const selectedChecklistId = checklistSelector.value;

    if (!selectedChecklistId) {
        alert("Por favor, selecciona una checklist antes de enviar el reporte.");
        return;
    }

    // Extraer datos de cada sección
    // const resumenData = extractTableData("tabla-resumen");
    const resumenData = extractTableData("tabla-resumen");
    const fortalezasData = extractTableData("tabla-fortalezas");
    const conformidadesData = extractTableData("tabla-conformidades");
    const recomendacionesData = extractTableData("tabla-recomendaciones");
    const riesgosData = extractTableData("tabla-riesgos");
    const noConformidadesData = extractTableData("tabla-no-conformidades");

    // Extraer resumen editable
    const pertinencia = document.querySelector("#pertinencia .card-content").textContent.trim();
    const adecuacion = document.querySelector("#adecuacion .card-content").textContent.trim();
    const eficacia = document.querySelector("#eficacia .card-content").textContent.trim();

    // lsita de clausulas
    function extractSecondColumn(tableId) {
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    let data = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length > 1) {
            data.push(cells[1].textContent.trim()); // tomar la segunda columna
        }
    });

    return data;
    }

    const clauses_list = []
    .concat(extractSecondColumn("tabla-fortalezas"))
    .concat(extractSecondColumn("tabla-conformidades"))
    .concat(extractSecondColumn("tabla-recomendaciones"))
    .concat(extractSecondColumn("tabla-riesgos"))
    .concat(extractSecondColumn("tabla-no-conformidades"));

    // Crear el objeto de datos para el reporte
    const reportData = {
        clauses_list: JSON.stringify(clauses_list), // ingresar la forma para tomar las clausulas evaluadas de la página
        checklist_id: selectedChecklistId,
        resumen: JSON.stringify(resumenData),
        fortalezas: JSON.stringify(fortalezasData),
        conformidades: JSON.stringify(conformidadesData),
        recomendaciones: JSON.stringify(recomendacionesData),
        riesgos: JSON.stringify(riesgosData),
        no_conformidades: JSON.stringify(noConformidadesData),
        pertinencia: pertinencia,
        adecuacion: adecuacion,
        eficacia: eficacia,
    };

    console.log("Enviando reporte:", reportData);

    fetch("save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(reportData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(err => {
                throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
            });
        }
    })
    .then(result => {
        // ✅ ÉXITO
        console.log('Informe guardado exitosamente:', result);
        
        Swal.fire({
            icon: 'success',
            title: '¡Plan de Auditoría Guardado!',
            html: `
            <!-- 
                <div class="text-start">
                    <p><strong>El plan se ha creado correctamente.</strong></p>
                    <hr>
                    <p><strong>ID del Plan:</strong> ${result.id || 'N/A'}</p>
                    <p><strong>Fecha de Creación:</strong> ${result.creation_date || 'N/A'}</p>
                    <p><strong>Organización:</strong> ${result.organization || 'N/A'}</p>
                    <p><strong>Auditor Líder:</strong> ${result.leader_auditor || 'N/A'}</p>
                    ${result.clauses_list ? `<p><strong>Cláusulas:</strong> ${result.clauses_list.substring(0, 50)}...</p>` : ''}
                </div>
            -->
                `,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Continuar',
            width: '600px'
        })
    })
    .catch(error => {
        // ❌ ERROR
        console.error('Error al guardar informe:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar el informe',
            html: `
                <div class="text-start">
                    <p>No se pudo guardar el Informe de Auditoría.</p>
                    <hr>
                    <p><strong>Error:</strong></p>
                    <p class="text-danger">${error.message}</p>
                    <hr>
                    <p><small>Si el problema persiste, contacta al administrador del sistema.</small></p>
                </div>
            `,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Entendido',
            width: '600px',
            footer: '<button type="button" class="btn btn-sm btn-secondary" onclick="console.log(\'Error completo:\', arguments)">Ver detalles técnicos</button>'
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
        sendBtn.addEventListener("click", sendReportToServer);
    }
});
