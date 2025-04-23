function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    
    document.querySelectorAll('.navbar a').forEach(a => a.classList.remove('active'));
    element.classList.add('active');
}

function showSummary(summaryId, element) {
    document.querySelectorAll('.summary-box').forEach(box => {
        box.style.display = 'none';
    });
    document.getElementById(summaryId).style.display = 'block';
    
    document.querySelectorAll('.summary-options a').forEach(a => a.classList.remove('active'));
    element.classList.add('active');
}