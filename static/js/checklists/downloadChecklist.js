function generateJSONFromAuditTable() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');

        if (cells.length >= 7) {
            // Obtener inputs o textareas
            const getCellValue = (cell) => {
                const input = cell.querySelector('input, textarea');
                return input ? input.value.trim() : cell.textContent.trim();
            };

            // Acceder directamente al <select> y obtener solo la opción seleccionada
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

    // Convertir a JSON
    const json = JSON.stringify(data, null, 4);

    // Descargar como archivo
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.json";
    a.click();
    URL.revokeObjectURL(url);
}

function downloadExcel() {
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

    fetch("/audit/checkList/download_excel/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ audit_data: data })
    })
    .then(response => {
        if (!response.ok) throw new Error("Error generando Excel");
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "auditoria - checklist.xlsx";
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => alert(error));
}