function downloadChecklistExcel(checklistId) {
    if (!checklistId) {
        alert("Selecciona una checklist válida.");
        return;
    }

    fetch("/accounts/dashboard/checklist/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"  // Asegurate de tener esta variable definida globalmente
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
    })
    .catch(error => alert(error));
}

function downloadAuditPlanExcel(auditPlanId) {
    // const select = document.getElementById("auditPlanSelector");
    const planId = auditPlanId;

    if (!planId) {
        alert("Selecciona un plan primero.");
        return;
    }

    console.log(planId)
    fetch("/accounts/dashboard/auditPlan/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"
        },
        body: JSON.stringify({ plan_id: planId })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al generar Excel del plan.");
        return res.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.download= `audit_plan_${planId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    })
    .catch(error => alert(error));
}

function downloadReportExcel(report_Id) {
    // const select = document.getElementById("reportSelector");
    const reportId = report_Id;

    if (!reportId) {
        alert("Selecciona un informe primero.");
        return;
    }

    fetch("/accounts/dashboard/report/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": "{{ csrf_token }}"
        },
        body: JSON.stringify({ report_id: reportId })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al generar Excel del informe.");
        return res.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.download= `report_${reportId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    })
    .catch(error => alert(error));
}