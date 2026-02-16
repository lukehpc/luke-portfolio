const newsItems = [
    { title: "UN Treaty: Progress Toward Global Plastic Agreement", source: "UN Environment Programme", date: "Feb 10, 2026", url: "https://www.unep.org/inc-plastic-pollution" },
    { title: "OECD: Global Plastics Outlook Policy Scenarios to 2060", source: "OECD iLibrary", date: "Feb 08, 2026", url: "https://www.oecd.org/en/publications/global-plastics-outlook_aa194e68-en.html" },
    { title: "Milestone: 10 Million Kilos Removed from the Oceans", source: "The Ocean Cleanup", date: "Jan 25, 2026", url: "https://theoceancleanup.com/updates/" }
];

let newsIdx = 0;

// THEME TOGGLE
const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
});

document.addEventListener("DOMContentLoaded", () => {
    startTicker();
    updateNews();
    fetch('data/plastic-data.json')
        .then(res => res.json())
        .then(data => initCharts(data))
        .catch(err => console.error("Error loading JSON:", err));
});

function startTicker() {
    const el = document.getElementById("live-counter");
    const rate = 430000000 / (365 * 24 * 60 * 60 * 1000);
    setInterval(() => {
        const amount = (new Date() - new Date(new Date().getFullYear(), 0, 1)) * rate;
        el.innerText = Math.floor(amount).toLocaleString();
    }, 50);
}

function updateNews() {
    const box = document.getElementById("news-content");
    box.classList.add("news-fade");
    setTimeout(() => {
        const item = newsItems[newsIdx];
        box.innerHTML = `<a href="${item.url}" target="_blank">${item.title}</a><div class="news-meta">${item.source} — ${item.date}</div>`;
        box.classList.remove("news-fade");
    }, 350);
}

document.getElementById("nextNews").onclick = () => { newsIdx = (newsIdx + 1) % newsItems.length; updateNews(); };
document.getElementById("prevNews").onclick = () => { newsIdx = (newsIdx - 1 + newsItems.length) % newsItems.length; updateNews(); };

function initCharts(data) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false, // Critical for mobile scaling
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            x: { ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
    };

    new Chart(document.getElementById("wasteChart"), {
        type: 'line',
        data: {
            labels: data.globalPlasticWaste.map(d => d.year),
            datasets: [{ label: 'Waste', data: data.globalPlasticWaste.map(d => d.amount), borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fill: true, tension: 0.4 }]
        },
        options: commonOptions
    });

    new Chart(document.getElementById("countryChart"), {
        type: 'bar',
        data: {
            labels: data.topCountries.map(d => d.country),
            datasets: [{ label: 'Waste Produced', data: data.topCountries.map(d => d.amount), backgroundColor: '#6366f1', borderRadius: 5 }]
        },
        options: { ...commonOptions, indexAxis: 'y' }
    });
}