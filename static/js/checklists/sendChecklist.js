function sendChecklistToServer() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

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
                hallazgo:     getCellValue(cells[6])
            });
        }
    });

    const tipoProceso = document.querySelector('input[name="tipo"]:checked')?.value;

    const checklistData = {
        process: document.getElementById("process_html").value,
        place: document.getElementById("lugar_html").value,
        clauses_list: data.map(d => d.clausula).join(', '),
        process_type: tipoProceso,  // <--- esta es la línea corregida
        audit_data: JSON.stringify(data)
    };


    // fetch("{% url 'save_checklist' %}", {
    fetch("/audit/checkList/save_checklist/", {
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
    });
}
