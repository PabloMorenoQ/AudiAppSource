document.addEventListener("DOMContentLoaded", function () {
    // Función para ajustar altura del textarea automáticamente
    function autoResizeHeight(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }
    
    // Función para agregar una fila
    function addRow(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        // Asegurar tbody
        let tbody = table.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            table.appendChild(tbody);
        }

        const rowCount = tbody.rows.length + 1;
        const headerRow = table.querySelector("thead tr");
        const colCount = headerRow ? headerRow.children.length : 0;

        // Crear la fila
        const newRow = document.createElement("tr");

        for (let i = 0; i < colCount; i++) {
            const cell = document.createElement("td");
            cell.style.padding = "5px";
            cell.style.verticalAlign = "top";

            // Crear textarea
            const ta = document.createElement("textarea");
            ta.className = "form-control auto-resize";
            ta.placeholder = `Dato ${i + 1}`;
            ta.rows = 2;

            // Estilos para el textarea
            ta.style.width = "100%";
            ta.style.boxSizing = "border-box";
            ta.style.overflow = "hidden";
            ta.style.resize = "both"; // Permitir redimensionamiento manual
            ta.style.minHeight = "36px";
            ta.style.minWidth = "100px";
            

            // Listener para ajuste automático de altura al escribir
            ta.addEventListener("input", function () {
                autoResizeHeight(this);
                // Ajustar anchos de columnas cuando cambia el contenido
                // setTimeout(() => adjustColumnWidths(tableId), 10);
            });

            // Listener para cuando el usuario redimensiona manualmente
            // Usar ResizeObserver para detectar cambios de tamaño
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    // Recalcular anchos de columnas después del redimensionamiento
                    // setTimeout(() => adjustColumnWidths(tableId), 10);
                }
            });
            resizeObserver.observe(ta);

            // Listener para ajustar al perder el foco (después de redimensionar)
            ta.addEventListener("blur", function () {
                // setTimeout(() => adjustColumnWidths(tableId), 10);
            });

            // Añadir el textarea a la celda
            cell.appendChild(ta);
            newRow.appendChild(cell);
        }

        // Insertar la fila en el tbody
        tbody.appendChild(newRow);

        // Inicializar altura de los nuevos textareas
        newRow.querySelectorAll("textarea").forEach(t => {
            autoResizeHeight(t);
        });

        // Ajustar anchos de columnas después de agregar la fila
        // setTimeout(() => adjustColumnWidths(tableId), 10);
    }

    // Función para eliminar la última fila
    function removeRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector("tbody");
        if (tbody && tbody.rows.length > 0) {
            tbody.deleteRow(tbody.rows.length - 1);
            // Ajustar anchos después de eliminar
            // setTimeout(() => adjustColumnWidths(tableId), 10);
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