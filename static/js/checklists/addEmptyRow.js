function addEmptyRow() {
  const auditTbody = document.getElementById('auditTableBody');
  const newRow = document.createElement('tr');
  const rowCount = auditTbody.rows.length + 1;

  const procesoSeleccionado = document.getElementById('process_id').value;
  const lugarSeleccionado = document.getElementById('place_id').value;

  newRow.innerHTML = `
    <td style="width:1%; text-align:center;">
      ${rowCount}
      <input type="hidden" name="numero_fila" value="${rowCount}">
    </td>
    <td style="text-align:center;">
      <input type="text" class="form-control" name="clausula" placeholder="Cláusula">
    </td>
    <td style="width:1%; text-align:center;">
      <input type="text" class="form-control" name="indice" placeholder="Índice">
    </td>
    <td>
      <input type="text" class="form-control" name="pregunta" placeholder="Pregunta">
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

  // Referencias
  const evidenciaInput = newRow.querySelector('input[name="evidencia"]');
  const hallazgoInput = newRow.querySelector('input[name="hallazgo"]');
  const califSelect = newRow.querySelector('select[name="calificacion"]');

  const clausulaInput = newRow.querySelector('input[name="clausula"]');
  const indiceInput = newRow.querySelector('input[name="indice"]');
  const preguntaInput = newRow.querySelector('input[name="pregunta"]');
  const procesoInput = newRow.querySelector('input[name="proceso"]');
  const lugarInput = newRow.querySelector('input[name="lugar"]');

  // 🔹 Permitir edición con prompt
  [evidenciaInput, hallazgoInput].forEach(input => {
    input.addEventListener('click', () => {
      const texto = prompt("Editar texto:", input.value);
      if (texto !== null) input.value = texto;
    });
  });

  // 🔹 Autogenerar hallazgo según selección
  califSelect.addEventListener('change', function () {
    const nombreProceso = procesoInput.value || "___";
    const nombreLugar = lugarInput.value || "___";
    const evidencia = evidenciaInput.value || "___";
    const valorSeccion = indiceInput.value || "___";
    const valorTextoSeccion = clausulaInput.value || "___";
    const valorTextoNorma = preguntaInput.value || "___";

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
}
