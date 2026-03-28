const els = {
  amount: document.getElementById('amount'),
  cbRate: document.getElementById('cbRate'),
  euPct: document.getElementById('euPct'),
  myPct: document.getElementById('myPct'),
  outCurrency: document.getElementById('outCurrency'),
  outClientType: document.getElementById('outClientType'),
  outTotalPct: document.getElementById('outTotalPct'),
  outClientRate: document.getElementById('outClientRate'),
  outProfitFx: document.getElementById('outProfitFx'),
  outProfitRub: document.getElementById('outProfitRub'),
  out100k: document.getElementById('out100k'),
  out300k: document.getElementById('out300k'),
  out500k: document.getElementById('out500k'),
  copyShort: document.getElementById('copyShort'),
  copyFull: document.getElementById('copyFull'),
};

let currentCurrency = 'USD';
let currentClientType = 'Средний';

function parseNum(value){
  if (typeof value !== 'string') value = String(value ?? '');
  const cleaned = value.replace(',', '.').replace(/\s+/g,'').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function fmt(n, digits=2){
  return Number(n).toLocaleString('ru-RU', {minimumFractionDigits: digits, maximumFractionDigits: digits});
}

function calc(){
  const amount = parseNum(els.amount.value);
  const cbRate = parseNum(els.cbRate.value);
  const euPct = parseNum(els.euPct.value);
  const myPct = parseNum(els.myPct.value);

  const totalPct = euPct + myPct;
  const clientRate = cbRate * (1 + totalPct / 100);
  const profitFx = amount * (myPct / 100);
  const profitRub = profitFx * cbRate;

  els.outCurrency.textContent = currentCurrency;
  els.outClientType.textContent = currentClientType;
  els.outTotalPct.textContent = fmt(totalPct) + '%';
  els.outClientRate.textContent = fmt(clientRate);
  els.outProfitFx.textContent = fmt(profitFx);
  els.outProfitRub.textContent = fmt(profitRub);
  els.out100k.textContent = fmt(100000 * (myPct / 100));
  els.out300k.textContent = fmt(300000 * (myPct / 100));
  els.out500k.textContent = fmt(500000 * (myPct / 100));

  const shortText = `Курс: ${fmt(clientRate)} | Прибыль: ${fmt(profitFx)} ${currentCurrency} | Рубли: ${fmt(profitRub)}`;
  const fullText = [
    `Сумма: ${fmt(amount)}`,
    `Курс ЦБ: ${fmt(cbRate)}`,
    `% европейцев: ${fmt(euPct)}%`,
    `Твой %: ${fmt(myPct)}%`,
    `Валюта: ${currentCurrency}`,
    `Тип клиента: ${currentClientType}`,
    `Общий %: ${fmt(totalPct)}%`,
    `Курс клиенту: ${fmt(clientRate)}`,
    `Твоя прибыль в валюте: ${fmt(profitFx)} ${currentCurrency}`,
    `Твоя прибыль в рублях: ${fmt(profitRub)}`
  ].join('\n');

  els.copyShort.onclick = () => copyText(shortText, els.copyShort);
  els.copyFull.onclick = () => copyText(fullText, els.copyFull);
  saveState();
}

async function copyText(text, btn){
  try{
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = 'Скопировано';
    setTimeout(() => btn.textContent = old, 1200);
  } catch(e){
    alert(text);
  }
}

function setActive(containerId, button){
  document.querySelectorAll('#' + containerId + ' .chip').forEach(el => el.classList.remove('active'));
  button.classList.add('active');
}

document.querySelectorAll('#myPctChips .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    els.myPct.value = btn.dataset.pct;
    setActive('myPctChips', btn);
    calc();
  });
});

document.querySelectorAll('#clientTypeChips .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    els.myPct.value = btn.dataset.pct;
    currentClientType = btn.dataset.label;
    setActive('clientTypeChips', btn);
    calc();
  });
});

document.querySelectorAll('#currencyChips .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    currentCurrency = btn.dataset.currency;
    setActive('currencyChips', btn);
    calc();
  });
});

[els.amount, els.cbRate, els.euPct, els.myPct].forEach(input => input.addEventListener('input', calc));

function saveState(){
  const state = {
    amount: els.amount.value,
    cbRate: els.cbRate.value,
    euPct: els.euPct.value,
    myPct: els.myPct.value,
    currentCurrency,
    currentClientType
  };
  localStorage.setItem('marzhiAppState', JSON.stringify(state));
}

function loadState(){
  const raw = localStorage.getItem('marzhiAppState');
  if (!raw) return;
  try{
    const state = JSON.parse(raw);
    if (state.amount) els.amount.value = state.amount;
    if (state.cbRate) els.cbRate.value = state.cbRate;
    if (state.euPct) els.euPct.value = state.euPct;
    if (state.myPct) els.myPct.value = state.myPct;
    if (state.currentCurrency) {
      currentCurrency = state.currentCurrency;
      const btn = document.querySelector('#currencyChips .chip[data-currency="' + state.currentCurrency + '"]');
      if (btn) setActive('currencyChips', btn);
    }
    if (state.currentClientType) {
      currentClientType = state.currentClientType;
      const btn = [...document.querySelectorAll('#clientTypeChips .chip')].find(b => b.dataset.label === currentClientType);
      if (btn) setActive('clientTypeChips', btn);
    }
  } catch(e){}
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

loadState();
calc();
