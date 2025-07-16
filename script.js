// script.js
// Dark mode toggle

let depletionChart = null;
let allocationValid = true;
document.getElementById('darkToggle').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
});
// 🧠 Age Calculation from DOB
function calculateAgeFromDOB(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// 🔐 Validate DOB: must be in the past, not over 120 years
function isValidDOB(dobStr) {
  if (!dobStr) return false;

  const dob = new Date(dobStr);
  const today = new Date();

  if (dob > today) return false;

  const age = calculateAgeFromDOB(dobStr);
  if (age < 0 || age > 120) return false;

  return true;
}

function clearChartAndResult() {
  document.getElementById('result').textContent = '';
  const chartCanvas = document.getElementById('depletionChart');
  if (window.depletionChartInstance) {
    window.depletionChartInstance.destroy();
    window.depletionChartInstance = null;
  }
  chartCanvas.getContext('2d').clearRect(0, 0, chartCanvas.width, chartCanvas.height);
}

// Update validateAllocation to use the helper
function validateAllocation() {
  const spyInput = document.getElementById('spy-allocation');
  const cdsInput = document.getElementById('cds-allocation');
  const spy = parseInt(spyInput.value) || 0;
  const cds = parseInt(cdsInput.value) || 0;
  if (spy + cds !== 100) {
    showWarning('Allocation must total 100%.');
    allocationValid = false;
    clearChartAndResult();
    return false;
  }
  hideWarning();
  allocationValid = true;
  return true;
}

// ⚠️ Show and Hide Warnings
function showWarning(message) {
  const box = document.getElementById('warning-box');
  box.textContent = message;
  box.style.display = 'block';
}

function hideWarning() {
  const box = document.getElementById('warning-box');
  box.style.display = 'none';
}


function makeLifeLine(x, label, color, description) {
  return {
    type: 'line',
    xMin: x,
    xMax: x,
    xScaleID: 'x',
    borderColor: color,
    borderWidth: 2,
    borderDash: [6, 6],
    clip: false,
    label: {
      content: description || label,
      enabled: true,
      position: 'start',
      backgroundColor: 'rgba(255,255,255,0.9)',
      color: color,
      font: { weight: 'bold', size: 12 },
      padding: 6
    }
  };
}

function handleCalculation() {
  hideWarning();

  // ✅ Allocation must be valid
  if (!allocationValid) return;

  // 🧠 Get and validate DOB
  const dob = document.getElementById('dob').value;
  if (!isValidDOB(dob)) {
    showWarning("⚠️ Please enter a valid date of birth between 1905 and today.");
    return;
  }

  // 💰 Inputs
  const age = calculateAgeFromDOB(dob);
  const savings = parseFloat(document.getElementById('savings').value) || 0;
  const spending = parseFloat(document.getElementById('spending').value) || 0;
  const inflationRate = parseFloat(document.getElementById('inflation').value) / 100;
  const colaRate = parseFloat(document.getElementById('cola').value) / 100;
  const pension1Monthly = parseFloat(document.getElementById('pension1').value) || 0;
  const pension2Monthly = parseFloat(document.getElementById('pension2').value) || 0;
  const projectionYears = parseInt(document.getElementById('projection-years').value) || 30;

  // 📈 Life expectancy inputs
  const life50 = parseInt(document.getElementById('life-50').value) || 82;
  const life75 = parseInt(document.getElementById('life-75').value) || 88;
  const life90 = parseInt(document.getElementById('life-90').value) || 92;

  // 📊 Simulation arrays
  const ageArray = [];
  const assetArray = [];
  let currentAssets = savings;
  let depletionAge = null;

  for (let yearOffset = 0; yearOffset < projectionYears; yearOffset++) {
    const currentYear = age + yearOffset;
    ageArray.push(currentYear);

    const inflatedSpending = spending * Math.pow(1 + inflationRate, yearOffset);
    const annualPension1 = pension1Monthly * 12 * Math.pow(1 + colaRate, yearOffset);
    const annualPension2 = pension2Monthly * 13 * Math.pow(1 + colaRate, yearOffset);
    const adjustedPension = annualPension1 + annualPension2;
    const netSpending = inflatedSpending - adjustedPension;

    currentAssets -= Math.max(netSpending, 0);
    assetArray.push(Math.max(currentAssets, 0));

    if (currentAssets <= 0 && depletionAge === null) {
      depletionAge = currentYear;
    }
  }

  if (depletionAge === null) depletionAge = "Never";

  const finalAssets = assetArray[assetArray.length - 1];
  const depleted = finalAssets <= 0;

  // 🎯 Build result message
  let emoji, color, resultMessage;
  if (depleted) {
    emoji = '🔴';
    color = '#c62828';
    resultMessage = `${emoji} You’re ${age}, and your savings may run out by age ${depletionAge}.`;
  } else {
    emoji = '🟢';
    color = '#2e7d32';
    resultMessage = `${emoji} You’re ${age}, and you're likely to have $${finalAssets.toLocaleString()} remaining after ${projectionYears} years.`;
  }

  const resultEl = document.getElementById('result');
  resultEl.textContent = resultMessage;
  resultEl.style.color = color;

  // 🧹 Clear existing chart if needed
  if (depletionChart && typeof depletionChart.destroy === 'function') {
    depletionChart.destroy();
    depletionChart = null;
  }

  // 📐 Create new chart
  const ctx = document.getElementById('depletionChart').getContext('2d');
  Chart.register(window['chartjs-plugin-annotation']);

  depletionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ageArray,
      datasets: [{
        label: 'Remaining Assets ($)',
        data: assetArray,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      layout: {
        padding: { top: 40, bottom: 20 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.raw.toLocaleString()}`
          }
        },
        annotation: {
          annotations: {
            line50: makeLifeLine(life50, '50th', '#888', '50th percentile life expectancy'),
            line75: makeLifeLine(life75, '75th', '#f4b400', '75th percentile life expectancy'),
            line90: makeLifeLine(life90, '90th', '#e20b2bff', '90th percentile life expectancy')
          }
        }

      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Age' }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Remaining Assets ($)' }
        }
      }
    }
  });
}

  // ⌛ Debounce Helper
  function debounce(fn, delay = 400) {
  let timeout;
  return function () {
      clearTimeout(timeout);
      timeout = setTimeout(fn, delay);
  };
  }
  function longDebounce(fn, delay = 1000) {
  let timeout;
  return function () {
      clearTimeout(timeout);
      timeout = setTimeout(fn, delay);
  };
  }

  // 🖇️ Event Listeners for Inputs (excluding allocation)
const inputs = document.querySelectorAll('input:not(#spy-allocation):not(#cds-allocation)');
const debouncedCalc = debounce(() => {
  if (allocationValid) handleCalculation();
});

inputs.forEach(input => {
  input.addEventListener('input', debouncedCalc);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && allocationValid) {
      handleCalculation();
    }
  });
});

// Validate allocation and run calculation on blur or Enter key
function tryValidateAndCalculate() {
  if (validateAllocation()) {
    handleCalculation();
  }
}

// SPY Allocation
const spyInput = document.getElementById('spy-allocation');
spyInput.addEventListener('blur', tryValidateAndCalculate);
spyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    spyInput.blur(); // triggers blur event
  }
});

// CDs Allocation
const cdsInput = document.getElementById('cds-allocation');
cdsInput.addEventListener('blur', tryValidateAndCalculate);
cdsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    cdsInput.blur(); // triggers blur event
  }
});

// Prevent auto-calculation on allocation input change and clear stale data immediately
spyInput.addEventListener('input', () => {
  allocationValid = false;
  clearChartAndResult();
});
cdsInput.addEventListener('input', () => {
  allocationValid = false;
  clearChartAndResult();
});

// Inflation and COLA listeners
const inflationSlider = document.getElementById('inflation');
const inflationDisplay = document.getElementById('inflation-display');
const debouncedInflationUpdate = longDebounce(() => {
  if (allocationValid) handleCalculation();
}, 1000);

inflationSlider.addEventListener('input', () => {
  const val = inflationSlider.value;
  inflationDisplay.textContent = `${parseFloat(val).toFixed(1)}%`;
  colaSlider.value = val;
  colaDisplay.textContent = `${parseFloat(val).toFixed(1)}%`; // <-- Add this line
  debouncedInflationUpdate();
});

const colaSlider = document.getElementById('cola');
const colaDisplay = document.getElementById('cola-display');
colaSlider.addEventListener('input', () => {
  colaDisplay.textContent = `${parseFloat(colaSlider.value).toFixed(1)}%`;
  if (allocationValid) debouncedCalc();
});

// Projection Years slider
const projectionSlider = document.getElementById('projection-years');
const projectionDisplay = document.getElementById('projection-years-display');

projectionSlider.addEventListener('input', () => {
  projectionDisplay.textContent = projectionSlider.value;
  if (allocationValid) debouncedCalc();
});

// Initial calculation at startup
window.addEventListener('DOMContentLoaded', () => {
  allocationValid = validateAllocation();
  if (allocationValid) {
    handleCalculation();
  }
});


