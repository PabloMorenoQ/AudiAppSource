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
            texto = `En el proceso: ${nombreProceso}, se evidenció: ${evidencia}.`;
            break;
          case "Conformidad":
            texto = `En el proceso: ${nombreProceso}, se evidenció: ${evidencia}, cumpliendo con la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}`;
            break;
          case "Recomendación":
            texto = `Evaluar la pertinencia en el proceso: ${nombreProceso}, se evidencia: ${evidencia}.`;
            break;
          case "Riesgo":
            texto = `Es un riesgo en el proceso: ${nombreProceso}, se evidenció: ${evidencia}. \nObjeto de impacto: `;
            break;
          case "No Conformidad":
            texto = `En el proceso: ${nombreProceso}, se evidenció: ${evidencia}, incumpliendo la norma ${nombreNorma} en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}`;
            break;
          default:
            texto = "";
        }

        hallazgoInput.value = texto;
      });
    });
}


function formatIsoValue(value) {
  console.log('🔧 formatIsoValue recibió:', typeof value, value);
  
  if (value === null || value === undefined) {
    console.log('🔧 formatIsoValue devuelve: "___" (null/undefined)');
    return "___";
  }
  
  // Si ya es string, devolverlo directamente
  if (typeof value === 'string') {
    console.log('🔧 formatIsoValue devuelve: string directo');
    return value;
  }
  
  // Si es objeto (como {"1": "...", "2": "..."}), concatenar los valores
  if (typeof value === 'object' && !Array.isArray(value)) {
    console.log('🔧 formatIsoValue: Es un objeto, concatenando valores...');
    const valores = [];
    
    // Ordenar las claves numéricamente
    const claves = Object.keys(value).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return isNaN(numA) || isNaN(numB) ? 0 : numA - numB;
    });
    
    console.log('🔧 Claves encontradas:', claves);
    
    // Concatenar todos los valores
    claves.forEach(key => {
      const val = value[key];
      console.log(`🔧 Procesando clave "${key}":`, typeof val, val);
      if (val && typeof val === 'string') {
        valores.push(val.trim());
      } else if (val) {
        valores.push(String(val).trim());
      }
    });
    
    const resultado = valores.length > 0 ? valores.join(' ') : "___";
    console.log('🔧 formatIsoValue devuelve:', resultado.substring(0, 50) + '...');
    return resultado;
  }
  
  // Si es array, unir los elementos
  if (Array.isArray(value)) {
    console.log('🔧 formatIsoValue: Es un array');
    const resultado = value.join(' ');
    console.log('🔧 formatIsoValue devuelve:', resultado);
    return resultado;
  }
  
  // Fallback: convertir a string
  console.log('🔧 formatIsoValue: Fallback a String()');
  const resultado = String(value);
  console.log('🔧 formatIsoValue devuelve:', resultado);
  return resultado;
}

/**
 * Helper para logging seguro de valores que pueden no ser strings
 */
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
 * @param {string} valorSeccion - Índice/sub-índice (ej: "1", "2", "3")
 * @returns {string} - Texto de la norma o "___" si no se encuentra
 */
function isoValueSearch(isoValues, selectedStandard, valorTextoSeccion, valorSeccion) {
  let valorTextoNorma = "___";
  
  // Validar que isoValues existe y es un objeto
  if (!isoValues || typeof isoValues !== 'object') {
    console.warn('⚠️ isoValues no está disponible o no es un objeto');
    return valorTextoNorma;
  }
  
  console.log(`🔍 Buscando: valorTextoSeccion="${valorTextoSeccion}", valorSeccion="${valorSeccion}"`);
  
  // 1. Si valorTextoSeccion existe en isoValues
  if (valorTextoSeccion && isoValues[valorTextoSeccion]) {
    const rawValue = isoValues[valorTextoSeccion];
    console.log(`📦 Encontrado isoValues["${valorTextoSeccion}"]:`, typeof rawValue);
    
    // 1a. Si es un string directo, retornarlo
    if (typeof rawValue === 'string') {
      valorTextoNorma = rawValue;
      console.log(`✅ Es string directo:`, safeLogValue(valorTextoNorma));
      return valorTextoNorma;
    }
    
    // 1b. Si es un objeto con sub-índices (tu caso: {"1": "...", "2": "..."})
    if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      console.log(`📂 Es objeto con sub-índices:`, Object.keys(rawValue));
      
      // Si valorSeccion es específico (ej: "1", "2"), buscar solo ese
      if (valorSeccion && valorSeccion !== valorTextoSeccion && rawValue[valorSeccion]) {
        valorTextoNorma = String(rawValue[valorSeccion]);
        console.log(`✅ Encontrado sub-índice ["${valorSeccion}"]:`, safeLogValue(valorTextoNorma));
        return valorTextoNorma;
      }
      
      // Si no hay sub-índice específico o no existe, concatenar todos
      console.log(`📝 Concatenando todos los sub-índices...`);
      valorTextoNorma = formatIsoValue(rawValue);
      console.log(`✅ Resultado concatenado:`, safeLogValue(valorTextoNorma));
      return valorTextoNorma;
    }
  }
  
  // 2. Buscar como clave directa con formato "X.Y" (fallback)
  const claveCompleta = valorTextoSeccion && valorSeccion ? `${valorTextoSeccion}.${valorSeccion}` : null;
  if (claveCompleta && isoValues[claveCompleta]) {
    const rawValue = isoValues[claveCompleta];
    valorTextoNorma = formatIsoValue(rawValue);
    console.log(`✅ Encontrado como clave completa ["${claveCompleta}"]:`, safeLogValue(valorTextoNorma));
    return valorTextoNorma;
  }
  
  // 3. Buscar subcláusulas que empiecen con valorTextoSeccion
  if (valorTextoSeccion) {
    for (const key in isoValues) {
      if (key.startsWith(valorTextoSeccion + '.')) {
        const rawValue = isoValues[key];
        valorTextoNorma = formatIsoValue(rawValue);
        console.log(`✅ Encontrado subcláusula "${key}":`, safeLogValue(valorTextoNorma));
        return valorTextoNorma;
      }
    }
  }
  
  // 4. Si no se encuentra, intentar en normaDict como fallback
  if (typeof normaDict !== 'undefined' && normaDict) {
    if (valorTextoSeccion && normaDict[valorTextoSeccion]) {
      const rawValue = normaDict[valorTextoSeccion];
      valorTextoNorma = formatIsoValue(rawValue);
      console.log(`✅ Encontrado en normaDict["${valorTextoSeccion}"]:`, safeLogValue(valorTextoNorma));
      return valorTextoNorma;
    }
  }
  
  // Si no se encuentra nada
  console.warn(`⚠️ No se encontró valor para cláusula: "${valorTextoSeccion}" / sección: "${valorSeccion}"`);
  
  return valorTextoNorma;
}

console.log('✅ Función isoValueSearch cargada correctamente');
