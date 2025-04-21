function addEmptyRow() {
    const auditTbody = document.getElementById('auditTableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
      <td><input type="text" class="form-control"></td>
    `;
    auditTbody.appendChild(newRow);
}