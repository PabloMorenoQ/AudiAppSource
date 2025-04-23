function downloadChecklistExcel() {
    const select = document.getElementById("checklistSelector");
    const checklistId = select.value;

    if (!checklistId) {
        alert("Selecciona una checklist primero.");
        return;
    }

    fetch("/audit/excel/download/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"
        },
        body: JSON.stringify({ checklist_id: checklistId })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al generar Excel.");
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `checklist_${checklistId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        closeChecklistModal();
    })
    .catch(error => alert(error));
}