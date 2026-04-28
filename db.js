let DB = JSON.parse(localStorage.getItem("db_conciliacion")) || {
  extracto: []
};

function saveDB() {
  localStorage.setItem("db_conciliacion", JSON.stringify(DB));
}
