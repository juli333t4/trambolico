function log(msg) {
  document.getElementById("log").textContent = msg;
}

// -------- UTIL --------

function leerExcel(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
    cb(json);
  };
  reader.readAsArrayBuffer(file);
}

function num(v) {
  return parseFloat(
    (v || "").toString().replace(/\./g, "").replace(",", ".")
  ) || 0;
}

function extraerCUIT(texto) {
  const m = (texto || "").match(/\d{11}/);
  return m ? m[0] : "";
}

// -------- CARGA EXTRACTO --------

document.getElementById("extractoFile").addEventListener("change", function () {
  leerExcel(this.files[0], data => {
    DB.extracto = data.map(r => ({
      fecha: r.Fecha || r.FECHA,
      importe: num(r.Importe || r.IMPORTE),
      saldo: num(r.Saldo || r.SALDO),
      titular: r.Titular || r.CONCEPTO || "",
      cuit: extraerCUIT(r.Titular || r.CONCEPTO),
      cliente: "",
      fecha_acred: ""
    }));
    saveDB();
    log("Extracto cargado");
  });
});

// -------- IMPORTAR UM --------

function importarUM() {
  const f = document.getElementById("umFile").files[0];
  if (!f) return alert("Subí UM");

  leerExcel(f, data => {
    let nuevos = data.map(r => ({
      fecha: r.Fecha || r.FECHA,
      importe: num(r.Importe || r.IMPORTE),
      saldo: num(r.Saldo || r.SALDO),
      titular: r.Concepto || "",
      cuit: extraerCUIT(r.Concepto || "")
    }));

    let ultimo = DB.extracto[0];

    let corte = nuevos.findIndex(n =>
      n.importe === ultimo.importe &&
      n.saldo === ultimo.saldo
    );

    if (corte === -1) {
      log("❌ Corte no encontrado");
      return;
    }

    let agregar = nuevos.slice(0, corte);
    DB.extracto = [...agregar, ...DB.extracto];

    saveDB();
    log(`✔ ${agregar.length} movimientos agregados`);
  });
}

// -------- CONCILIAR --------

function conciliar() {
  const f = document.getElementById("clienteFile").files[0];
  const cliente = document.getElementById("clienteNombre").value || "cliente";

  leerExcel(f, data => {

    let hoja1 = [];
    let hoja2 = [];

    let stats = { ok:0, duplicado:0, faltan:0, acreditado:0 };

    data.forEach(row => {

      let importe = num(row.Importe || row.IMPORTE);
      let cuit = extraerCUIT(row.CUIT || row.Titular || "");

      let matches = DB.extracto.filter(e =>
        e.importe === importe
      );

      if (matches.length === 0) {
        stats.faltan++;
        hoja1.push({ ...row, estado:"faltan datos" });
        return;
      }

      let match = matches.find(m => !m.cliente);

      if (!match) {
        stats.acreditado++;
        hoja1.push({ ...row, estado:"acreditado" });
        return;
      }

      match.cliente = cliente;
      match.fecha_acred = new Date().toLocaleDateString();

      stats.ok++;

      hoja1.push({ ...row, estado:"ok" });
      hoja2.push(match);
    });

    saveDB();

    window.RESULT = { hoja1, hoja2 };

    log(JSON.stringify(stats, null, 2));
  });
}

// -------- EXPORTAR --------

function exportar() {
  if (!window.RESULT) return alert("Primero conciliá");

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(window.RESULT.hoja1);
  const ws2 = XLSX.utils.json_to_sheet(window.RESULT.hoja2);

  XLSX.utils.book_append_sheet(wb, ws1, "Cliente");
  XLSX.utils.book_append_sheet(wb, ws2, "Extracto");

  XLSX.writeFile(wb, "conciliado.xlsx");
}
