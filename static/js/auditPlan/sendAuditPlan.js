/**
 * NOTA: Requiere SweetAlert2
 * Agregar en el <head> del HTML:
 * <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
 */

document.getElementById('auditPlanForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevenir envío automático del formulario

    // ===================================
    // 1️⃣ VALIDACIONES PREVIAS
    // ===================================
    
    // Validar que se haya seleccionado una cláusula/norma
    const clausulaSelect = document.querySelector('select[name="clausula"]');
    if (!clausulaSelect || !clausulaSelect.value) {
        Swal.fire({
            icon: 'warning',
            title: 'Norma requerida',
            text: 'Por favor selecciona una norma antes de guardar el plan.',
            confirmButtonColor: '#3085d6'
        });
        clausulaSelect?.focus();
        return;
    }

    // ===================================
    // 2️⃣ RECOLECTAR DATOS DE TABLAS
    // ===================================
    const tables = [
        'tabla-objetivos', 'tabla-alcance', 'tabla-criterios', 'tabla-revision',
        'tabla-riesgos', 'tabla-metodologia', 'tabla-oportunidades',
        'tabla-recursos', 'tabla-equipoAuditor', 'tabla-estapasAud', 'tabla-planAud'
    ];

    let planData = {};
    let hasData = false;

    tables.forEach(id => {
        const rows = [];
        const tableBody = document.querySelector(`#${id} tbody`);
        
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(tr => {
                const cells = Array.from(tr.querySelectorAll('td')).map(td => {
                    const input = td.querySelector('input, textarea');
                    return input ? input.value.trim() : td.innerText.trim();
                });
                if (cells.some(cell => cell !== '')) { // Solo agregar filas con datos
                    rows.push(cells);
                    hasData = true;
                }
            });
        }
        
        planData[id] = rows;
    });

    // Validar que haya al menos algunos datos
    if (!hasData) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay datos en las tablas para guardar. Completa al menos una tabla antes de continuar.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    // ===================================
    // 3️⃣ RECOLECTAR DIVS EDITABLES
    // ===================================
    document.querySelectorAll('.editable[contenteditable]').forEach(div => {
        const key = div.id || div.parentElement?.id || 'unnamed';
        planData[key] = div.innerText.trim();
    });

    // ===================================
    // 4️⃣ PREPARAR DATOS PARA ENVÍO
    // ===================================
    const formData = new FormData(this);
    formData.set('plan_content', JSON.stringify(planData));

    // ===================================
    // 5️⃣ MOSTRAR LOADING
    // ===================================
    Swal.fire({
        title: 'Guardando Plan de Auditoría...',
        html: 'Por favor espera mientras se procesa la información',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // ===================================
    // 6️⃣ ENVIAR DATOS AL SERVIDOR
    // ===================================
    fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(err => {
                throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
            });
        }
    })
    .then(result => {
        // ✅ ÉXITO
        console.log('Plan guardado exitosamente:', result);
        
        Swal.fire({
            icon: 'success',
            title: '¡Plan de Auditoría Guardado!',
            html: `
                <div class="text-start">
                    <p><strong>El plan se ha creado correctamente.</strong></p>
                    <hr>
                    <p><strong>ID del Plan:</strong> ${result.id || 'N/A'}</p>
                    <p><strong>Fecha de Creación:</strong> ${result.creation_date || 'N/A'}</p>
                    <p><strong>Organización:</strong> ${result.organization || 'N/A'}</p>
                    <p><strong>Auditor Líder:</strong> ${result.leader_auditor || 'N/A'}</p>
                    ${result.clauses_list ? `<p><strong>Cláusulas:</strong> ${result.clauses_list.substring(0, 50)}...</p>` : ''}
                </div>
            `,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Continuar',
            width: '600px'
        })
    })
    .catch(error => {
        // ❌ ERROR
        console.error('Error al guardar plan:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar el plan',
            html: `
                <div class="text-start">
                    <p>No se pudo guardar el Plan de Auditoría.</p>
                    <hr>
                    <p><strong>Error:</strong></p>
                    <p class="text-danger">${error.message}</p>
                    <hr>
                    <p><small>Si el problema persiste, contacta al administrador del sistema.</small></p>
                </div>
            `,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Entendido',
            width: '600px',
            footer: '<button type="button" class="btn btn-sm btn-secondary" onclick="console.log(\'Error completo:\', arguments)">Ver detalles técnicos</button>'
        });
    });
});

// ===================================
// FUNCIÓN HELPER: Validar tablas específicas
// ===================================
function validatePlanAudTable() {
    const planAudRows = document.querySelectorAll('#tabla-planAud tbody tr');
    
    if (planAudRows.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Tabla de Plan incompleta',
            text: 'La tabla "Plan de Auditoría" está vacía. Completa al menos una fila.',
            confirmButtonColor: '#3085d6'
        });
        return false;
    }
    
    return true;
}

// ===================================
// OPCIONAL: Auto-guardar borrador cada 5 minutos
// ===================================
let autoSaveInterval = null;

function enableAutoSave() {
    autoSaveInterval = setInterval(() => {
        const planData = collectPlanData();
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('audit_plan_draft', JSON.stringify({
            data: planData,
            timestamp: new Date().toISOString()
        }));
        
        // Mostrar toast discreto
        const toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        
        toast.fire({
            icon: 'info',
            title: 'Borrador guardado'
        });
    }, 5 * 60 * 1000); // 5 minutos
}

function collectPlanData() {
    const tables = [
        'tabla-objetivos', 'tabla-alcance', 'tabla-criterios', 'tabla-revision',
        'tabla-riesgos', 'tabla-metodologia', 'tabla-oportunidades',
        'tabla-recursos', 'tabla-equipoAuditor', 'tabla-estapasAud', 'tabla-planAud'
    ];

    let planData = {};

    tables.forEach(id => {
        const rows = [];
        const tableBody = document.querySelector(`#${id} tbody`);
        
        if (tableBody) {
            tableBody.querySelectorAll('tr').forEach(tr => {
                const cells = Array.from(tr.querySelectorAll('td')).map(td => {
                    const input = td.querySelector('input, textarea');
                    return input ? input.value.trim() : td.innerText.trim();
                });
                rows.push(cells);
            });
        }
        
        planData[id] = rows;
    });

    return planData;
}

// Activar auto-guardado (opcional, comenta si no lo quieres)
// enableAutoSave();

// Limpiar intervalo al salir de la página
window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});