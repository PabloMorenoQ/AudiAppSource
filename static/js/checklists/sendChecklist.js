function sendChecklistToServer() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

    // Capturamos los datos generales del formulario
    const process     = document.getElementById("process_html").value.trim();
    const place       = document.getElementById("lugar_html").value.trim();
    const processType = document.querySelector('input[name="tipo"]:checked')?.value || "";

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
            const getCellValue = (cell) => {
                const input = cell.querySelector('input, textarea, select');
                return input ? input.value.trim() : cell.textContent.trim();
            };

            const select = cells[5].querySelector('select');
            const selectedValue = select ? select.options[select.selectedIndex].value : "";

            data.push({
                clausula:     getCellValue(cells[1]),
                indice:       getCellValue(cells[2]),
                pregunta:     getCellValue(cells[3]),
                evidencia:    getCellValue(cells[4]),
                calificacion: selectedValue,
                hallazgo:     getCellValue(cells[6]),
                proceso:      process,
                lugar:        place,
                tipo_proceso: processType
            });
        }
    });

    const checklistData = {
        process: process,
        place: place,
        clauses_list: data.map(d => d.clausula).join(', '),
        process_type: processType,
        audit_data: JSON.stringify(data)  // ← audit_data incluye también los nuevos campos
    };

    fetch("/audit/checkList/save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"
        },
        body: JSON.stringify(checklistData)
    })
    .then(response => {
        if (response.ok) {
            alert("Checklist guardado correctamente.");
        } else {
            alert("Error al guardar el checklist.");
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        alert("Error de conexión al guardar el checklist.");
    });
}
