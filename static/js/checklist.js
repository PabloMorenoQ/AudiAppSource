document.getElementById("formulario").addEventListener("submit", function(event) {
    event.preventDefault();
    let formData = new FormData(this);
    let jsonObject = {};
    formData.forEach((value, key) => { jsonObject[key] = value; });
    document.getElementById("jsonOutput").textContent = JSON.stringify(jsonObject, null, 4);
});