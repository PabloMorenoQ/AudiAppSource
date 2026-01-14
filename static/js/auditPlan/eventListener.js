document.addEventListener("DOMContentLoaded", function () {
    // Función para ajustar altura del textarea automáticamente
    function autoResizeHeight(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }
    
    // Función para agregar una fila
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

        // Estilos
        ta.style.width = "100%";
        ta.style.boxSizing = "border-box";
        ta.style.overflow = "hidden";
        ta.style.resize = "both";
        ta.style.minHeight = "36px";
        ta.style.minWidth = "100px";

        // Ajuste automático de altura al escribir
        ta.addEventListener("input", function () {
            autoResizeHeight(this);
        });

        // Detectar redimensionamientos manuales
        const resizeObserver = new ResizeObserver(() => {});
        resizeObserver.observe(ta);

        // Insertar textarea en la celda y la celda en la fila
        cell.appendChild(ta);
        newRow.appendChild(cell);
    }

    // Insertar fila al tbody
    tbody.appendChild(newRow);

    // Ajustar altura inicial de los textareas nuevos
    newRow.querySelectorAll("textarea").forEach(t => {
        autoResizeHeight(t);
    });
}


    // Función para eliminar la última fila
    function removeRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector("tbody");
        if (tbody && tbody.rows.length > 0) {
            tbody.deleteRow(tbody.rows.length - 1);
            // Ajustar anchos después de eliminar
            // setTimeout(() => adjustColumnWidths(tableId), 10);// Revisar el TimeOut por que se usa 
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

    // Ajustar anchos iniciales si hay filas pre-existentes
    document.querySelectorAll("table[id]").forEach(table => {
        const tbody = table.querySelector("tbody");
        if (tbody && tbody.rows.length > 0) {
            // Configurar listeners para textareas existentes
            tbody.querySelectorAll("textarea").forEach(ta => {
                ta.addEventListener("input", function () {
                    autoResizeHeight(this);
                    // setTimeout(() => adjustColumnWidths(table.id), 10);
                });

                const resizeObserver = new ResizeObserver(entries => {
                    // setTimeout(() => adjustColumnWidths(table.id), 10);
                });
                resizeObserver.observe(ta);

                autoResizeHeight(ta);
            });
            
            // adjustColumnWidths(table.id);
        }
    });
});