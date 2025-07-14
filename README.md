# Financial Longevity Calculator


# 🧮 Retirement Simulator with Monte Carlo Market Modeling

This project is a browser-based financial simulator built to project retirement asset depletion based on user lifestyle, inflation, and life expectancy preferences. It supports both deterministic calculations and probabilistic forecasts using Monte Carlo simulation.

---

## 🚀 Goals

- Project whether the user will outlive their savings based on annual spending, age, inflation, and life expectancy.
- Visualize asset depletion across time with clear color-coded feedback.
- Incorporate realistic market volatility through 1000-run Monte Carlo simulation.
- Factor in tax-deferred account behavior, including required minimum withdrawals (RMDs) starting at age 73.

---

## 📊 Key Features So Far

- User inputs: age, annual spending, inflation rate, COLA, and target life expectancy.
- Selector-based life expectancy framing: average, optimistic, and very optimistic modes.
- Dynamic chart redraw with debounce smoothing and feedback.
- Realistic color-coded outcome messaging with emoji:
  - 🔴 Outlive savings
  - 🟡 Balanced spending
  - 🟢 Leave surplus

---

## 🧪 In Progress: Monte Carlo Modeling

**Planned Simulation Logic**:
- 1000 simulations of market returns across a blended portfolio:
  - 📈 60% Stocks — mean 7%, std dev 15%
  - 🏦 30% Bonds — mean 3.5%, std dev 6%
  - 💰 10% Short-term CDs — mean 1.5%, std dev 1%
- Each simulation:
  - Applies randomized return each year
  - Adjusts for inflation and withdrawals
  - Enforces RMDs from age 73 onward

**Chart Output**:
- Show 10th, 50th, and 90th percentile asset trajectories
- Compare against deterministic result curve
- Possibly include toggle to switch display modes

---

## 📁 File Structure

- `index.html` — UI and input elements
- `style.css` — Responsive dashboard styling and tooltip animations
- `script.js` — Core logic and simulation modeling

---

## 🔜 Next Steps / TODO

- [ ] Implement Monte Carlo simulation engine
- [ ] Compute percentile bands and format chart datasets
- [ ] Add toggle to switch between deterministic and probabilistic chart modes
- [ ] Refine messaging based on percentile confidence ranges
- [ ] Optional: Include early retirement or phased spending modules

---

## 💡 Design Philosophy

This project favors clarity, realism, and user empowerment. We combine strategic planning tools with fluid interface feedback and humorous touches — helping users visualize retirement feasibility without spreadsheets.

---
