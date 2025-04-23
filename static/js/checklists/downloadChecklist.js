function generateJSONFromAuditTable() {
    console.log("Función generateJSONFromAuditTable ejecutada");
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

    // Capturar datos del formulario general
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
                indice:       getCellValue(cells[0]),
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

    // Convertir directamente el array a JSON plano
    const json = JSON.stringify(data, null, 4);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.json";
    a.click();
    URL.revokeObjectURL(url);
}
