function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function initFileLoader() {
    const fileInput = document.getElementById('fileInput');
    const cargarBtn = document.getElementById('cargarBtn');
    const jsonContent = document.getElementById('jsonContent');

    cargarBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                jsonContent.value = content;

                try {
                    const data = JSON.parse(content);

                    if (Array.isArray(data)) {
                        const firstItem = data[0] || {};
                        
                        if (firstItem.tipo_proceso) {
                            const tipoRadio = document.querySelector(`input[name="tipo"][value="${firstItem.tipo_proceso}"]`);
                            if (tipoRadio) tipoRadio.checked = true;
                        }

                        data.forEach((item, index) => {
                            const fila = {
                                no: item.indice || index + 1,
                                clausula: item.clausula || 'N/A',
                                norma: 'ISO 55001',
                                hallazgo: item.hallazgo || 'Sin hallazgo',
                                evidencia: item.evidencia || 'Sin evidencia',
                                dependencia: 'N/A',
                                lugar: item.lugar || 'N/A',
                                proceso: item.proceso || item.pregunta || 'Sin proceso',
                                tipoProceso: item.tipo_proceso || 'N/A',
                                responsable: 'N/A'
                            };

                            // Asegurarse de que calificacion sea una cadena
                            let calificacion = item.calificacion;

                            // Si calificacion es un objeto, intentamos acceder a su valor adecuado
                            if (typeof calificacion === 'object') {
                                calificacion = calificacion.valor || ''; // Si el valor está dentro de una propiedad 'valor'
                            }

                            // Convertimos calificacion a una cadena en minúsculas y eliminamos los acentos
                            calificacion = removeAccents(String(calificacion || '').toLowerCase());
                            console.log('Procesando calificación:', calificacion); // Para depuración

                            // Llamar a insertRowInTable con los datos correctos
                            insertRowInTable(fila, calificacion);
                        });
                    } else {
                        console.error('El archivo no contiene un array de objetos válido.');
                    }

                } catch (err) {
                    console.error('Error parseando el JSON:', err);
                }
            };
            reader.readAsText(file);
        }
    });
}
