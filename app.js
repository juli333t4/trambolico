function procesar() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Subí un archivo");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("output").textContent =
      "Archivo cargado: " + file.name;
  };
  reader.readAsText(file);
}
