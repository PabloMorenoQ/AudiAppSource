/**
 * NOTA: Requiere SweetAlert2
 * Versión actualizada que envía plan_id al servidor
 */

function sendChecklistToServer() {
    const rows = document.querySelectorAll('#auditTableBody tr');
    let data = [];

    // ===================================
    // 1️⃣ OBTENER PLAN_ID
    // ===================================
    // Primero intentar desde la URL, luego desde el select
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan_id') || 
                   document.getElementById('plan_id')?.value ||
                   document.querySelector('select[name="plan_id"]')?.value;
    
    console.log('🔍 Plan ID detectado:', planId);

    // ===================================
    // 2️⃣ VALIDACIONES PREVIAS
    // ===================================
    
    // Validar que hay un plan seleccionado
    if (!planId) {
        Swal.fire({
            icon: 'warning',
            title: 'Plan no seleccionado',
            text: 'Por favor selecciona un plan de auditoría antes de guardar el checklist.',
            confirmButtonColor: '#3085d6'
        });
        // Hacer scroll al select del plan
        document.getElementById('plan_id')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Validar que hay datos en la tabla
    if (rows.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay datos para guardar. Agrega al menos una pregunta al checklist.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    // Capturar datos generales del formulario
    const process = document.getElementById("process_id").value.trim();
    const place = document.getElementById("place_id").value.trim();
    const processTypeRadio = document.querySelector('input[name="tipo"]:checked');
    let processType = processTypeRadio?.value || "";

    if (processType === "ciclo de vida") {
        const cicloVidaDetails = document.getElementById("ciclo_vida_input")?.value.trim();
        if (cicloVidaDetails) {
            processType = `ciclo de vida : ${cicloVidaDetails}`;
        }
    }
    const dependency = dependencia;

    // Validar proceso
    if (!process) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Por favor selecciona un proceso antes de guardar.',
            confirmButtonColor: '#3085d6'
        });
        document.getElementById("process_id")?.focus();
        return;
    }

    // Validar lugar
    if (!place) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Por favor selecciona un lugar antes de guardar.',
            confirmButtonColor: '#3085d6'
        });
        document.getElementById("place_id")?.focus();
        return;
    }

    // Validar tipo de proceso
    if (!processType) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'Por favor selecciona un tipo de proceso antes de guardar.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    // ===================================
    // 3️⃣ RECOLECTAR DATOS DE LA TABLA
    // ===================================
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
                process_type: processType,  // ✅ Incluye detalles si los hay
            });
        }
    });

    // ===================================
    // 4️⃣ PREPARAR DATOS PARA ENVÍO
    // ===================================
    const checklistData = {
        plan_id: planId,  // 👈 NUEVO: Incluir plan_id
        process: process,
        place: place,
        clauses_list: data.map(d => d.clausula).join(', '),
        process_type: processType,
        audit_data: JSON.stringify(data),
        dependency: dependency
    };

    console.log('📦 Datos a enviar:', checklistData);

    // ===================================
    // 5️⃣ MOSTRAR LOADING
    // ===================================
    Swal.fire({
        title: 'Guardando Checklist...',
        html: `
            <p>Por favor espera mientras se procesa la información</p>
            <p><small>Plan ID: ${planId}</small></p>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // ===================================
    // 6️⃣ ENVIAR AL SERVIDOR
    // ===================================
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
            return response.json().then(err => {
                throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
            });
        }
    })
    .then(result => {
        // ✅ ÉXITO
        console.log('✅ Checklist guardado:', result);
        
        Swal.fire({
            icon: 'success',
            title: '¡Checklist Guardado!',
            html: `
                <div class="text-start">
                    <p><strong>El checklist se ha guardado correctamente.</strong></p>
                    <hr>
                    <p><strong>ID del Checklist:</strong> ${result.id || 'N/A'}</p>
                    <p><strong>Plan de Auditoría:</strong> ${result.plan_id ? `Plan #${result.plan_id}` : 'N/A'}</p>
                    <p><strong>Proceso:</strong> ${process}</p>
                    <p><strong>Lugar:</strong> ${place}</p>
                    <p><strong>Tipo:</strong> ${processType}</p>
                    <p><strong>Total de preguntas:</strong> ${data.length}</p>
                </div>
            `,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Continuar',
            width: '600px'
        }).then(() => {
            // Opciones post-guardado
            Swal.fire({
                icon: 'question',
                title: '¿Qué deseas hacer ahora?',
                html: `
                    <p>Tu checklist ha sido guardado exitosamente.</p>
                    <p>Puedes continuar trabajando en este plan o crear uno nuevo.</p>
                `,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Crear otro checklist',
                denyButtonText: 'Ver reportes',
                cancelButtonText: 'Quedarme aquí',
                confirmButtonColor: '#3085d6',
                denyButtonColor: '#6c757d'
            }).then((action) => {
                if (action.isConfirmed) {
                    // Limpiar tabla para crear nuevo checklist
                    const auditTableBody = document.getElementById('auditTableBody');
                    if (auditTableBody) {
                        auditTableBody.innerHTML = '';
                    }
                    
                    // Limpiar campos del formulario (excepto el plan)
                    const processSelect = document.getElementById('process_id');
                    const placeSelect = document.getElementById('place_id');
                    const tipoRadios = document.querySelectorAll('input[name="tipo"]');
                    
                    if (processSelect) processSelect.value = '';
                    if (placeSelect) placeSelect.value = '';
                    tipoRadios.forEach(radio => radio.checked = false);
                    
                    window.scrollTo(0, 0);
                    
                    Swal.fire({
                        icon: 'info',
                        title: 'Tabla limpia',
                        text: 'Puedes crear un nuevo checklist para el mismo plan',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else if (action.isDenied) {
                    // Redirigir a reportes
                    window.location.href = '/reports/';
                }
            });
        });
    })
    .catch(error => {
        // ❌ ERROR
        console.error('❌ Error al guardar checklist:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar el checklist',
            html: `
                <div class="text-start">
                    <p>No se pudo guardar el checklist.</p>
                    <hr>
                    <p><strong>Error:</strong></p>
                    <p class="text-danger">${error.message}</p>
                    <hr>
                    <p><small>Verifica que el plan de auditoría existe y que tienes permisos para crear checklists.</small></p>
                    <p><small>Si el problema persiste, contacta al administrador del sistema.</small></p>
                </div>
            `,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Entendido',
            width: '600px'
        });
    });
}