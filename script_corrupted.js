const STORAGE_KEY = 'dsaTrackerData_v2';
const STORAGE_ORDER_KEY = 'dsaTrackerTopicOrder_v1';

// Fallback data in case CSV fetch fails (e.g., file:// protocol restrictions)
const fallbackData = {
    "array": { "1": false, "121": false, "217": false, "53": false, "152": false, "56": false, "88": false, "75": false, "55": false },
    "string": { "3": false, "5": false, "14": false, "20": false, "49": false, "76": false, "125": false, "242": false, "424": false, "567": false },
    "recursion": { "21": false, "23": false, "50": false, "77": false, "78": false, "79": false, "98": false, "104": false, "110": false, "206": false },
    "search and sort": { "704": false, "35": false, "34": false, "49": false, "215": false, "56": false, "435": false, "253": false, "55": false, "134": false, "881": false },
    "LL": { "206": false, "141": false, "21": false, "203": false, "19": false, "2": false, "234": false, "138": false, "148": false, "23": false },
    "st and q": { "20": false, "150": false, "71": false, "85": false, "32": false, "496": false, "155": false, "739": false, "946": false, "641": false },
    "trees": { "94": false, "100": false, "226": false, "543": false, "110": false, "144": false, "199": false, "222": false, "105": false, "98": false },
    "hashmap": { "1": false, "13": false, "36": false, "49": false, "76": false, "128": false, "202": false, "383": false, "387": false, "692": false },
    "heap": { "23": false, "215": false, "295": false, "373": false, "378": false, "692": false, "347": false, "621": false, "767": false, "973": false },
    "practice": { "70": false, "198": false, "121": false, "300": false, "322": false, "518": false, "139": false, "152": false, "1143": false, "416": false },
    "graph": { "133": false, "200": false, "207": false, "210": false, "323": false, "417": false, "547": false, "695": false, "785": false, "994": false }
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
let topicOrder = JSON.parse(localStorage.getItem(STORAGE_ORDER_KEY));

// Initialize Application
async function initApp() {
    // If no local storage data, try to load from CSV, otherwise use fallback
    if (!data || Object.keys(data).length === 0) {
        try {
            console.log("Attempting to fetch data from s2.csv...");
            data = await loadDataFromCSV();
            console.log("Data loaded from CSV successfully");
        } catch (error) {
            console.warn("Could not load CSV (likely CORS if opening local file). Using fallback data.", error);
            data = fallbackData;
        }
        // Initialize Order
        topicOrder = Object.keys(data);
        saveData();
    } else {
        // Ensure topicOrder exists and is valid
        if(!topicOrder) {
             topicOrder = Object.keys(data).sort();
        }
        // Sync order with current data keys
        const currentKeys = Object.keys(data);
        // Add new keys
        currentKeys.forEach(k => {
            if(!topicOrder.includes(k)) topicOrder.push(k);
        });
        // Remove old keys
        topicOrder = topicOrder.filter(k => data.hasOwnProperty(k));
        
        renderAll();
    }
}

async function loadDataFromCSV() {
    const response = await fetch('s2.csv');
    if (!response.ok) throw new Error('Network response was not ok');
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = {};

    // Start from index 1 to skip header (Topic,Question ID,Status)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length < 2) continue;

        const topic = parts[0].trim();
        const qId = parts[1].trim();
        // Ignoring status from CSV for now as we default to false, 
        // but if CSV had "Completed" we could parse it:
        // const status = parts[2] && parts[2].trim().toLowerCase() === 'completed';

        if (!result[topic]) {
            result[topic] = {};
        }
        result[topic][qId] = false; // Default to not started
    }
    return result;
}

if (!data || Object.keys(data).length === 0) {
    // Trigger init if empty
    initApp();
} else {
   if (!topicOrder || topicOrder.length === 0) {
        topicOrder = Object.keys(data).sort();
    }
    renderAll();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(topicOrder));
    renderAll();
}
    renderSlide1();
    renderSlide2();
    updateDatalist();


// Navigation
function showSlide(slideNum) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`slide${slideNum}`).classList.add('active');
    document.querySelectorAll('.nav-btn')[slideNum - 1].classList.add('active');

    // Toggle Visibility of FABs (Add and Edit)
    const fabs = document.querySelectorAll('.fab');
    if (slideNum === 1) {
        fabs.forEach(btn => btn.style.display = 'none');
    } else {
        fabs.forEach(btn => btn.style.display = 'block');
    }

function renderAll() {
    renderSlide1();
    renderSlide2();
    updateDatalist();
}

// Navigation
function showSlide(slideNum) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`slide${slideNum}`).classList.add('active');
    document.querySelectorAll('.nav-btn')[slideNum - 1].classList.add('active');
}

// Slide 1 Logic
function renderSlide1() {
    const tbody = document.getElementById('progress-body');
    tbody.innerHTML = '';

    let globalTotal = 0;
    let globalCompleted = 0;

    const topics = Object.entries(data);
    
    // Animation staggere index
    let index = 0;

    for (const [topic, questions] of topics) {
        const qIds = Object.keys(questions);
        const total = qIds.length;
        const completed = Object.values(questions).filter(v => v).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        globalTotal += total;
        globalCompleted += completed;

        const tr = document.createElement('tr');
        tr.style.animation = `slideUpRow 0.4s ease forwards ${index * 0.05}s`;
        tr.style.opacity = '0'; // Start hidden for animation
        
        const tdTopic = document.createElement('td');
        tdTopic.textContent = topic;
        
        const tdProgress = document.createElement('td');
        tdProgress.className = 'progress-cell';
        
        // Create Progress Bar
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar-container';
        
        const barFill = document.createElement('div');
        barFill.className = 'progress-bar-fill';
        // Delay width animation slightly
        setTimeout(() => {
            barFill.style.width = `${percentage}%`;
        }, 100 + (index * 50));
        
        const barText = document.createElement('span');
        barText.className = 'progress-text';
        barText.textContent = `${percentage}% (${completed}/${total})`;
        
        barContainer.appendChild(barFill);
        barContainer.appendChild(barText);
        tdProgress.appendChild(barContainer);
        
        // Hover Event for Pie Chart
        tdProgress.addEventListener('mouseenter', (e) => showPieChart(e, completed, total, topic));
        tdProgress.addEventListener('mousemove', (e) => movePieChart(e));
        tdProgress.addEventListener('mouseleave', hidePieChart);

        tr.appendChild(tdTopic);
        tr.appendChild(tdProgress);
        tbody.appendChild(tr);

        index++;
    }

    renderGlobalStats(globalCompleted, globalTotal);
}

function renderGlobalStats(completed, total) {
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    const offset = circumference - (percentage / 100) * circumference;
    // Trigger animation
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 100);

    // Count up animation for number
    animateValue('global-percentage', 0, percentage, 1000, '%');
    
    document.getElementById('total-questions-count').textContent = `${completed} / ${total} Solved`;
}

function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
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
    if (total === 0) return;
    
    // Clear previous tooltip content
    tooltip.innerHTML = '';
    
    const percentage = Math.round((completed / total) * 100);
    const radius = 50;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    
    // Create SVG dynamically
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.style.transform = "rotate(-90deg)"; // Start from top
    
    // Background Circle (Red - Incomplete)
    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("r", radius);
    bgCircle.setAttribute("cx", "50");
    bgCircle.setAttribute("cy", "50");
    bgCircle.setAttribute("fill", "transparent");
    bgCircle.setAttribute("stroke", "#dc3545"); // Red
    bgCircle.setAttribute("stroke-width", "100"); // Fill completely
    svg.appendChild(bgCircle);

    // Progress Circle (Green - Completed)
    const progCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progCircle.setAttribute("r", radius/2); // Stroke width covers the rest
    progCircle.setAttribute("cx", "50");
    progCircle.setAttribute("cy", "50");
    progCircle.setAttribute("fill", "transparent");
    progCircle.setAttribute("stroke", "#28a745"); // Green
    progCircle.setAttribute("stroke-width", "50");
    // Calculate Dash Array for donut/pie segment effect
    // Actually for a filled pie chart with stroke, it's tricker. 
    // Let's use the standard donut stroke technique but with thick stroke.
    // To make it look like a pie, radius should be smaller and stroke-width = 2*radius.
    // Let's stick to a nice Donut Chart for the tooltip as it looks more modern.
    
    // Rethink: Donut Chart for tooltip
    // Outer Radius 45, Stroke 10.
    
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
    
    // Calculate circumference for r=40
    const donutCirc = 40 * 2 * Math.PI;
    donutProg.style.strokeDasharray = `${donutCirc} ${donutCirc}`;
    donutProg.style.strokeDashoffset = donutCirc; // Start empty

    // Text Label
    const textDiv = document.createElement('div');
    textDiv.className = 'tooltip-text';
    textDiv.textContent = `${percentage}%`;

    // Append to SVG (clearing first)
    svg.innerHTML = '';
    svg.appendChild(donutBg);
    svg.appendChild(donutProg);
    
    tooltip.appendChild(svg);
    tooltip.appendChild(textDiv);
    
    tooltip.style.display = 'flex';
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'scale(1) translate(15px, 15px)'; // slight offset
    
    movePieChart(e);

    // Animate
    setTimeout(() => {
        donutProg.style.strokeDashoffset = donutCirc - (percentage/100) * donutCirc;
    }, 10);
}

function movePieChart(e) {
    // Prevent tooltip from going off screen
    let x = e.pageX + 15;
    let y = e.pageY + 15;
    
    // Simple bound check could be added here
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hidePieChart() {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.8)';
    
    // Sort topics based on topicOrder
    // If topicOrder has keys not in data, or data has keys not in topicOrder, we should be safe due to sync in initApp, but let's filter.
    const validTopics = topicOrder.filter(t => data.hasOwnProperty(t));

    for (let i = 0; i < validTopics.length; i++) {
        const topic = validTopics[i];
        
        const col = document.createElement('div');
        col.className = 'topic-column';
        
        // Drag and Drop Attributes
        if (isEditMode) {
            col.setAttribute('draggable', 'true');
            col.dataset.topicIndex = i; // Store index to identify drop target logic
            addDragHandlers(col, i);
        }

        const title = document.createElement('div');
        title.className = 'topic-title';
        title.textContent = topic;
        
        // Topic Delete Button
        const delTopicBtn = document.createElement('button');
        delTopicBtn.className = 'topic-delete-btn';
        delTopicBtn.innerHTML = '×';
        delTopicBtn.title = "Delete entire topic";
        delTopicBtn.onclick = (e) => { e.stopPropagation(); deleteTopic(topic); };    
        title.appendChild(delTopicBtn);

    const topics = Object.keys(data).sort();

    for (const topic of topics) {
        const col = document.createElement('div');
        col.className = 'topic-column';

        const title = document.createElement('div');
        title.className = 'topic-title';
        title.textContent = topic;
        col.appendChild(title);

        // Sort questions numerically if possible, otherwise alphabetically
        const questionIds = Object.keys(data[topic]).sort((a, b) => {
            return isNaN(a) || isNaN(b) ? a.localeCompare(b) : Number(a) - Number(b);
        });

        questionIds.forEach(qId => {
            const isCompleted = data[topic][qId];
            const btn = document.createElement('button');
            btn.className = `q-btn ${isCompleted ? 'green' : 'red'}`;
            // btn.textContent = qId; // Moved to inside span for better layout control if needed, or keeping it simple
            
            // Text Node
            const txt = document.createTextNode(qId);
            btn.appendChild(txt);

            btn.title = `Question ${qId} - Click to toggle`;
            btn.onclick = (e) => toggleQuestion(topic, qId, e);
            
            if(isCompleted) btn.classList.add('completed-anim'); 
            
            // Add Delete Badge (Hidden by default via CSS)
            const delBadge = document.createElement('span');
            delBadge.className = 'delete-badge';
            delBadge.innerHTML = '×';
            delBadge.onclick = (e) => {
                e.stopPropagation(); // Stop bubbling to btn click
                deleteQuestion(topic, qId);
            };
            btn.appendChild(delBadge);

            col.appendChild(btn);
        });

        container.appendChild(col);
    }
}

function toggleQuestion(topic, qId, event) {
    const newState = !data[topic][qId];
    data[topic][qId] = newState;
    saveData();
    
    if (newState && event) {
        fireConfetti(event.clientX, event.clientY);
    }
}

// === Mind-Blowing Animations === //

// 1. Confetti Explosion
function fireConfetti(x, y) {
    const colors = ['#ff416c', '#2575fc', '#00b09b', '#f9d423', '#ffffff'];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random Properties
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 4 + 'px';
        
        confetti.style.backgroundColor = bg;
        confetti.style.width = size;
        confetti.style.height = size;
        confetti.style.left = x + 'px';
        confetti.style.top = y + 'px';
        
        document.body.appendChild(confetti);

        // Physics Calculation


function addDragHandlers(col, index) {
    col.addEventListener('dragstart', (e) => {
        draggedIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index); // Set data just in case
        col.classList.add('draggable-source');
        setTimeout(() => col.style.opacity = '0.5', 0); // Visual feedback
    });

    col.addEventListener('dragend', (e) => {
        col.classList.remove('draggable-source');
        col.style.opacity = '1';
        document.querySelectorAll('.topic-column').forEach(c => c.classList.remove('draggable-over'));
    });
    
    col.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        return false;
    });

    col.addEventListener('dragenter', (e) => {
        col.classList.add('draggable-over');
    });

    col.addEventListener('dragleave', (e) => {
        col.classList.remove('draggable-over');
    });

    col.addEventListener('drop', (e) => {
        e.stopPropagation(); // stops the browser from redirecting.
        const targetIndex = index;
        
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            // Remove dragged item and insert at target
            const itemToMove = topicOrder[draggedIndex];
            
            // Remove from old pos
            topicOrder.splice(draggedIndex, 1);
            // Insert at new pos
            topicOrder.splice(targetIndex, 0, itemToMove);
            
            saveData(); 
            // Save calls renderAll(), which re-creates the list.
            // Since we are in edit mode, re-creation will keep it in edit mode visual state 
            // if we ensure toggleEditMode logic knows about state, which it does via isEditMode
        }
        return false;
    });
}

function deleteTopic(topic) {
    if (confirm(`Wait! Are you sure you want to delete the ENTIRE topic "${topic}" and all its questions? This is permanent.`)) {
        delete data[topic];
        topicOrder = topicOrder.filter(t => t !== topic);
        saveData();
    }
}

// === Edit Mode Logic ===
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    const topicBoard = document.getElementById('topic-board');
    const editBtn = document.querySelector('.fab-edit');
    
    if (isEditMode) {
        topicBoard.classList.add('edit-mode');
        editBtn.innerHTML = '✓'; // Change to tick
        editBtn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)'; // Greenish
        editBtn.title = "Save Changes";
        renderSlide2(); // Re-render to apply drag attributes
    } else {
        topicBoard.classList.remove('edit-mode');
        editBtn.innerHTML = '✎'; // Change back to pencil
        editBtn.style.background = 'linear-gradient(135deg, #FF9966, #FF5E62)'; // Original color
        editBtn.title = "Edit Mode";
        saveData(); // Save on exit
        renderSlide2(); // Re-render to remove attributes
// === Edit Mode Logic ===
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    const topicBoard = document.getElementById('topic-board');
    const editBtn = document.querySelector('.fab-edit');
    
    if (isEditMode) {
        topicBoard.classList.add('edit-mode');
        editBtn.innerHTML = '✓'; // Change to tick
        editBtn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)'; // Greenish
        editBtn.title = "Save Changes";
    } else {
        topicBoard.classList.remove('edit-mode');
        editBtn.innerHTML = '✎'; // Change back to pencil
        editBtn.style.background = 'linear-gradient(135deg, #FF9966, #FF5E62)'; // Original color
        editBtn.title = "Edit Mode";
        saveData(); // Save on exit
    }
}

function deleteQuestion(topic, qId) {
    if (confirm(`Are you sure you want to delete Question ${qId} from ${topic}?`)) {
        if(data[topic]) {
            delete data[topic][qId];
            // If topic becomes empty, maybe delete topic? Keeping it for now.
            
            // Re-render immediately to reflect changes
            // Note: We need to maintain edit mode visual state
            renderSlide2();
            
            // If we are still in edit mode, we need to ensure the class is re-applied
            if(isEditMode) {
               document.getElementById('topic-board').classList.add('edit-mode');
            }
        }
    }
}

// 2. 3D Tilt Effect
const cardContainer = document.querySelector('.container');
let isHoveringContainer = false;

document.addEventListener('mousemove', (e) => {
    // Only apply if window is large enough to not be annoying
    if (window.innerWidth > 768) {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;

        cardContainer.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }
});

// Reset on leave - Called by Init or if data exists
// renderAll(); // Removed auto-call here, handled by initApp machinery

// Add Functionality
function openModal() {
    document.getElementById('add-modal').style.display = 'block';
    document.getElementById('topic-input').value = '';
    document.getElementById('question-input').value = '';
}

function closeModal() {
    document.getElementById('add-modal').style.display = 'none';
}

function updateDatalist() {
    const datalist = document.getElementById('existing-topics');
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

    if (!topicInput || !questionInput) {
        alert("Please enter both topic and question number/ID.");
        return;
    }

    if (!data[topicInput]) {
        data[topicInput] = {};
    }

    if (data[topicInput].hasOwnProperty(questionInput)) {
        alert("Question already exists in this topic!");
        return;
    }

    // Default status: Not Completed (false)
    data[topicInput][questionInput] = false;
    saveData();
    closeModal();
}

// Close modal if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('add-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// 3. Snowfall
function startSnowfall() {
    const snowflakeChars = ['❄', '❅', '❆', '•'];
    
    // Create snowflakes more frequently (every 50ms) for denser snow
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
        
        // Randomize position across the entire viewport width
        // Using vw units ensures it scales with resizing better than px
        const startLeft = Math.random() * 100; // 0 to 100vw
        
        const duration = Math.random() * 5 + 5; // 5-10s fall time
        const size = Math.random() * 1.5 + 0.5 + 'rem';
        const opacity = Math.random() * 0.4 + 0.6; // 0.6 to 1.0 opacity (Creating brighter/whiter flakes)
        
        snowflake.style.left = startLeft + 'vw';
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.fontSize = size;
        snowflake.style.opacity = opacity;
        
        // Ensure pure white color
        snowflake.style.color = 'white';
        
        document.body.appendChild(snowflake);
        
        // Remove after animation
        setTimeout(() => {
            snowflake.remove();
        }, duration * 1000);
    }, 50); 
}

// Initial render
startSnowfall();
renderAll();
