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

      // Hacer campos editables por prompt
      [evidenciaInput, hallazgoInput].forEach(input => {
        input.addEventListener('click', () => {
          const texto = prompt("Editar texto:", input.value);
          if (texto !== null) input.value = texto;
        });
      });

      // Generar hallazgo automáticamente
      califSelect.addEventListener('change', function () {
        const nombreProceso = procesoInput.value;
        const nombreLugar = lugarInput.value;
        const evidencia = evidenciaInput.value || "___";
        const valorSeccion = indice;
        const valorTextoSeccion = clausula;
        const valorTextoNorma = normaDict[valorTextoSeccion] || "___";

        let texto = "";
        switch (this.value) {
          case "Fortaleza":
            texto = `Fortaleza: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.`;
            break;
          case "Conformidad":
            texto = `Conformidad: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, cumpliendo con la norma ISO 55001 en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
            break;
          case "Recomendación":
            texto = `Recomendación: Evaluar la pertinencia en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, de evidencia: ${evidencia}.`;
            break;
          case "Riesgo":
            texto = `Riesgo: Es un riesgo en el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}.\nObjeto de impacto: ___.`;
            break;
          case "No Conformidad":
            texto = `No conforme: En el proceso: ${nombreProceso}, y lugar: ${nombreLugar}, se evidenció: ${evidencia}, incumpliendo la norma ISO 55001 en el requisito: ${valorTextoSeccion} - ${valorSeccion}, que establece: ${valorTextoNorma}.`;
            break;
          default:
            texto = "";
        }

        hallazgoInput.value = texto;
      });

    });
}
