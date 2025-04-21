function addSelectedQuestions() {
  const preguntasTbody = document.getElementById('preguntasTableBody');
  const auditTbody    = document.getElementById('auditTableBody');

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
      `;

      auditTbody.appendChild(newRow);
      checkbox.checked = false;

      // Referencias a los campos de esta fila
      const currentRow       = auditTbody.lastElementChild;
      const evidenciaInput   = currentRow.querySelector('input[name="evidencia"]');
      const califSelect      = currentRow.querySelector('select[name="calificacion"]');
      const hallazgoInput    = currentRow.querySelector('input[name="hallazgo"]');

      // 2) Al hacer click en evidencia o hallazgo -> prompt() para editar
      [evidenciaInput, hallazgoInput].forEach(input => {
        input.addEventListener('click', () => {
          const texto = prompt("Editar texto:", input.value);
          if (texto !== null) input.value = texto;
        });
      });

      // 3) Al cambiar la calificación -> generar texto en hallazgo
      califSelect.addEventListener('change', function() {
        hallazgoInput.value = "esto es un texto de prueba " + this.value;
      });
  });
}
