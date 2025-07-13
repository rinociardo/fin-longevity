let depletionChart = null;
// script.js
// Dark mode toggle
console.log("Dark mode toggle initialized");
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

  const yearsUntilDepletion = (spending > 0) ? savings / spending : 0;

  document.getElementById('result').textContent =
    `At age ${age}, your savings may last approximately ${yearsUntilDepletion.toFixed(1)} years.`;

    // Optional: update your chart or visualization here
  // 📆 Chart Data: Simple depletion over time
const lifeExpectancy = parseInt(document.getElementById('life').value) || 88;
const ageArray = [];
const assetArray = [];

let depletionChart = null;
let currentAssets = savings;

for (let year = age; year <= lifeExpectancy; year++) {
  ageArray.push(year);
  assetArray.push(Math.max(currentAssets, 0));
  currentAssets -= spending;
}

// 🔁 If chart exists, destroy it before redrawing
if (depletionChart) {
  depletionChart.destroy();
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
