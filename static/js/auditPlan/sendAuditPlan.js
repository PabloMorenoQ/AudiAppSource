document.getElementById('auditPlanForm').addEventListener('submit', function(e) {
    // 1) Recolectar datos de cada tabla
        const tables = [
            'tabla-objetivos','tabla-alcance','tabla-criterios','tabla-revision',
            'tabla-riesgos','tabla-metodologia','tabla-oportunidades',
            'tabla-recursos','tabla-equipoAuditor','tabla-estapasAud','tabla-planAud'
        ];

        let planData = {};

        tables.forEach(id => {
            const rows = [];
            document.querySelectorAll(`#${id} tbody tr`).forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td => {
                const input = td.querySelector('input');
                return input ? input.value : td.innerText.trim();
            });
            rows.push(cells);
            });
            planData[id] = rows;
        });

        // 2) Recolectar contenido de divs .editable (si los hay)
        document.querySelectorAll('.editable[contenteditable]').forEach(div => {
            planData[div.id || div.parentElement.id + '_editable'] = div.innerText.trim();
        });

        // 3) Inyectar JSON en el input oculto
        document.getElementById('plan_content_input').value = JSON.stringify(planData);
        // y el form continua enviándose…
    });