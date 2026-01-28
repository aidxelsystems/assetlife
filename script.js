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
    // Validate inputs (Updated Order)
    const inputs = ['input-age', 'input-health', 'input-pension', 'input-savings', 'input-property'];
    let valid = true;

    // Simple validation loop
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.parentElement.style.color = '#d63031'; // visual cue (red)
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
    userData.age = parseInt(document.getElementById('input-age').value);
    userData.healthCost = parseInt(document.getElementById('input-health').value);
    userData.pension = parseInt(document.getElementById('input-pension').value);
    userData.savings = parseInt(document.getElementById('input-savings').value);
    userData.property = parseInt(document.getElementById('input-property').value);

    // Calculate
    const result = calculateAssetLifespan(DEFAULT_MONTHLY_FEE, DEFAULT_INITIAL_FEE);

    // Render Results
    document.getElementById('simple-age-result').textContent = result.lifespan;
    document.getElementById('simple-years-left').textContent = result.yearsLeft;

    // Render Chart
    renderChart('simpleChart', result.chartData, result.dangerIndex);

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
    const phoneEl = document.getElementById('input-phone');
    userData.phone = phoneEl ? phoneEl.value : '';

    // Simulate Calculation logic with new data
    const city = userData.detail.city;
    let adjustedMonthly = DEFAULT_MONTHLY_FEE;

    if (city === '港区') adjustedMonthly = 350000;
    if (city === '千代田区') adjustedMonthly = 380000;
    // others default

    const result = calculateAssetLifespan(adjustedMonthly, DEFAULT_INITIAL_FEE);

    document.getElementById('full-age-result').textContent = result.lifespan;

    renderChart('fullChart', result.chartData, result.dangerIndex);

    // Show warning if refined lifespan is low
    // Show warning if refined lifespan is low
    const warningEl = document.getElementById('warning-zone');
    if (warningEl) {
        if (result.lifespan < 100) {
            warningEl.style.display = 'flex';
            warningEl.querySelector('p').innerHTML = `${result.lifespan}歳で資金が底をつく計算です。<br>対策を検討しましょう。`;
        } else {
            warningEl.style.display = 'none';
        }
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
    let dangerIndex = -1; // Index where assets go below zero

    for (let age = currentAge + 1; age <= 100; age++) {
        assets -= annualDeficit;
        chartData.push({ x: age, y: assets });

        if (assets < 0 && emptyAge === null) {
            emptyAge = age;
            dangerIndex = chartData.length - 1; // Current index
        }
    }

    // Prepare return
    const finalLifespan = emptyAge ? emptyAge : 100; // If never empty, 100+
    const yearsLeft = finalLifespan - currentAge;

    return {
        lifespan: finalLifespan,
        yearsLeft: yearsLeft,
        chartData: chartData,
        dangerIndex: dangerIndex
    };
}

let currentChart = null; // Tracking to destroy properly if needed, though simple replacement works

function renderChart(canvasId, dataPoints, dangerIndex) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart on this canvas if it exists
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    // Prepare visual properties
    const labels = dataPoints.map(p => p.x + '歳');
    const data = dataPoints.map(p => p.y);

    // Point Styles (Highlight start and danger point)
    const pointRadiuses = dataPoints.map((_, i) => {
        if (i === 0) return 6; // Start (Current Age)
        if (i === dangerIndex) return 6; // Danger Point
        return 0; // Hide others
    });

    const pointBackgroundColors = dataPoints.map((_, i) => {
        if (i === 0) return '#0066cc';
        if (i === dangerIndex) return '#ff4d4d';
        return 'transparent';
    });

    // Chart.js Configuration
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '資産残高推移',
                data: data,
                borderColor: '#0066cc', // Default color, overridden by segment
                backgroundColor: 'rgba(0, 102, 204, 0.1)', // Default fill
                fill: true,
                tension: 0.4,
                pointRadius: pointRadiuses,
                pointBackgroundColor: pointBackgroundColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                // Segment styling for danger zone (v3+)
                segment: {
                    borderColor: ctx => ctx.p0.parsed.y < 0 || ctx.p1.parsed.y < 0 ? '#ff4d4d' : '#0066cc',
                    backgroundColor: ctx => ctx.p0.parsed.y < 0 || ctx.p1.parsed.y < 0 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 102, 204, 0.1)'
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30 // Make space for the bubble
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
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
                    grid: { color: '#f0f0f0' },
                    ticks: {
                        callback: function (value) { return value / 10000 + '万'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10
                    }
                }
            }
        },
        plugins: [{
            id: 'customAnnotations',
            afterDraw: (chart) => {
                const { ctx, scales: { x, y } } = chart;
                const dataset = chart.data.datasets[0];
                const meta = chart.getDatasetMeta(0);

                // Helper to draw text with background
                const drawBubble = (text, index, color, isDanger = false) => {
                    const xPos = meta.data[index].x;
                    const yPos = meta.data[index].y;

                    ctx.save();
                    ctx.font = 'bold 12px sans-serif';
                    const textWidth = ctx.measureText(text).width;
                    const padding = 6;

                    // Bubble Background
                    ctx.fillStyle = color;
                    if (isDanger) {
                        // Line down to axis
                        ctx.beginPath();
                        ctx.moveTo(xPos, yPos);
                        ctx.lineTo(xPos, y.bottom);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1;
                        ctx.setLineDash([4, 4]);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Bubble Position (Below or Above based on y)
                        // For danger point (y < 0 usually), draw bubble slightly above crossing point if possible
                        // But simplification: Draw at point
                    }

                    const bubbleY = yPos - 35;

                    // Draw Rounded Rect Bubble
                    ctx.beginPath();
                    ctx.roundRect(xPos - (textWidth / 2) - padding, bubbleY, textWidth + padding * 2, 24, 4);
                    ctx.fill();

                    // Triangle pointer
                    ctx.beginPath();
                    ctx.moveTo(xPos, bubbleY + 24);
                    ctx.lineTo(xPos - 5, bubbleY + 24);
                    ctx.lineTo(xPos, bubbleY + 29);
                    ctx.lineTo(xPos + 5, bubbleY + 24);
                    ctx.fill();

                    // Text
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, xPos, bubbleY + 12);
                    ctx.restore();
                };

                // 1. Current Age Bubble (Index 0)
                drawBubble('今ここ！', 0, '#0066cc');

                // 2. Danger Point Bubble
                if (dangerIndex !== -1 && dangerIndex < dataset.data.length) {
                    const dangerAge = dataPoints[dangerIndex].x;
                    drawBubble(dangerAge + '歳', dangerIndex, '#d63031', true);
                }
            }
        }]
    });
}

// Action Selection & Final Steps
let currentRoute = ''; // 'A', 'B', 'C'

function selectAction(type) {
    currentRoute = type;

    // Set up the AB form base on type
    if (type === 'A' || type === 'B') {
        const titleEl = document.getElementById('final-confirm-title');
        const btnTextEl = document.getElementById('btn-text-ab');
        const noteBEl = document.getElementById('b-route-note');

        // Prefill City
        document.getElementById('prefilled-city').textContent = (userData.detail.city || '--区');

        if (type === 'A') {
            titleEl.textContent = '最終確認（専門家連携）';
            btnTextEl.textContent = 'この進め方で確認を依頼する';
            noteBEl.style.display = 'none';
        } else {
            titleEl.textContent = '最終確認（一括比較）';
            btnTextEl.textContent = '比較前提で確認を進める';
            noteBEl.style.display = 'block';
        }
        showScreen('step-final-confirm-ab');
    } else if (type === 'C') {
        console.log('Route C selected');
        // Prefill City C
        const prefillEl = document.getElementById('prefilled-city-c');
        if (prefillEl) {
            prefillEl.textContent = (userData.detail && userData.detail.city) ? userData.detail.city : '--区';
        } else {
            console.warn('Element prefilled-city-c not found');
        }
        showScreen('step-final-confirm-c');
    }
}

function submitFinalAB() {
    // Validation
    const checkboxes = document.querySelectorAll('#form-confirm-ab input[name="service"]:checked');
    if (checkboxes.length === 0) {
        alert('確認したい実務を1つ以上選択してください');
        return;
    }

    const addressDetail = document.getElementById('input-address-detail').value;
    if (!addressDetail) {
        alert('番地・マンション名を入力してください');
        return;
    }

    const phone = document.getElementById('input-phone-ab').value;
    if (!phone) {
        alert('電話番号を入力してください');
        return;
    }

    // Capture Data (Mock)
    const data = {
        route: currentRoute,
        services: Array.from(checkboxes).map(c => c.value),
        contactTime: document.getElementById('input-contact-time').value,
        urgency: document.getElementById('input-urgency').value,
        address: (userData.detail.city || '') + addressDetail,
        phone: phone,
        remarks: document.getElementById('input-remarks').value
    };

    console.log('Sending AB Data:', data);

    // Success Message Logic
    let msg1 = '数日～１週間以内に担当から直接連絡があります。';
    let msg2 = 'この結果ページは保存されています。判断に迷ったら、いつでも見返せます。';

    if (currentRoute === 'B') {
        msg1 = '複数社から直接連絡が入る可能性があります。';
    }

    showComplete(msg1, msg2);
}

function submitFinalC() {
    const radio = document.querySelector('#form-confirm-c input[name="service_single"]:checked');
    if (!radio) {
        alert('確認したい内容を1つ選んでください');
        return;
    }

    const addressDetail = document.getElementById('input-address-detail-c').value;
    if (!addressDetail) {
        alert('番地・マンション名を入力してください');
        return;
    }

    // Phone is optional for C unless specific condition, but spec says "If specific consultation needed..."
    // For now we just capture if present.

    // Capture Data (Mock)
    const data = {
        route: 'C',
        service: radio.value,
        address: (userData.detail.city || '') + addressDetail,
        phone: document.getElementById('input-phone-c').value
    };

    console.log('Sending C Data:', data);

    // C Route specific message or simple one? Spec seems to imply standard "Done".
    // "Button content variable" -> Handled by backend later.
    const msg1 = 'ご入力ありがとうございました。';
    const msg2 = '選択された内容について確認を進めます。';

    showComplete(msg1, msg2);
}

function showComplete(msg1, msg2) {
    document.getElementById('complete-msg-1').textContent = msg1;
    document.getElementById('complete-msg-2').innerHTML = msg2 + '<br>また条件の整理し直しも可能です。';

    showScreen('step-complete');

    // Scroll to top
    window.scrollTo(0, 0);
}

function openExternal(type) {
    if (type === 'assessment') {
        alert('不動産一括査定サイトへ遷移します（デモ）');
    } else if (type === 'consult') {
        alert('専門家相談フォームへ遷移します（デモ）');
    }
}

// Modal Logic
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
        document.body.style.overflow = '';
    }
}
