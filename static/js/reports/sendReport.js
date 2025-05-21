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

    // Crear el objeto de datos para el reporte
    const reportData = {
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
            alert("Reporte guardado correctamente.");
        } else {
            alert("Error al guardar el reporte.");
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        alert("Error de conexión al guardar el reporte.");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
        sendBtn.addEventListener("click", sendReportToServer);
    }
});
