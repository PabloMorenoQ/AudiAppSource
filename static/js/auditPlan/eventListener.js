document.addEventListener("DOMContentLoaded", function () {

    // Flag para evitar bucles de retroalimentación en el ResizeObserver
    let syncPending = false;

    // Sincroniza la altura de todas las textareas de la misma fila
    function syncRowHeights(pivotTa) {
        if (syncPending) return;
        const row = pivotTa.closest("tr");
        if (!row) return;

        syncPending = true;
        const newHeight = pivotTa.offsetHeight;

        row.querySelectorAll("textarea").forEach(function (sibling) {
            if (sibling !== pivotTa) {
                sibling.style.height = newHeight + "px";
            }
        });

        // Limpiar el flag después de que los ResizeObserver de los siblings hayan disparado
        requestAnimationFrame(function () {
            syncPending = false;
        });
    }

    // ResizeObserver compartido: detecta cualquier cambio de tamaño en una textarea
    const rowSyncObserver = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
            syncRowHeights(entry.target);
        });
    });

    // 🧩 Función para agregar una fila a la tabla
    function addRow(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        // Asegurar tbody
        let tbody = table.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            table.appendChild(tbody);
        }

        const headerRow = table.querySelector("thead tr");
        const colCount = headerRow ? headerRow.children.length : 0;

        // Crear la nueva fila
        const newRow = document.createElement("tr");

        for (let i = 0; i < colCount; i++) {
            const cell = document.createElement("td");
            cell.style.padding = "5px";
            cell.style.verticalAlign = "top";

            // Crear textarea
            const ta = document.createElement("textarea");
            ta.className = "form-control auto-resize";
            ta.placeholder = `Dato ${i + 1}`;
            ta.name = `col_${i + 1}`;          // 👈 identificador por columna
            ta.dataset.col = i;               // 👈 índice de columna
            ta.rows = 2;

            ta.style.width = "100%";
            ta.style.minHeight = "36px";
            ta.style.minWidth = "100px";
            ta.style.boxSizing = "border-box";
            ta.style.overflow = "auto";
            ta.style.resize = "vertical";

            // Registrar en el observer para sincronizar la fila al redimensionar
            rowSyncObserver.observe(ta);

            // Insertar textarea en la celda y la celda en la fila
            cell.appendChild(ta);
            newRow.appendChild(cell);
        }

        // Insertar fila al tbody
        tbody.appendChild(newRow);
    }

    // Función para eliminar la última fila
    function removeRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector("tbody");
        if (tbody && tbody.rows.length > 0) {
            tbody.deleteRow(tbody.rows.length - 1);
        }
    }

    // Escuchar clicks en todos los botones
    document.querySelectorAll(".add-row-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const tableId = this.getAttribute("data-table");
            addRow(tableId);
        });
    });

    document.querySelectorAll(".remove-row-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const tableId = this.getAttribute("data-table");
            removeRow(tableId);
        });
    });
});
