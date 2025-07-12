// script.js
// Dark mode toggle
document.getElementById('darkToggle').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
});

document.getElementById('input-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const age = parseFloat(document.getElementById('age').value);
  const life = parseFloat(document.getElementById('life').value);
  const assets = parseFloat(document.getElementById('assets').value);
  const spending = parseFloat(document.getElementById('spending').value);

  const years = Math.ceil(life - age);
  const data = [];
  let balance = assets;

  for (let i = 0; i <= years; i++) {
    data.push({ year: i, age: age + i, balance: balance });
    balance -= spending;
  }

  const labels = data.map(d => `Age ${d.age.toFixed(1)}`);
  const balances = data.map(d => d.balance);

  new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Asset Balance Over Time',
        data: balances,
        borderColor: 'teal',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
});