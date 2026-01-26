// MVP Simulation Logic

// Default Constants (can be refined)
const PENSION_MONTHS = 12;
const DEFAULT_MONTHLY_FEE = 250000; // 250,000 JPY/month
const DEFAULT_INITIAL_FEE = 3000000; // 3,000,000 JPY initial

// State
let userData = {
    property: 0,
    age: 0,
    savings: 0,
    pension: 0,
    healthCost: 0,
    email: '',
    phone: '',
    detail: {}
};

// Navigation Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function goToSimpleResult() {
    // Validate inputs
    const inputs = ['input-property', 'input-age', 'input-savings', 'input-pension', 'input-health'];
    let valid = true;

    // Simple validation loop
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.parentElement.style.color = 'red'; // visual cue
            valid = false;
        } else {
            el.parentElement.style.color = '';
        }
    });

    if (!valid) {
        alert('すべての項目を選択してください');
        return;
    }

    // Capture Data
    userData.property = parseInt(document.getElementById('input-property').value);
    userData.age = parseInt(document.getElementById('input-age').value);
    userData.savings = parseInt(document.getElementById('input-savings').value);
    userData.pension = parseInt(document.getElementById('input-pension').value);
    userData.healthCost = parseInt(document.getElementById('input-health').value);

    // Calculate
    const result = calculateAssetLifespan(DEFAULT_MONTHLY_FEE, DEFAULT_INITIAL_FEE);

    // Render Results
    document.getElementById('simple-age-result').textContent = result.lifespan;
    document.getElementById('simple-years-left').textContent = result.yearsLeft;

    // Render Chart
    renderChart('simpleChart', result.chartData);

    showScreen('step-simple-result');
}

function goToBridge() {
    showScreen('step-bridge');
}

function goToFullResult() {
    // Validate Email
    const emailEl = document.getElementById('input-email');
    if (!emailEl.value) {
        alert('メールアドレスを入力してください');
        return;
    }

    // Capture Data
    userData.detail = {
        city: document.getElementById('input-city').value,
        landSize: document.getElementById('input-land-size').value,
        buildingAge: document.getElementById('input-building-age').value
    };
    userData.email = emailEl.value;
    userData.phone = document.getElementById('input-phone').value;

    // Simulate Calculation logic with new data
    const city = userData.detail.city;
    let adjustedMonthly = DEFAULT_MONTHLY_FEE;

    if (city === '港区') adjustedMonthly = 350000;
    if (city === '千代田区') adjustedMonthly = 380000;
    // others default

    const result = calculateAssetLifespan(adjustedMonthly, DEFAULT_INITIAL_FEE);

    document.getElementById('full-age-result').textContent = result.lifespan;

    renderChart('fullChart', result.chartData);

    // Show warning if refined lifespan is low
    const warningEl = document.getElementById('warning-zone');
    if (result.lifespan < 85) {
        warningEl.style.display = 'flex';
        warningEl.querySelector('p').innerHTML = `${result.lifespan}歳で資金が尽きる可能性があります。<br>対策を検討しましょう。`;
    } else {
        warningEl.style.display = 'none'; // Or show safe message
    }

    showScreen('step-full-result');
}

function calculateAssetLifespan(monthlyFee, initialFee) {
    let currentAssets = userData.savings + userData.property - initialFee;
    let currentAge = userData.age;

    const monthlyIncome = userData.pension;
    const monthlyExpense = monthlyFee + userData.healthCost;
    const annualDeficit = (monthlyExpense - monthlyIncome) * 12;

    // Simulation Points for Chart
    let chartData = [];
    let assets = currentAssets;

    // Push initial point
    chartData.push({ x: currentAge, y: assets });

    let lifespan = 100; // Cap
    let emptyAge = null;

    for (let age = currentAge + 1; age <= 100; age++) {
        assets -= annualDeficit;
        chartData.push({ x: age, y: assets });

        if (assets < 0 && emptyAge === null) {
            emptyAge = age;
        }
    }

    // Prepare return
    const finalLifespan = emptyAge ? emptyAge : 100; // If never empty, 100+
    const yearsLeft = finalLifespan - currentAge;

    return {
        lifespan: finalLifespan,
        yearsLeft: yearsLeft,
        chartData: chartData
    };
}

let currentChart = null;

function renderChart(canvasId, dataPoints) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy previous chart if exists on this canvas (not tracking instances strictly here for MVP simplicity, 
    // but Chart.js usually needs cleanup if reusing canvas. 
    // Actually, since we switch screens, simple replacement is okay, but let's be safe).
    // Note: In this simple script structure, I'm not storing chart instances by ID. 
    // If specific canvas is reused, it might overlay. 
    // Since screens are separate DOM elements, it's fine unless we go back/forth.
    // Let's just create new Chart every time. 

    // Extract labels and data
    const labels = dataPoints.map(p => p.x + '歳');
    const data = dataPoints.map(p => p.y);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '資産残高推移',
                data: data,
                borderColor: '#0066cc',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#f0f0f0'
                    },
                    ticks: {
                        callback: function (value) {
                            return value / 10000 + '万';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function openExternal(type) {
    if (type === 'assessment') {
        alert('不動産一括査定サイトへ遷移します（デモ）');
        // window.open('https://example.com/assessment', '_blank');
    } else if (type === 'consult') {
        alert('専門家相談フォームへ遷移します（デモ）');
        // window.location.href = 'consult.html';
    }
}
