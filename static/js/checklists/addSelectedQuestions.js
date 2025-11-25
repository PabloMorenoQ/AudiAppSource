// function addSelectedQuestions() {
//   const preguntasTbody = document.getElementById('preguntasTableBody');
//   const auditTbody = document.getElementById('auditTableBody');

//   // 🔹 Obtener valores actuales de Proceso y Lugar desde el formulario
//   const procesoSeleccionado = document.getElementById('process_id').value;
//   const lugarSeleccionado = document.getElementById('place_id').value;

//   preguntasTbody
//     .querySelectorAll('input.select-clausula:checked')
//     .forEach(checkbox => {
//       const fila = checkbox.closest('tr');
//       const [clausula, indice, pregunta] = [
//         fila.children[0].innerText.trim(),
//         fila.children[1].innerText.trim(),
//         fila.children[2].innerText.trim()
//       ];

//       const rowCount = auditTbody.rows.length + 1;
//       const newRow = document.createElement('tr');

//       newRow.innerHTML = `
//         <td style="width:1%; text-align:center;">
//           ${rowCount}
//           <input type="hidden" name="numero_fila" value="${rowCount}">
//         </td>
//         <td style="text-align:center;">
//           ${clausula}
//           <input type="hidden" name="clausula" value="${clausula}">
//         </td>
//         <td style="width:1%; text-align:center;">
//           ${indice}
//           <input type="hidden" name="indice" value="${indice}">
//         </td>
//         <td>
//           ${pregunta}
//           <input type="hidden" name="pregunta" value="${pregunta}">
//         </td>
//         <td>
//           <input type="text" class="form-control" name="evidencia" readonly placeholder="Click para editar">
//         </td>
//         <td>
//           <select class="form-select" name="calificacion">
//             <option value="">Seleccionar...</option>
//             <option value="Fortaleza">Fortaleza</option>
//             <option value="Conformidad">Conformidad</option>
//             <option value="Recomendación">Recomendación</option>
//             <option value="Riesgo">Riesgo</option>
//             <option value="No Conformidad">No Conformidad</option>
//           </select>
//         </td>
//         <td>
//           <input type="text" class="form-control" name="hallazgo" readonly placeholder="Auto/Click para editar">
//         </td>

//         <!-- 🔸 Campos ocultos adicionales -->
//         <input type="hidden" name="proceso" value="${procesoSeleccionado}">
//         <input type="hidden" name="lugar" value="${lugarSeleccionado}">
//       `;

//       auditTbody.appendChild(newRow);
//       checkbox.checked = false;

//       const currentRow = auditTbody.lastElementChild;
//       const evidenciaInput = currentRow.querySelector('input[name="evidencia"]');
//       const califSelect = currentRow.querySelector('select[name="calificacion"]');
//       const hallazgoInput = currentRow.querySelector('input[name="hallazgo"]');

//       // 🔹 Capturar inputs ocultos desde el DOM
//       const procesoInput = currentRow.querySelector('input[name="proceso"]');
//       const lugarInput = currentRow.querySelector('input[name="lugar"]');

//       // Hacer campos editables por prompt
//       // Hacer campos editables con modal
//       evidenciaInput.addEventListener('click', () => {
//         const preguntaTexto = currentRow.cells[3].innerText.trim(); // cells[3] es la columna de la pregunta
//         openTextModal(evidenciaInput, 'Evidencia', preguntaTexto);
//       });

//       hallazgoInput.addEventListener('click', () => {
//         const preguntaTexto = currentRow.cells[3].innerText.trim();
//         openTextModal(hallazgoInput, 'Hallazgo', preguntaTexto);
//       });

//       // Generar hallazgo automáticamente
//       // Generar hallazgo automáticamente
//       califSelect.addEventListener('change', function () {
//         const nombreProceso = procesoInput.value;
//         const nombreLugar = lugarInput.value;
//         const evidencia = evidenciaInput.value || "___";
//         const valorSeccion = indice;
//         const valorTextoSeccion = clausula;
//         // Buscar primero con índice completo (ej: "4.1"), luego solo con cláusula (ej: "4")
//         const valorTextoNorma = isoValues[valorSeccion] || isoValues[valorTextoSeccion] || normaDict[valorTextoSeccion] || "___";

//         // Determinar el nombre de la norma para mostrar
//         let nombreNorma = "ISO 55001";
//         if (selectedStandard.includes("2015")) {
//           nombreNorma = "ISO 55001:2015";
//         } else if (selectedStandard.includes("2024")) {
//           nombreNorma = "ISO 55001:2024";
//         }

//         let texto = "";
//         switch (this.value) {
//           case "Fortaleza":
//             texto = `Fortaleza: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.`;
//             break;
//           case "Conformidad":
//             texto = `Conformidad: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, cumpliendo con la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
//             break;
//           case "Recomendación":
//             texto = `Recomendación: Evaluar la pertinencia en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, de evidencia: ${evidencia}.`;
//             break;
//           case "Riesgo":
//             texto = `Riesgo: Es un riesgo en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.\nObjeto de impacto: ___.`;
//             break;
//           case "No Conformidad":
//             texto = `No conforme: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, incumpliendo la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
//             break;
//           default:
//             texto = "";
//         }

//         hallazgoInput.value = texto;
//       });
//     });
// }

function addSelectedQuestions() {
  const preguntasTbody = document.getElementById('preguntasTableBody');
  const auditTbody = document.getElementById('auditTableBody');

  // 🔹 Obtener valores actuales de Proceso y Lugar desde el formulario
  const procesoSeleccionado = document.getElementById('process_id').value;
  const lugarSeleccionado = document.getElementById('place_id').value;

  preguntasTbody
    .querySelectorAll('input.select-clausula:checked')
    .forEach(checkbox => {
      const fila = checkbox.closest('tr');
      const [clausula, indice, pregunta] = [
        fila.children[0].innerText.trim(),
        fila.children[1].innerText.trim(),
        fila.children[2].innerText.trim()
      ];

      const rowCount = auditTbody.rows.length + 1;
      const newRow = document.createElement('tr');

      newRow.innerHTML = `
        <td style="width:1%; text-align:center;">
          ${rowCount}
          <input type="hidden" name="numero_fila" value="${rowCount}">
        </td>
        <td style="text-align:center;">
          ${clausula}
          <input type="hidden" name="clausula" value="${clausula}">
        </td>
        <td style="width:1%; text-align:center;">
          ${indice}
          <input type="hidden" name="indice" value="${indice}">
        </td>
        <td>
          ${pregunta}
          <input type="hidden" name="pregunta" value="${pregunta}">
        </td>
        <td>
          <input type="text" class="form-control" name="evidencia" readonly placeholder="Click para editar">
        </td>
        <td>
          <select class="form-select" name="calificacion">
            <option value="">Seleccionar...</option>
            <option value="Fortaleza">Fortaleza</option>
            <option value="Conformidad">Conformidad</option>
            <option value="Recomendación">Recomendación</option>
            <option value="Riesgo">Riesgo</option>
            <option value="No Conformidad">No Conformidad</option>
          </select>
        </td>
        <td>
          <input type="text" class="form-control" name="hallazgo" readonly placeholder="Auto/Click para editar">
        </td>

        <!-- 🔸 Campos ocultos adicionales -->
        <input type="hidden" name="proceso" value="${procesoSeleccionado}">
        <input type="hidden" name="lugar" value="${lugarSeleccionado}">
      `;

      auditTbody.appendChild(newRow);
      checkbox.checked = false;

      const currentRow = auditTbody.lastElementChild;
      const evidenciaInput = currentRow.querySelector('input[name="evidencia"]');
      const califSelect = currentRow.querySelector('select[name="calificacion"]');
      const hallazgoInput = currentRow.querySelector('input[name="hallazgo"]');

      // 🔹 Capturar inputs ocultos desde el DOM
      const procesoInput = currentRow.querySelector('input[name="proceso"]');
      const lugarInput = currentRow.querySelector('input[name="lugar"]');

      // Hacer campos editables con modal
      evidenciaInput.addEventListener('click', () => {
        const preguntaTexto = currentRow.cells[3].innerText.trim();
        openTextModal(evidenciaInput, 'Evidencia', preguntaTexto);
      });

      hallazgoInput.addEventListener('click', () => {
        const preguntaTexto = currentRow.cells[3].innerText.trim();
        openTextModal(hallazgoInput, 'Hallazgo', preguntaTexto);
      });

      // Generar hallazgo automáticamente
      califSelect.addEventListener('change', function () {
        const nombreProceso = procesoInput.value;
        const nombreLugar = lugarInput.value;
        const evidencia = evidenciaInput.value || "___";
        const valorSeccion = indice;
        const valorTextoSeccion = clausula;

        // ✅ Usar la función de búsqueda para obtener el texto de la norma
        let valorTextoNorma = isoValueSearch(isoValues, selectedStandard, valorTextoSeccion, valorSeccion);
        console.log(isoValueSearch(isoValues, selectedStandard, valorTextoSeccion, valorSeccion));
        
        // if (typeof isoValueSearch === 'function' && typeof isoValues !== 'undefined') {
        //   valorTextoNorma = isoValueSearch(isoValues, selectedStandard, valorTextoSeccion, valorSeccion);
        // } else if (typeof isoValues !== 'undefined' && isoValues) {
        //   // Fallback al método anterior si la función no existe
        //   valorTextoNorma = isoValues[valorSeccion] || isoValues[valorTextoSeccion] || "___";
        // }
        // if (valorTextoNorma === "___" && typeof normaDict !== 'undefined' && normaDict) {
        //   valorTextoNorma = normaDict[valorTextoSeccion] || "___";
        // }

        // Determinar el nombre de la norma para mostrar
        let nombreNorma = "ISO 55001";
        if (typeof selectedStandard !== 'undefined' && selectedStandard) {
          if (selectedStandard.includes("2015")) {
            nombreNorma = "ISO 55001:2015";
          } else if (selectedStandard.includes("2024")) {
            nombreNorma = "ISO 55001:2024";
          }
        }

        let texto = "";
        switch (this.value) {
          case "Fortaleza":
            texto = `En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.`;
            break;
          case "Conformidad":
            texto = `En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, cumpliendo con la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
            break;
          case "Recomendación":
            texto = `Evaluar la pertinencia en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, de evidencia: ${evidencia}.`;
            break;
          case "Riesgo":
            texto = `Es un riesgo en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.\nObjeto de impacto: ___.`;
            break;
          case "No Conformidad":
            texto = `En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, incumpliendo la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
            break;
          default:
            texto = "";
        }

        hallazgoInput.value = texto;
      });
    });
}


        /**
         * Helper para convertir el valor ISO en string legible
         * Maneja tanto strings como objetos con sub-índices
         */
        function formatIsoValue(value) {
        if (value === null || value === undefined) {
            return "___";
        }
        
        // Si ya es string, devolverlo directamente
        if (typeof value === 'string') {
            return value;
        }
        
        // Si es objeto (como {"1": "...", "2": "..."}), concatenar los valores
        if (typeof value === 'object' && !Array.isArray(value)) {
            const valores = [];
            
            // Ordenar las claves numéricamente
            const claves = Object.keys(value).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return numA - numB;
            });
            
            // Concatenar todos los valores
            claves.forEach(key => {
            if (value[key] && typeof value[key] === 'string') {
                valores.push(value[key].trim());
            }
            });
            
            return valores.length > 0 ? valores.join(' ') : "___";
        }
        
        // Si es array, unir los elementos
        if (Array.isArray(value)) {
            return value.join(' ');
        }
        
        // Fallback: convertir a string
        return String(value);
        }

        function safeLogValue(value) {
        if (value === null || value === undefined) {
            return 'null/undefined';
        }
        if (typeof value === 'string') {
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
        }
        if (typeof value === 'object') {
            const jsonStr = JSON.stringify(value);
            return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
        }
        return String(value);
        }

        /**
         * Busca el valor textual de una norma ISO basado en la cláusula y sección
         * @param {Object} isoValues - Objeto con los valores ISO precargados
         * @param {string} selectedStandard - Nombre del archivo JSON del estándar
         * @param {string} valorTextoSeccion - Cláusula textual (ej: "4.1")
         * @param {string} valorSeccion - Índice/sección (ej: "4.1.1")
         * @returns {string} - Texto de la norma o "___" si no se encuentra
         */
        function isoValueSearch(isoValues, selectedStandard, valorTextoSeccion, valorSeccion) {
        let valorTextoNorma = "___";
        
        // Validar que isoValues existe y es un objeto
        if (!isoValues || typeof isoValues !== 'object') {
            console.warn('⚠️ isoValues no está disponible o no es un objeto');
            return valorTextoNorma;
        }
        
        // 1. Intentar búsqueda exacta con valorSeccion (más específico, ej: "4.1.1")
        if (valorSeccion && isoValues[valorSeccion]) {
            valorTextoNorma = isoValues[valorSeccion];
            console.log(`✅ Encontrado en isoValues["${valorSeccion}"]:`, safeLogValue(valorTextoNorma));
            valorTextoNormaFormated = formatIsoValue(valorTextoNorma);
            return valorTextoNormaFormated;
        }
        
        // 2. Intentar búsqueda con valorTextoSeccion (cláusula general, ej: "4.1")
        if (valorTextoSeccion && isoValues[valorTextoSeccion]) {
            valorTextoNorma = isoValues[valorTextoSeccion];
            console.log(`✅ Encontrado en isoValues["${valorTextoSeccion}"]:`, safeLogValue(valorTextoNorma));
            valorTextoNormaFormated = formatIsoValue(valorTextoNorma);
            return valorTextoNormaFormated;
        }
        
        // 3. Buscar subcláusulas que empiecen con valorTextoSeccion
        if (valorTextoSeccion) {
            for (const key in isoValues) {
            if (key.startsWith(valorTextoSeccion + '.')) {
                valorTextoNorma = isoValues[key];
                console.log(`✅ Encontrado subcláusula "${key}":`, safeLogValue(valorTextoNorma));
                return valorTextoNorma;
            }
            }
        }
        
        // 4. Si no se encuentra, intentar en normaDict como fallback
        if (typeof normaDict !== 'undefined' && normaDict) {
            if (valorTextoSeccion && normaDict[valorTextoSeccion]) {
            valorTextoNorma = normaDict[valorTextoSeccion];
            console.log(`✅ Encontrado en normaDict["${valorTextoSeccion}"]:`, safeLogValue(valorTextoNorma));
            return valorTextoNorma;
            }
        }
        
        // Si no se encuentra nada
        console.warn(`⚠️ No se encontró valor para cláusula: "${valorTextoSeccion}" / sección: "${valorSeccion}"`);
        
        return valorTextoNorma;
        }

        console.log('✅ Función isoValueSearch cargada correctamente');
