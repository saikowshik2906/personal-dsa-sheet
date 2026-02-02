const STORAGE_KEY = 'dsaTrackerData_v3';
const STORAGE_ORDER_KEY = 'dsaTrackerTopicOrder_v3';

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let topicOrder = JSON.parse(localStorage.getItem(STORAGE_ORDER_KEY)) || [];

if (!Array.isArray(topicOrder)) {
    topicOrder = Object.keys(data).sort();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(topicOrder));
    renderAll();
}

function renderAll() {
    renderSlide1();
    renderSlide2();
    updateDatalist();
}

function showSlide(slideNum) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`slide${slideNum}`).classList.add('active');
    document.querySelectorAll('.nav-btn')[slideNum - 1].classList.add('active');

    const fabs = document.querySelectorAll('.fab');
    if (slideNum === 1) {
        fabs.forEach(btn => btn.style.display = 'none');
    } else {
        fabs.forEach(btn => btn.style.display = 'block');
    }
}

// Slide 1 Logic
function renderSlide1() {
    const tbody = document.getElementById('progress-body');
    tbody.innerHTML = '';
    let globalTotal = 0;
    let globalCompleted = 0;
    
    // Sort logic for Slide 1 (optional, can follow topicOrder or just default iter)
    // Using topicOrder for consistency
    const topicsToRender = topicOrder && topicOrder.length > 0 ? topicOrder : Object.keys(data);
    
    let index = 0;
    topicsToRender.forEach(topic => {
        if(!data[topic]) return;
        const questions = data[topic];
        const qIds = Object.keys(questions);
        const total = qIds.length;
        const completed = Object.values(questions).filter(v => v).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        globalTotal += total;
        globalCompleted += completed;

        const tr = document.createElement('tr');
        tr.style.animation = `slideUpRow 0.4s ease forwards ${index * 0.05}s`;
        tr.style.opacity = '0'; 
        
        const tdTopic = document.createElement('td');
        tdTopic.textContent = topic;
        
        const tdProgress = document.createElement('td');
        tdProgress.className = 'progress-cell';
        
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar-container';
        
        const barFill = document.createElement('div');
        barFill.className = 'progress-bar-fill';
        setTimeout(() => { barFill.style.width = `${percentage}%`; }, 100 + (index * 50));
        
        const barText = document.createElement('span');
        barText.className = 'progress-text';
        barText.textContent = `${percentage}% (${completed}/${total})`;
        
        barContainer.appendChild(barFill);
        barContainer.appendChild(barText);
        tdProgress.appendChild(barContainer);
        
        tdProgress.addEventListener('mouseenter', (e) => showPieChart(e, completed, total, topic));
        tdProgress.addEventListener('mousemove', (e) => movePieChart(e));
        tdProgress.addEventListener('mouseleave', hidePieChart);

        tr.appendChild(tdTopic);
        tr.appendChild(tdProgress);
        tbody.appendChild(tr);
        index++;
    });

    renderGlobalStats(globalCompleted, globalTotal);
}

function renderGlobalStats(completed, total) {
    const circle = document.querySelector('.progress-ring__circle');
    if(!circle) return;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    const offset = circumference - (percentage / 100) * circumference;
    setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

    if(document.getElementById('global-percentage')) {
        animateValue('global-percentage', 0, percentage, 1000, '%');
    }
    if(document.getElementById('total-questions-count')) {
        document.getElementById('total-questions-count').textContent = `${completed} / ${total} Solved`;
    }
}

function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

const tooltip = document.getElementById('pie-tooltip');

function showPieChart(e, completed, total, topic) {
    if (total === 0 || !tooltip) return;
    tooltip.innerHTML = '';
    const percentage = Math.round((completed / total) * 100);
    
    // Donut Chart in Tooltip
    const donutBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    donutBg.setAttribute("r", "40");
    donutBg.setAttribute("cx", "50");
    donutBg.setAttribute("cy", "50");
    donutBg.setAttribute("fill", "transparent");
    donutBg.setAttribute("stroke", "#eee");
    donutBg.setAttribute("stroke-width", "10");
    
    const donutProg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    donutProg.setAttribute("r", "40");
    donutProg.setAttribute("cx", "50");
    donutProg.setAttribute("cy", "50");
    donutProg.setAttribute("fill", "transparent");
    donutProg.setAttribute("stroke", "#28a745");
    donutProg.setAttribute("stroke-width", "10");
    donutProg.style.transition = "stroke-dashoffset 0.5s ease";
    
    const donutCirc = 40 * 2 * Math.PI;
    donutProg.style.strokeDasharray = `${donutCirc} ${donutCirc}`;
    donutProg.style.strokeDashoffset = donutCirc;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.style.transform = "rotate(-90deg)";
    svg.appendChild(donutBg);
    svg.appendChild(donutProg);

    const textDiv = document.createElement('div');
    textDiv.className = 'tooltip-text';
    textDiv.textContent = `${percentage}%`;

    tooltip.appendChild(svg);
    tooltip.appendChild(textDiv);
    
    tooltip.style.display = 'flex';
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1) translate(15px, 15px)';
    
    movePieChart(e);

    setTimeout(() => {
        donutProg.style.strokeDashoffset = donutCirc - (percentage/100) * donutCirc;
    }, 10);
}

function movePieChart(e) {
    if(!tooltip) return;
    let x = e.pageX + 15;
    let y = e.pageY + 15;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hidePieChart() {
    if(!tooltip) return;
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.8)';
    setTimeout(() => {
        if(tooltip.style.opacity === '0') tooltip.style.display = 'none';
    }, 200);
}

// Slide 2 Logic
function renderSlide2() {
    const container = document.getElementById('topic-board');
    if(!container) return;
    container.innerHTML = '';
    
    const validTopics = topicOrder.filter(t => data.hasOwnProperty(t));

    for (let i = 0; i < validTopics.length; i++) {
        const topic = validTopics[i];
        const col = document.createElement('div');
        col.className = 'topic-column';
        
        if (isEditMode) {
            col.setAttribute('draggable', 'true');
            col.dataset.topicIndex = i;
            addDragHandlers(col, i);
        }

        const title = document.createElement('div');
        title.className = 'topic-title';
        title.textContent = topic;
        
        const delTopicBtn = document.createElement('button');
        delTopicBtn.className = 'topic-delete-btn';
        delTopicBtn.innerHTML = '×';
        delTopicBtn.title = "Delete entire topic";
        delTopicBtn.onclick = (e) => { e.stopPropagation(); deleteTopic(topic); };    
        title.appendChild(delTopicBtn);

        col.appendChild(title);

        const questionIds = Object.keys(data[topic]).sort((a, b) => {
            return isNaN(a) || isNaN(b) ? a.localeCompare(b) : Number(a) - Number(b);
        });

        questionIds.forEach(qId => {
            const isCompleted = data[topic][qId];
            const btn = document.createElement('button');
            btn.className = `q-btn ${isCompleted ? 'green' : 'red'}`;
            const txt = document.createTextNode(qId);
            btn.appendChild(txt);
            btn.title = `Question ${qId}`;
            btn.onclick = (e) => toggleQuestion(topic, qId, e);
            
            if(isCompleted) btn.classList.add('completed-anim'); 
            
            const delBadge = document.createElement('span');
            delBadge.className = 'delete-badge';
            delBadge.innerHTML = '×';
            delBadge.onclick = (e) => {
                e.stopPropagation(); 
                deleteQuestion(topic, qId);
            };
            btn.appendChild(delBadge);

            col.appendChild(btn);
        });

        container.appendChild(col);
    }
}

function toggleQuestion(topic, qId, event) {
    if(isEditMode) return; // Prevent toggling in edit mode
    const newState = !data[topic][qId];
    data[topic][qId] = newState;
    saveData();
    if (newState && event) {
        fireConfetti(event.clientX, event.clientY);
    }
}

// Drag & Drop
let draggedIndex = null;
function addDragHandlers(col, index) {
    col.addEventListener('dragstart', (e) => {
        draggedIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        col.classList.add('draggable-source');
        setTimeout(() => col.style.opacity = '0.5', 0);
    });

    col.addEventListener('dragend', (e) => {
        col.classList.remove('draggable-source');
        col.style.opacity = '1';
        document.querySelectorAll('.topic-column').forEach(c => c.classList.remove('draggable-over'));
    });
    
    col.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
    col.addEventListener('dragenter', (e) => { col.classList.add('draggable-over'); });
    col.addEventListener('dragleave', (e) => { col.classList.remove('draggable-over'); });

    col.addEventListener('drop', (e) => {
        e.stopPropagation();
        const targetIndex = index;
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            const itemToMove = topicOrder[draggedIndex];
            topicOrder.splice(draggedIndex, 1);
            topicOrder.splice(targetIndex, 0, itemToMove);
            saveData(); 
        }
        return false;
    });
}

function deleteTopic(topic) {
    if (confirm(`Delete topic "${topic}" and all its questions?`)) {
        delete data[topic];
        topicOrder = topicOrder.filter(t => t !== topic);
        saveData();
    }
}

function deleteQuestion(topic, qId) {
    if (confirm(`Delete Question ${qId}?`)) {
        if(data[topic]) {
            delete data[topic][qId];
            renderSlide2();
            if(isEditMode) document.getElementById('topic-board').classList.add('edit-mode');
            saveData();
        }
    }
}

// Edit Mode
let isEditMode = false;
function toggleEditMode() {
    isEditMode = !isEditMode;
    const topicBoard = document.getElementById('topic-board');
    const editBtn = document.querySelector('.fab-edit');
    
    if (isEditMode) {
        topicBoard.classList.add('edit-mode');
        editBtn.innerHTML = '✓';
        editBtn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
        editBtn.title = "Save Changes";
        renderSlide2();
    } else {
        topicBoard.classList.remove('edit-mode');
        editBtn.innerHTML = '✎';
        editBtn.style.background = 'linear-gradient(135deg, #FF9966, #FF5E62)';
        editBtn.title = "Edit Mode";
        saveData();
        renderSlide2();
    }
}

// Modals & Utils
function openModal() {
    document.getElementById('add-modal').style.display = 'block';
    document.getElementById('topic-input').value = '';
    document.getElementById('question-input').value = '';
}
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }
window.onclick = function(event) {
    const modal = document.getElementById('add-modal');
    if (event.target == modal) closeModal();
}

function updateDatalist() {
    const datalist = document.getElementById('existing-topics');
    if(!datalist) return;
    datalist.innerHTML = '';
    Object.keys(data).forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        datalist.appendChild(option);
    });
}

function handleAdd() {
    const topicInput = document.getElementById('topic-input').value.trim();
    const questionInput = document.getElementById('question-input').value.trim();
    if (!topicInput || !questionInput) { alert("Enter both topic and question."); return; }
    if (!data[topicInput]) {
        data[topicInput] = {};
        topicOrder.push(topicInput);
    }
    if (data[topicInput].hasOwnProperty(questionInput)) { alert("Question exists!"); return; }
    data[topicInput][questionInput] = false;
    saveData();
    closeModal();
}

// Effects
function fireConfetti(x, y) {
    const colors = ['#ff416c', '#2575fc', '#00b09b', '#f9d423', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 4 + 'px';
        confetti.style.backgroundColor = bg;
        confetti.style.width = size;
        confetti.style.height = size;
        confetti.style.left = x + 'px';
        confetti.style.top = y + 'px';
        document.body.appendChild(confetti);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100; 
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const rot = Math.random() * 720; 

        const animation = confetti.animate([
            { transform: `translate(0,0) rotate(0deg) scale(1)`, opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0)`, opacity: 0 }
        ], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' });
        animation.onfinish = () => confetti.remove();
    }
}

function startSnowfall() {
    const snowflakeChars = ['❄', '❅', '❆', '•'];
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
        const startLeft = Math.random() * 100;
        const duration = Math.random() * 5 + 5;
        const size = Math.random() * 1.5 + 0.5 + 'rem';
        const opacity = Math.random() * 0.4 + 0.6; 
        snowflake.style.left = startLeft + 'vw';
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.fontSize = size;
        snowflake.style.opacity = opacity;
        snowflake.style.color = 'white';
        document.body.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), duration * 1000);
    }, 50); 
}

const cardContainer = document.querySelector('.container');
document.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 768 && cardContainer) {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;
        cardContainer.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }
});

// Start
initApp();
startSnowfall();
renderAll