let translationMemory = JSON.parse(localStorage.getItem('translationMemory')) || {};
let glossary = JSON.parse(localStorage.getItem('glossary')) || {};

const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
themeToggle.onclick = () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
};

function getSimilarity(s1, s2) {
    let longer = s1.length >= s2.length ? s1 : s2;
    let shorter = s1.length < s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function runQA(source, target, warningEl) {
    if (!target) { warningEl.style.display = "none"; return; }
    const sourceEnd = source.trim().slice(-1);
    const targetEnd = target.trim().slice(-1);
    const punc = [".", "!", "?", ":", ";"];
    if (punc.includes(sourceEnd) && sourceEnd !== targetEnd) {
        warningEl.innerText = `⚠️ Punctuation mismatch: Source ends in '${sourceEnd}'`;
        warningEl.style.display = "block";
    } else { warningEl.style.display = "none"; }
}

const addTermBtn = document.getElementById('add-term-btn');
const termSource = document.getElementById('term-source');
const termTarget = document.getElementById('term-target');
const glossaryList = document.getElementById('glossary-list');

function renderGlossary() {
    glossaryList.innerHTML = '';
    for (let key in glossary) {
        const item = document.createElement('div');
        item.className = 'term-item';
        item.innerHTML = `<span><strong>${key}</strong> → ${glossary[key]}</span><span class="term-remove" onclick="removeTerm('${key}')">×</span>`;
        glossaryList.appendChild(item);
    }
}

addTermBtn.onclick = () => {
    if (termSource.value && termTarget.value) {
        glossary[termSource.value] = termTarget.value;
        localStorage.setItem('glossary', JSON.stringify(glossary));
        termSource.value = ''; termTarget.value = '';
        renderGlossary();
    }
};

window.removeTerm = (key) => {
    delete glossary[key];
    localStorage.setItem('glossary', JSON.stringify(glossary));
    renderGlossary();
};

function highlightTerms(text) {
    let highlighted = text;
    for (let term in glossary) {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        highlighted = highlighted.replace(regex, `<span class="glossary-match" title="Glossary Suggestion: ${glossary[term]}">$1</span>`);
    }
    return highlighted;
}

const segmentBtn = document.getElementById('segment-btn');
const sourceInput = document.getElementById('source-input');
const workbench = document.getElementById('workbench-section');
const segmentList = document.getElementById('segment-list');
const progressContainer = document.getElementById('progress-container');

segmentBtn.onclick = () => {
    const text = sourceInput.value.trim();
    if (!text) return;
    const segments = text.split(/(?<=[.!?])\s+/);
    segmentList.innerHTML = '';
    segments.forEach((seg, idx) => {
        let matchClass = '';
        let suggestion = translationMemory[seg] || '';
        let similarityLabel = '';
        if (suggestion) { matchClass = 'exact-match'; } else {
            let bestMatch = { score: 0, trans: '' };
            for (let key in translationMemory) {
                let score = getSimilarity(seg, key);
                if (score > 0.7 && score > bestMatch.score) {
                    bestMatch = { score: score, trans: translationMemory[key] };
                }
            }
            if (bestMatch.score > 0) {
                suggestion = bestMatch.trans;
                matchClass = 'fuzzy-match';
                similarityLabel = `(${(bestMatch.score * 100).toFixed(0)}% Match)`;
            }
        }
        const row = document.createElement('div');
        row.className = `segment-row ${matchClass}`;
        row.innerHTML = `<div class="source-seg">${highlightTerms(seg)}<span class="copy-hint" onclick="copySource(this, ${idx})">Copy to Target</span><br><small style="color:#94a3b8; font-weight:normal;">${similarityLabel}</small></div><div class="target-seg"><input type="text" class="target-input" id="target-${idx}" value="${suggestion}" data-source="${seg}" placeholder="Translate..."><div class="qa-warning" id="qa-${idx}"></div></div>`;
        segmentList.appendChild(row);
        if (suggestion) runQA(seg, suggestion, row.querySelector('.qa-warning'));
    });
    workbench.style.display = 'block';
    progressContainer.style.display = 'block';
    updateProgress();
    updateTMCount();
    workbench.scrollIntoView({ behavior: 'smooth' });
};

window.copySource = (el, idx) => {
    const input = document.getElementById(`target-${idx}`);
    input.value = input.dataset.source;
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

function updateProgress() {
    const inputs = document.querySelectorAll('.target-input');
    if (!inputs.length) return;
    const filled = Array.from(inputs).filter(i => i.value.trim() !== "").length;
    const percent = Math.round((filled / inputs.length) * 100);
    document.getElementById('progress-fill').style.width = percent + "%";
    document.getElementById('progress-percent').innerText = percent + "%";
}

segmentList.addEventListener('input', (e) => {
    if (e.target.classList.contains('target-input')) {
        translationMemory[e.target.dataset.source] = e.target.value;
        localStorage.setItem('translationMemory', JSON.stringify(translationMemory));
        runQA(e.target.dataset.source, e.target.value, e.target.nextElementSibling);
        updateTMCount();
        updateProgress();
    }
});

function updateTMCount() {
    document.getElementById('tm-status').innerText = `Memory Active: ${Object.keys(translationMemory).length} Segments`;
}

document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        localStorage.setItem('translationMemory', JSON.stringify(translationMemory));
        localStorage.setItem('glossary', JSON.stringify(glossary));
        alert("Project Saved Successfully");
    }
    if (active.classList.contains('target-input')) {
        const inputs = Array.from(document.querySelectorAll('.target-input'));
        const idx = inputs.indexOf(active);
        if (e.ctrlKey && e.key === 'Enter') {
            if (idx < inputs.length - 1) inputs[idx + 1].focus();
        }
        if (e.ctrlKey && e.key === 'Insert') {
            active.value = active.dataset.source;
            active.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            if (idx < inputs.length - 1) inputs[idx + 1].focus();
        }
        if (e.altKey && e.key === 'ArrowUp') {
            e.preventDefault();
            if (idx > 0) inputs[idx - 1].focus();
        }
        if (e.ctrlKey && e.key === '1') {
            console.log("Top Match Applied (Prototype)");
        }
    }
});

document.getElementById('export-btn').onclick = () => {
    const text = Array.from(document.querySelectorAll('.target-input')).map(i => i.value || "[EMPTY]").join(' ');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'translation-export.txt';
    a.click();
};

document.getElementById('clear-tm-btn').onclick = () => {
    if(confirm("Wipe all memory?")) { localStorage.clear(); location.reload(); }
};

const scrollBtn = document.getElementById('scrollTop');
window.onscroll = () => scrollBtn.classList.toggle('show', window.scrollY > 300);
scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

renderGlossary();