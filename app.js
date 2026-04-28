function procesar() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Subí un archivo");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);

    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Mostrar primeras filas
    let salida = "Primeros movimientos:\n\n";

    json.slice(0, 10).forEach((row, i) => {
      salida += `${i + 1}. ${JSON.stringify(row)}\n`;
    });

    document.getElementById("output").textContent = salida;
  };

  reader.readAsArrayBuffer(file);
}
