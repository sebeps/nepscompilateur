// Lecture des fichiers CSV/Excel hors du fil principal (l'écran reste fluide, plusieurs fichiers en parallèle)
importScripts('vendor/xlsx.full.min.js');
self.onmessage = function (e) {
  var d = e.data;
  try {
    var wb = XLSX.read(d.buf, { type: 'array', codepage: 65001, raw: true, cellStyles: false, cellNF: false, cellHTML: false, cellText: false });
    var sheets = wb.SheetNames.map(function (n) {
      return XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' });
    });
    self.postMessage({ id: d.id, sheets: sheets });
  } catch (x) {
    self.postMessage({ id: d.id, error: String(x) });
  }
};
