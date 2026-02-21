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

function toggleDetails() {
    const content = document.getElementById('details-collapse');
    const icon = document.getElementById('toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-caret-right');
        icon.classList.add('fa-caret-down');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-right');
    }
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
                    borderColor: ctx => {
                        if (!ctx.p1 || !ctx.p1.parsed) return '#0066cc';
                        const val = ctx.p1.parsed.y;
                        const idx = ctx.p1.parsed.x;
                        const dIdx = (dangerIndex !== -1) ? dangerIndex : (dataPoints.length - 1);

                        if (val < 0) return '#ff4d4d'; // Red (Broken)
                        if (idx >= dIdx - 10) return '#f1c40f'; // Yellow (Warning 10 years prior)
                        return '#0066cc'; // Blue (Safe)
                    },
                    backgroundColor: ctx => {
                        if (!ctx.p1 || !ctx.p1.parsed) return 'rgba(0, 102, 204, 0.1)';
                        const val = ctx.p1.parsed.y;
                        const idx = ctx.p1.parsed.x;
                        const dIdx = (dangerIndex !== -1) ? dangerIndex : (dataPoints.length - 1);

                        if (val < 0) return 'rgba(255, 77, 77, 0.1)';
                        if (idx >= dIdx - 10) return 'rgba(241, 196, 15, 0.1)';
                        return 'rgba(0, 102, 204, 0.1)';
                    }
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
        showScreen('step-final-confirm-c');
    }
}

async function submitFinalAB() {
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

    // Capture Data
    const data = {
        // Basic Info from Step 1
        age: userData.age,
        healthInfo: userData.healthCost, // Sending cost as proxy for status for now
        pension: userData.pension,
        savings: userData.savings,
        propertyValue: userData.property,

        // Detailed Info from Bridge
        city: userData.detail.city,
        landSize: userData.detail.landSize,
        buildingAge: userData.detail.buildingAge,
        email: userData.email,

        // Final Lead Info from Step 5
        phone: phone,
        addressDetail: addressDetail,
        route: currentRoute,
        services: Array.from(checkboxes).map(c => c.value),
        contactTime: document.getElementById('input-contact-time').value,
        urgency: document.getElementById('input-urgency').value,
        remarks: document.getElementById('input-remarks').value
    };

    console.log('Sending AB Data:', data);

    try {
        const response = await fetch('/api/leads', { // Using correct endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const responseData = await response.json(); // Get Token
            // Save the token to local storage for the hidden mail feature
            localStorage.setItem('last_generated_token', responseData.token);

            // Show the normal complete screen to the user
            showComplete(
                '専門家連携の準備が整いました。',
                'ご入力いただいた情報をもとに連携を進めます。'
            );
        } else {
            alert('送信に失敗しました。時間をおいて再度お試しください。');
        }
    } catch (error) {
        console.error('Error submitting AB data:', error);
        alert('通信エラーが発生しました。再度お試しください。');
    }
}

function submitFinalC() {
    const radio = document.querySelector('#form-confirm-c input[name="service_single"]:checked');
    if (!radio) {
        alert('確認したい内容を1つ選んでください');
        return;
    }

    // Direct External Link Logic for Route C
    // Based on selection, open relevant external site in new tab
    let externalUrl = '';
    switch (radio.value) {
        case 'realestate':
            externalUrl = 'https://example.com/realestate-assessment'; // Placeholder
            break;
        case 'nursing':
            externalUrl = 'https://example.com/nursing-home-search'; // Placeholder
            break;
        case 'buyback':
            externalUrl = 'https://example.com/buyback-assessment'; // Placeholder
            break;
        case 'car':
            externalUrl = 'https://example.com/car-assessment'; // Placeholder
            break;
        default:
            externalUrl = 'https://example.com';
    }

    // Open in new tab
    if (confirm('外部サイトへ移動して確認を行います。\n（※当サービスから連絡先が送信されることはありません）')) {
        window.open(externalUrl, '_blank');
    }
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

// Fixed Articles Logic
const fixedArticles = [
    { title: "老後の資金、足りる？不足する？", summary: "年金だけでは不安な方へ。資産寿命の考え方を解説します。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article1" },
    { title: "自宅を資産として活用する方法", summary: "住み続けながら資金を作る「リースバック」とは？", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article2" },
    { title: "老人ホームの費用相場まとめ", summary: "入居一時金や月額費用の目安を分かりやすく解説。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article3" },
    { title: "「資産寿命」を延ばす3つのポイント", summary: "早めの対策が鍵。今すぐできる家計の見直し術。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article4" },
    { title: "介護破産を防ぐための基礎知識", summary: "親の介護費用、もしもの時に備えるために。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article5" },
    { title: "専門家が教える「失敗しない施設選び」", summary: "見学時にチェックすべき重要ポイントを公開。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article6" },
    { title: "不動産売却のタイミングはいつ？", summary: "市場動向と個人の状況から最適な時期を判断。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article7" },
    { title: "子供に迷惑をかけないために", summary: "元気なうちに整理しておきたい資産と情報の話。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article8" },
    { title: "「終活」は何から始めるべき？", summary: "エンディングノートの書き方から断捨離まで。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article9" },
    { title: "私たちについて（運営理念）", summary: "シニアの安心な暮らしをサポートする想い。", link: "#", image: "https://placehold.co/80x60/e0e0e0/333?text=Article10" }
];

function renderArticles() {
    const container = document.getElementById('fixed-articles-container');
    if (!container) return;

    let html = '<h3 style="margin-bottom:15px; font-size:1.1rem; color:#333; text-align:center;">お役立ち情報</h3>';

    fixedArticles.forEach(article => {
        html += `
        <a href="${article.link}" class="article-banner">
            <div class="article-image">
                <img src="${article.image}" alt="Article Image">
            </div>
            <div class="article-content">
                <div class="article-title">${article.title}</div>
                <div class="article-summary">${article.summary}</div>
            </div>
        </a>
        `;
    });

    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check for token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        try {
            const response = await fetch('/api/results/' + token);
            if (response.ok) {
                const json = await response.json();
                const data = json.data;

                // Restore State
                userData = {
                    age: data.age,
                    pension: data.pension,
                    savings: data.savings,
                    property: data.propertyValue,
                    healthCost: parseInt(data.healthCost || 0),
                    email: data.email,
                    phone: data.phone,
                    detail: {
                        city: data.city,
                        landSize: data.land_size,
                        buildingAge: data.building_age
                    }
                };

                // Populate Inputs (Invisible but needed for logic)
                document.getElementById('input-age').value = userData.age;
                document.getElementById('input-pension').value = userData.pension;
                document.getElementById('input-savings').value = userData.savings;
                document.getElementById('input-property').value = userData.property;
                // ... others if needed

                // Jump to Full Result

                // Hide action buttons in confirm block since they are viewing from email
                const actionBtns = document.querySelector('.action-buttons');
                if (actionBtns) actionBtns.style.display = 'none';

                goToFullResult(); // This will re-calc and render chart
            } else {
                alert('入力データが見つかりませんでした。期限切れの可能性があります。');
            }
        } catch (e) {
            console.error('Failed to load token data', e);
            alert('データの取得に失敗しました。');
        }
    }

    renderArticles();
});
