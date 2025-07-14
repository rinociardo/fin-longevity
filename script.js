let depletionChart = null;
// script.js
// Dark mode toggle

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

// 🧮 Main Calculation Handler
function handleCalculation() {
  hideWarning();

  const dob = document.getElementById('dob').value;
  if (!isValidDOB(dob)) {
    showWarning("⚠️ Please enter a valid date of birth between 1905 and today.");
    return;
  }
  
  const age = calculateAgeFromDOB(dob);
  const savings = parseFloat(document.getElementById('savings').value) || 0;
  const spending = parseFloat(document.getElementById('spending').value) || 0;
  const inflationRate = parseFloat(document.getElementById('inflation').value) / 100;
  const colaRate = parseFloat(document.getElementById('cola').value) / 100;
  const pension1Monthly = parseFloat(document.getElementById('pension1').value) || 0;
  const pension2Monthly = parseFloat(document.getElementById('pension2').value) || 0;

  const lifeExpectancy = parseInt(document.getElementById('target-life').value);
  document.getElementById('target-life').dataset.selection = lifeExpectancy;
  let optimismLabel = '';
  if (lifeExpectancy === 82) optimismLabel = 'This represents an average life expectancy.';
  if (lifeExpectancy === 88) optimismLabel = 'Optimistic: planning beyond the average lifespan.';
  if (lifeExpectancy === 94) optimismLabel = 'Very optimistic: used for long-horizon projections.';
  const noteEl = document.getElementById('life-note');
  if (noteEl) {
    noteEl.textContent = optimismLabel;
  noteEl.dataset.show = 'true';
  }
  document.getElementById('life-note').textContent = optimismLabel;


  // 📆 Chart Data: Simple depletion over time
    

    const ageArray = [];
    const assetArray = [];

 
    let currentAssets = savings;

    for (let year = age; year <= lifeExpectancy; year++) {
        ageArray.push(year);

       const yearOffset = year - age;

        // Adjust spending for inflation
        const inflatedSpending = spending * Math.pow(1 + inflationRate, yearOffset);

         // 🪙 COLA-adjusted pensions
    const annualPension1 = pension1Monthly * 12 * Math.pow(1 + colaRate, yearOffset);
    const annualPension2 = pension2Monthly * 13 * Math.pow(1 + colaRate, yearOffset);

    const adjustedPension = annualPension1 + annualPension2;


        // Net expense
        const netSpending = inflatedSpending - adjustedPension;

        currentAssets -= Math.max(netSpending, 0); // no refunds :)
        assetArray.push(Math.max(currentAssets, 0));
    
        const yearsUntilDepletion = (netSpending > 0) ? savings / netSpending : 0;

// 🔢 Core calculations
const depletionAge = (age + yearsUntilDepletion).toFixed(1);
const finalAssets = assetArray[assetArray.length - 1]; // value at lifeExpectancy
const depleted = finalAssets <= 0;


// 🎯 Message logic with emoji and status
let resultMessage = '';
let emoji = '';
let color = '';

if (depleted) {
  // Outlive savings
  emoji = '🔴';
  color = '#c62828'; // red
  resultMessage = `${emoji} You’re ${age}, and if your life expectancy is ${lifeExpectancy}, your savings may run out by age ${depletionAge}. That’s a warning sign — time to revisit your spending plan.`;
} else if (Math.abs(depletionAge - lifeExpectancy) <= 1.5) {
  // Balanced plan
  emoji = '🟡';
  color = '#fbc02d'; // gold/yellow
  resultMessage = `${emoji} You’re ${age}, and your savings are projected to last until age ${depletionAge}, close to your target of ${lifeExpectancy}. Balanced plan — nicely calibrated!`;
} else {
  // Surplus savings
  emoji = '🟢';
  color = '#2e7d32'; // green
  resultMessage = `${emoji} You’re ${age}, and you're likely to have $${finalAssets.toLocaleString()} remaining at age ${lifeExpectancy}. You'll leave a solid legacy — or a generous cushion 😉.`;
}

// 🎨 Apply result text and color styling
const resultEl = document.getElementById('result');
resultEl.textContent = resultMessage;
resultEl.style.color = color;

    }


    // 🔁 If chart exists, destroy it before redrawing
    if (depletionChart && typeof depletionChart.destroy === 'function') {
        depletionChart.destroy();
        depletionChart = null;
    }


    // 🧱 Create new chart
    const ctx = document.getElementById('depletionChart').getContext('2d');


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
        plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
            label: ctx => `$${ctx.raw.toLocaleString()}`
            }
        }
        },
        scales: {
        x: {
            title: {
            display: true,
            text: 'Age'
            }
        },
        y: {
            title: {
            display: true,
            text: 'Remaining Assets ($)'
            },
            beginAtZero: true
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

    // 🖇️ Event Listeners for Inputs
    const inputs = document.querySelectorAll('input');
    const debouncedCalc = debounce(handleCalculation);

    inputs.forEach(input => {
    input.addEventListener('input', debouncedCalc);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
        handleCalculation();
        }
    });
    });
    window.addEventListener('DOMContentLoaded', () => {
    handleCalculation();
    });
    // document.getElementById('inflation').addEventListener('input', () => {
    //   const val = document.getElementById('inflation').value;
    //   document.getElementById('inflation-display').textContent = `${parseFloat(val).toFixed(1)}%`;
   // 👇 Inflation listener (near bottom of script.js)
const inflationSlider = document.getElementById('inflation');
const inflationDisplay = document.getElementById('inflation-display');
const debouncedInflationUpdate = longDebounce(() => {
  handleCalculation();
}, 1000);

document.getElementById('target-life').addEventListener('change', debouncedCalc);
document.getElementById('target-life').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleCalculation();
  }
});


inflationSlider.addEventListener('input', () => {
  const val = inflationSlider.value;
  inflationDisplay.textContent = `${parseFloat(val).toFixed(1)}%`;
  document.getElementById('cola').value = val;
  debouncedInflationUpdate();


  // Optionally sync COLA to inflation if user hasn’t changed it
  document.getElementById('cola').value = val;
  handleCalculation(); 

});
document.getElementById('cola').addEventListener('input', debouncedCalc);
document.getElementById('cola').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleCalculation();
  }
});

