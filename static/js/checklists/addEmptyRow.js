function addEmptyRow() {
  const auditTbody = document.getElementById('auditTableBody');
  const newRow = document.createElement('tr');
  const rowCount = auditTbody.rows.length + 1;

  newRow.innerHTML = `
    <td style="width:1%; text-align:center;">
        ${rowCount}
        <input type="hidden" name="numero_fila" value="${rowCount}">
    </td>
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
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

  // Referencias dentro de la nueva fila
  const evidenciaInput = newRow.querySelector('input[name="evidencia"]');
  const hallazgoInput = newRow.querySelector('input[name="hallazgo"]');
  const califSelect = newRow.querySelector('select[name="calificacion"]');

  // Hacer editables los campos al hacer click
  [evidenciaInput, hallazgoInput].forEach(input => {
    input.addEventListener('click', () => {
      const texto = prompt("Editar texto:", input.value);
      if (texto !== null) input.value = texto;
    });
  });

  // Auto generar texto en hallazgo según calificación
  califSelect.addEventListener('change', function () {
    hallazgoInput.value = "esto es un texto de prueba " + this.value;
  });
}