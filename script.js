// script.js
// Dark mode toggle

let depletionChart = null;
let spendingChart = null;

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

// 📅 RMD Divisors Table up to 120
// Source: https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-tax-on-early-distributions
const rmdDivisors = {
  73: 27.4,
  74: 26.5,
  75: 25.6,
  76: 24.7,
  77: 23.8,
  78: 22.9,
  79: 22.0,
  80: 21.1,
  81: 20.2,
  82: 19.3,
  83: 18.4,
  84: 17.5,
  85: 16.6,
  86: 15.7,
  87: 14.8,
  88: 13.9,
  89: 13.0,
  90: 12.1,
  91: 11.2,
  92: 10.3,
  93: 9.5,
  94: 8.6,
  95: 7.8,
  96: 7.1,
  97: 6.5,
  98: 5.9,
  99: 5.4,
  100: 5.0,
  101: 4.5,
  102: 4.1,
  103: 3.8,
  104: 3.5,
  105: 3.2,
  106: 3.0, 107: 2.8, 108: 2.6, 109: 2.4, 110: 2.2,
  111: 2.0, 112: 1.9, 113: 1.8, 114: 1.7, 115: 1.6,
  116: 1.5, 117: 1.4, 118: 1.3, 119: 1.2, 120: 1.1
  // Note: IRS tables only go up to 120, but we can extend logically, if needed
};

function getRMD(currentAge, accountBalance) {
  const divisor = rmdDivisors[currentAge];
  if (!divisor) return 0; // No RMD required before 73 or if age not in table
  return accountBalance / divisor;
}
// 🧮 Handle Calculation
function handleCalculation() {
  hideWarning();
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
  const spyAllocation = parseFloat(document.getElementById('spy-allocation').value) / 100;
  const cdsAllocation = parseFloat(document.getElementById('cds-allocation').value) / 100;

  // 📈 Life expectancy inputs
  const life50 = parseInt(document.getElementById('life-50').value) || 82;
  const life75 = parseInt(document.getElementById('life-75').value) || 88;
  const life90 = parseInt(document.getElementById('life-90').value) || 92;

  const allocation = {
    stocks: spyAllocation,
    bonds: cdsAllocation
  };

  const marketAssumptions = {
    stocks: { mean: 0.07, stdev: 0.15 },
    bonds: { mean: 0.03, stdev: 0.05 }
  };

  const showRealDollars = document.getElementById('realDollarToggle').checked;
  

  // 📊 Run Monte Carlo simulation
  const {
  results,
  rmdArray,
  taxArray,
  spendingArray,
  pensionArray
} = simulateMonteCarlo({
  savings,
  allocation,
  marketAssumptions,
  projectionYears,
  numPaths: 1000,
  spending,
  pension1Monthly,
  pension2Monthly,
  inflationRate,
  colaRate,
  age,
  showRealDollars
});

  const percentileData = getPercentilesAtEachYear(results, projectionYears, [10, 50, 90]);
  // 🎯 Messaging
  const finalAssets = percentileData[projectionYears - 1].p50;
  const depleted = finalAssets <= 0;
  const ageArray = Array.from({ length: projectionYears }, (_, i) => age + i);

  let emoji, color, resultMessage;
  if (depleted) {
    emoji = '🔴';
    color = '#c62828';
    resultMessage = `${emoji} You’re ${age}, and your savings may run out before year ${age + projectionYears}.`;
  } else {
    emoji = '🟢';
    color = '#2e7d32';
    resultMessage = `${emoji} You’re ${age}, and you're likely to have $${finalAssets.toLocaleString()} remaining after ${projectionYears} years.`;
  }

  const resultEl = document.getElementById('result');
  resultEl.textContent = resultMessage;
  resultEl.style.color = color;

  // 🧹 Destroy old chart if needed
  if (depletionChart && typeof depletionChart.destroy === 'function') {
    depletionChart.destroy();
    depletionChart = null;
  }

  // 📐 Render new chart
  const ctx = document.getElementById('depletionChart').getContext('2d');
  Chart.register(window['chartjs-plugin-annotation']);

  depletionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ageArray,
      datasets: [
    {
      label: '10th Percentile',
      data: percentileData.map(p => p.p10),
      borderColor: '#c62828',
      borderWidth: 1,
      borderDash: [4, 4],
      fill: false, // base of the band
      pointRadius: 0,
      tension: 0.25
    },
    {
      label: '90th Percentile',
      data: percentileData.map(p => p.p90),
      borderColor: '#f4b400',
      borderWidth: 1,
      borderDash: [4, 4],
      backgroundColor: 'rgba(244, 180, 0, 0.15)', // subtle fill between lines
      fill: '-1', // fill down to previous dataset (10th)
      pointRadius: 0,
      tension: 0.25
    },
    {
      label: 'Median Outcome',
      data: percentileData.map(p => p.p50),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46,125,50,0.2)',
      borderWidth: 2,
      fill: false, // no extra fill here
      pointRadius: 0,
      tension: 0.25
    }
  ],
    },
    options: {
      responsive: true,
      layout: {
        padding: { top: 40, bottom: 20 }
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.raw.toLocaleString()}`
          }
        },
        annotation: {
          annotations: {
            line50: makeLifeLine(life50, '50th', '#00f418ff', '50th percentile life expectancy'),
            line75: makeLifeLine(life75, '75th', '#e3ee09ff', '75% chance to live this long'),
            line90: makeLifeLine(life90, '90th', '#e20b2bff', '90th percentile longevity')
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
  // Render the second chart

//  Destroy old chart if needed
  if (spendingChart && typeof spendingChart.destroy === 'function') {
    spendingChart.destroy();
    spendingChart = null;
  }

  // 📐 Render new chart
  
  const ctx2 = document.getElementById('spendingChart').getContext('2d');
  Chart.register(window['chartjs-plugin-annotation']);
  spendingChart = new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: ageArray,
    datasets: [
      {
        label: 'After-Tax Spending',
        data: spendingArray,
        backgroundColor: '#4caf50'
      },
      {
        label: 'Taxes on IRA Withdrawals',
        data: taxArray,
        backgroundColor: '#e53935'
      },
      {
        label: 'Pension Income',
        data: pensionArray,
        backgroundColor: '#1e88e5'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: ctx => `$${ctx.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Age' }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: 'Annual Amount ($)' }
      }
    }
  }
});

}
function simulateMonteCarlo({
  savings,
  allocation,
  marketAssumptions,
  projectionYears,
  numPaths,
  spending,
  pension1Monthly,
  pension2Monthly,
  inflationRate,
  colaRate,
  age,
  showRealDollars
}) {
  const results = [];
  const rmdArray = [];
  const taxArray = [];
  const spendingArray = [];
  const pensionArray = [];

  for (let sim = 0; sim < numPaths; sim++) {
    let assets = savings;
    let path = [];

    for (let year = 0; year < projectionYears; year++) {
      // Simulate independent returns for each asset class
      const stockR = getRandomReturn(marketAssumptions.stocks.mean, marketAssumptions.stocks.stdev);
      const bondR = getRandomReturn(marketAssumptions.bonds.mean, marketAssumptions.bonds.stdev);

      const stockValue = assets * allocation.stocks * (1 + stockR);
      const bondValue = assets * allocation.bonds * (1 + bondR);
      assets = stockValue + bondValue;

      // Adjust spending and pensions
      const inflatedSpending = spending * Math.pow(1 + inflationRate, year);
      const pension1 = pension1Monthly * 12 * Math.pow(1 + colaRate, year);
      const pension2 = pension2Monthly * 13 * Math.pow(1 + colaRate, year);
      const adjustedPension = pension1 + pension2;
      const netSpending = inflatedSpending - adjustedPension;

      // RMD logic and tax calculation
      const currentAge = age + year;
      const rmd = getRMD(currentAge, assets);
      const preTaxWithdrawal = Math.max(netSpending, rmd);
      const taxAmount = preTaxWithdrawal * 0.15;
      const afterTaxSpending = preTaxWithdrawal - taxAmount;

      // Apply withdrawal
      assets -= preTaxWithdrawal;
      path.push(Math.max(assets, 0));

      // Adjust for real dollars if needed
      const inflationFactor = Math.pow(1 + inflationRate, year);
      const divisor = showRealDollars ? inflationFactor : 1;

      const realSpending = afterTaxSpending / divisor;
      const realTax = taxAmount / divisor;
      const realPension = adjustedPension / divisor;
      const realRMD = rmd / divisor;

      // Track annual components (1st simulation only—for chart)
      if (sim === 0) {
        rmdArray.push(realRMD);
        taxArray.push(realTax);
        spendingArray.push(realSpending);
        pensionArray.push(realPension);
      }
    }

    results.push(path);
  }

  return {
    results,
    rmdArray,
    taxArray,
    spendingArray,
    pensionArray
  };
}
function getRandomReturn(mean, stdev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}
// extract percentiles at each year
function getPercentilesAtEachYear(simResults, projectionYears, percentiles = [10, 50, 90]) {
  const output = [];

  for (let year = 0; year < projectionYears; year++) {
    const yearValues = simResults.map(path => path[year]).sort((a, b) => a - b);
    const row = {};
    percentiles.forEach(p => {
      const index = Math.floor((p / 100) * yearValues.length);
      row[`p${p}`] = yearValues[index];
    });
    output.push(row);
  }

  return output;
}
// helper to simulate a random return from a normal distribution
function randomNormal(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

// 🧩 Helper to show warning and clear chart
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

document.getElementById('realDollarToggle').addEventListener('change', () => {
  handleCalculation(); // Re-run with new setting
});
