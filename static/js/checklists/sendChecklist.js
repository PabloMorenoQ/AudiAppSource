function sendChecklistToServer() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

    // Capturamos los datos generales del formulario
    const process = document.getElementById("process_id").value.trim();
    const place = document.getElementById("place_id").value.trim();
    const processType = document.querySelector('input[name="tipo"]:checked')?.value || "";
    const dependency = "{{ dependency|escapejs }}";

    // ✅ VALIDACIÓN: Verificar que hay datos
    if (rows.length === 0) {
        showToast("No hay datos para guardar. Agrega al menos una pregunta.", "warning");
        return;
    }

    // ✅ VALIDACIÓN: Campos requeridos
    if (!process) {
        showToast("Por favor selecciona un proceso antes de guardar.", "warning");
        document.getElementById("process_id")?.focus();
        return;
    }

    if (!place) {
        showToast("Por favor selecciona un lugar antes de guardar.", "warning");
        document.getElementById("place_id")?.focus();
        return;
    }

    if (!processType) {
        showToast("Por favor selecciona un tipo de proceso antes de guardar.", "warning");
        return;
    }

    // Procesar filas
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
                process_type: processType,
            });
        }
    });

    const checklistData = {
        process: process,
        place: place,
        clauses_list: data.map(d => d.clausula).join(', '),
        process_type: processType,
        audit_data: JSON.stringify(data),
        dependency: dependency
    };

    // ✅ Mostrar mensaje de carga
    showToast("Guardando checklist...", "info");

    // Deshabilitar botón
    const saveButton = document.querySelector('button[onclick*="sendChecklistToServer"]');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    }

    fetch("save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"
        },
        body: JSON.stringify(checklistData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    })
    .then(result => {
        // ✅ ÉXITO
        console.log("Checklist guardado:", result);
        showToast(`Checklist guardado correctamente (ID: ${result.id})`, "success");
    })
    .catch(error => {
        // ❌ ERROR
        console.error("Error:", error);
        showToast(`Error al guardar: ${error.message}`, "error");
    })
    .finally(() => {
        // Rehabilitar botón
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Guardar Checklist';
        }
    });
}

/**
 * Muestra un toast notification usando Bootstrap Toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = "info") {
    // Crear contenedor si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // Configuración de colores
    const colors = {
        success: { bg: 'bg-success', icon: '✅' },
        error: { bg: 'bg-danger', icon: '❌' },
        warning: { bg: 'bg-warning', icon: '⚠️' },
        info: { bg: 'bg-info', icon: 'ℹ️' }
    };

    const config = colors[type] || colors.info;

    // Crear toast
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white border-0 ' + config.bg;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${config.icon}</strong> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(toastEl);

    // Inicializar y mostrar el toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: type === 'error' ? 8000 : 4000
    });
    
    toast.show();

    // Eliminar del DOM después de ocultarse
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}