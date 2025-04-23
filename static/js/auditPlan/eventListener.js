document.addEventListener("DOMContentLoaded", function () {
    // Función para agregar una fila
    function addRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector("tbody");
        const rowCount = tbody.rows.length + 1;
        const colCount = table.querySelector("thead tr").children.length;

        const newRow = document.createElement("tr");

        for (let i = 0; i < colCount; i++) {
            const cell = document.createElement("td");

            // if (i === 0) {
            //     cell.textContent = rowCount;
            // } 
            // else {
                cell.innerHTML = `<input type="text" class="form-control" placeholder="Dato ${i}">`;
            // }

            newRow.appendChild(cell);
        }

        tbody.appendChild(newRow);
    }

    // Función para eliminar la última fila
    function removeRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector("tbody");
        if (tbody.rows.length > 0) {
            tbody.deleteRow(tbody.rows.length - 1);
        }
    }

    // Escuchar clicks en todos los botones
    document.querySelectorAll(".add-row-btn").forEach(button => {
        button.addEventListener("click", function () {
            const tableId = this.getAttribute("data-table");
            addRow(tableId);
        });
    });

    document.querySelectorAll(".remove-row-btn").forEach(button => {
        button.addEventListener("click", function () {
            const tableId = this.getAttribute("data-table");
            removeRow(tableId);
        });
    });
});