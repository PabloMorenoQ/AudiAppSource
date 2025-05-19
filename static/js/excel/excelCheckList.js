function downloadChecklistExcel(checklistId) {
    if (!checklistId) {
        alert("Selecciona una checklist válida.");
        return;
    }

    const url = `/accounts/dashboard/checklist/?checklist_id=${checklistId}`;
    window.location.href = url;
}

function downloadAuditPlanExcel(planId) {
    if (!planId) {
        alert("ID de plan inválido");
        return;
    }
    const url = `/accounts/dashboard/auditPlan/?plan_id=${planId}`;
    window.location.href = url;
}

function downloadReportExcel(report_id) {
    if (!report_id) {
        alert("ID de plan inválido");
        return;
    }
    const url = `/accounts/dashboard/report/?report_id=${report_id}`;
    window.location.href = url;
}