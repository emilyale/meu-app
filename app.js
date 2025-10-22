
const CURRENCY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
let baseData = null;
let data = null;
let curKey = null;

async function load() {
  const cached = localStorage.getItem('controle_financeiro_le');
  const resp = await fetch('data.json');
  baseData = await resp.json();
  if (cached) {
    try {
      data = JSON.parse(cached);
    } catch(e) {}
  }
  if (!data) data = JSON.parse(JSON.stringify(baseData));

  const sel = document.getElementById('monthSelect');
  const keys = Object.keys(data.months).sort();
  sel.innerHTML = keys.map(k => `<option value="${k}">${data.months[k].label}</option>`).join('');
  curKey = keys[0];
  sel.value = curKey;
  sel.addEventListener('change', () => { curKey = sel.value; render(); });
  document.getElementById('saveBtn').addEventListener('click', save);
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importJSON);

  document.getElementById('addEntradaBtn').addEventListener('click', addEntrada);
  document.getElementById('addDespesaBtn').addEventListener('click', addDespesa);
  document.getElementById('resetMonthBtn').addEventListener('click', resetMonth);
  render();
}

function save() {
  localStorage.setItem('controle_financeiro_le', JSON.stringify(data));
  alert('Salvo no aparelho!');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'controle_financeiro_le.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      if (obj && obj.months) {
        data = obj;
        save();
        render();
      } else {
        alert('Arquivo inválido.');
      }
    } catch(err) {
      alert('Erro ao importar.');
    }
  };
  reader.readAsText(file);
}

function render() {
  const month = data.months[curKey];
  // Entradas
  const entradasList = document.getElementById('entradasList');
  entradasList.innerHTML = '';
  (month.entradas || []).forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'grid';
    row.innerHTML = `
      <input type="text" value="${it.fonte || ''}" data-i="${idx}" data-f="fonte">
      <input type="number" step="0.01" value="${it.valor || 0}" data-i="${idx}" data-f="valor">
      <button data-act="delEntrada" data-i="${idx}">Excluir</button>
      <span></span>
    `;
    entradasList.appendChild(row);
  });
  entradasList.addEventListener('input', onEntradaChange);
  entradasList.addEventListener('click', onEntradaClick);

  // Despesas
  const despesasList = document.getElementById('despesasList');
  despesasList.innerHTML = '';
  (month.despesas || []).forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'grid';
    row.innerHTML = `
      <input type="text" value="${it.categoria || ''}" data-i="${idx}" data-f="categoria">
      <input type="number" step="0.01" value="${it.valor || 0}" data-i="${idx}" data-f="valor">
      <input type="text" value="${it.situacao || ''}" data-i="${idx}" data-f="situacao">
      <button data-act="delDespesa" data-i="${idx}">Excluir</button>
    `;
    despesasList.appendChild(row);
  });
  despesasList.addEventListener('input', onDespesaChange);
  despesasList.addEventListener('click', onDespesaClick);

  // Totais
  const sumE = (month.entradas || []).reduce((s, x) => s + (parseFloat(x.valor) || 0), 0);
  const sumD = (month.despesas || []).reduce((s, x) => s + (parseFloat(x.valor) || 0), 0);
  month.total_entradas = sumE;
  month.total_despesas = sumD;
  month.saldo = sumE - sumD;
  document.getElementById('sumEntradas').textContent = CURRENCY.format(sumE);
  document.getElementById('sumDespesas').textContent = CURRENCY.format(sumD);
  document.getElementById('saldo').textContent = CURRENCY.format(sumE - sumD);
}

function onEntradaChange(e) {
  const i = e.target.getAttribute('data-i');
  const f = e.target.getAttribute('data-f');
  if (i == null || !f) return;
  const month = data.months[curKey];
  let v = e.target.value;
  if (f === 'valor') v = parseFloat(v || '0');
  month.entradas[i][f] = v;
  render();
}

function onEntradaClick(e) {
  if (e.target.getAttribute('data-act') === 'delEntrada') {
    const i = parseInt(e.target.getAttribute('data-i'));
    const month = data.months[curKey];
    month.entradas.splice(i,1);
    render();
  }
}

function onDespesaChange(e) {
  const i = e.target.getAttribute('data-i');
  const f = e.target.getAttribute('data-f');
  if (i == null || !f) return;
  const month = data.months[curKey];
  let v = e.target.value;
  if (f === 'valor') v = parseFloat(v || '0');
  month.despesas[i][f] = v;
  render();
}

function onDespesaClick(e) {
  if (e.target.getAttribute('data-act') === 'delDespesa') {
    const i = parseInt(e.target.getAttribute('data-i'));
    const month = data.months[curKey];
    month.despesas.splice(i,1);
    render();
  }
}

function addEntrada() {
  const fonte = document.getElementById('newEntradaFonte').value.trim();
  const valor = parseFloat(document.getElementById('newEntradaValor').value || '0');
  if (!fonte) return;
  data.months[curKey].entradas = data.months[curKey].entradas || [];
  data.months[curKey].entradas.push({fonte, valor});
  document.getElementById('newEntradaFonte').value = '';
  document.getElementById('newEntradaValor').value = '';
  render();
}

function addDespesa() {
  const cat = document.getElementById('newDespesaCat').value.trim();
  const valor = parseFloat(document.getElementById('newDespesaValor').value || '0');
  const sit = document.getElementById('newDespesaSit').value.trim();
  if (!cat) return;
  data.months[curKey].despesas = data.months[curKey].despesas || [];
  data.months[curKey].despesas.push({categoria: cat, valor, situacao: sit, obs: ''});
  document.getElementById('newDespesaCat').value = '';
  document.getElementById('newDespesaValor').value = '';
  document.getElementById('newDespesaSit').value = '';
  render();
}

function resetMonth() {
  if (!confirm('Voltar os dados deste mês para o padrão do arquivo?')) return;
  const original = baseData.months[curKey];
  data.months[curKey] = JSON.parse(JSON.stringify(original));
  render();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}

load();
