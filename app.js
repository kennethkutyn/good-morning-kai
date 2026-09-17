// Time offset tracking
let timeOffset = 0; // milliseconds to offset from real time
let routineData = null; // store routine data for highlighting
const STORAGE_KEY = 'goodMorningKaiRoutine';
let editMode = false;
let dragState = null;

// Update clock every second
function updateClock() {
    const now = new Date(Date.now() + timeOffset);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;

    // Update highlight
    highlightCurrentActivity();

    // Update trivia answer visibility
    updateTriviaAnswer();
}

// Convert time string (e.g., "7:05 AM") to minutes since midnight
function timeToMinutes(timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

// Highlight the current activity based on time
function highlightCurrentActivity() {
    if (!routineData || editMode) return;

    const now = new Date(Date.now() + timeOffset);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const items = document.querySelectorAll('#routine-list > div');

    // Find which activity we're currently in
    let activeIndex = -1;
    for (let i = 0; i < routineData.morningRoutine.length; i++) {
        const itemMinutes = timeToMinutes(routineData.morningRoutine[i].time);
        const nextItemMinutes = i < routineData.morningRoutine.length - 1
            ? timeToMinutes(routineData.morningRoutine[i + 1].time)
            : 24 * 60; // End of day

        if (currentMinutes >= itemMinutes && currentMinutes < nextItemMinutes) {
            activeIndex = i;
            break;
        }
    }

    // Update highlighting and completion status
    items.forEach((item, index) => {
        const nextItemMinutes = index < routineData.morningRoutine.length - 1
            ? timeToMinutes(routineData.morningRoutine[index + 1].time)
            : 24 * 60;

        const isPast = currentMinutes >= nextItemMinutes;
        const isCurrent = index === activeIndex;

        const paragraph = item.querySelector('p');

        // Remove all state classes
        item.classList.remove('current', 'completed', 'future');

        if (isCurrent) {
            // Current activity - highlight
            item.classList.add('current');

            // Remove checkmark if present
            if (paragraph && paragraph.textContent.includes('✓')) {
                paragraph.innerHTML = paragraph.innerHTML.replace('✓ ', '');
            }
        } else if (isPast) {
            // Past activity - grey out and add checkmark
            item.classList.add('completed');

            // Add checkmark if not already present
            if (paragraph && !paragraph.textContent.includes('✓')) {
                paragraph.innerHTML = '✓ ' + paragraph.innerHTML;
            }
        } else {
            // Future activity - normal
            item.classList.add('future');

            // Remove checkmark if present
            if (paragraph && paragraph.textContent.includes('✓')) {
                paragraph.innerHTML = paragraph.innerHTML.replace('✓ ', '');
            }
        }
    });
}

// Set custom time
function setCustomTime() {
    const input = document.getElementById('time-input').value;
    const match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);

    if (match) {
        const [, hours, minutes, seconds] = match;
        const customTime = new Date();
        customTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

        const realTime = new Date();
        timeOffset = customTime - realTime;

        updateClock();
    }
}

// Fetch joke of the day
function fetchJoke() {
    fetch('https://icanhazdadjoke.com/', {
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('joke-text').textContent = data.joke;
    })
    .catch(error => {
        console.error('Error fetching joke:', error);
        document.getElementById('joke-text').textContent = 'Could not load joke. Try again later!';
    });
}

// Fetch trivia question
let triviaAnswer = '';

function fetchTrivia() {
    fetch('https://opentdb.com/api.php?amount=1&category=9&difficulty=easy')
    .then(response => response.json())
    .then(data => {
        if (data.results && data.results.length > 0) {
            const question = data.results[0];
            // Decode HTML entities
            const parser = new DOMParser();
            const decodedQuestion = parser.parseFromString(question.question, 'text/html').body.textContent;
            const decodedAnswer = parser.parseFromString(question.correct_answer, 'text/html').body.textContent;

            document.getElementById('trivia-question').textContent = decodedQuestion;
            triviaAnswer = decodedAnswer;

            // Check if we should show the answer
            updateTriviaAnswer();
        }
    })
    .catch(error => {
        console.error('Error fetching trivia:', error);
        document.getElementById('trivia-question').textContent = 'Could not load trivia. Try again later!';
    });
}

// Update trivia answer visibility based on time
function updateTriviaAnswer() {
    const now = new Date(Date.now() + timeOffset);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const showAnswerTime = 7 * 60 + 20; // 7:20 AM

    const answerElement = document.getElementById('trivia-answer');
    if (currentMinutes >= showAnswerTime && triviaAnswer) {
        answerElement.textContent = `Answer: ${triviaAnswer}`;
        answerElement.style.display = 'block';
    } else {
        answerElement.style.display = 'none';
    }
}

// Start the clock
updateClock();
setInterval(updateClock, 1000);

// Fetch joke and trivia on load
fetchJoke();
fetchTrivia();

// Try to parse a time string like "7:00 AM"; returns minutes-since-midnight or null
function tryParseTime(str) {
    const match = String(str).match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

function minutesToTimeStr(mins) {
    mins = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

// Duration in minutes for the item at `index` (defaults to 5 for the last item)
function getItemDuration(index) {
    const items = routineData.morningRoutine;
    if (index >= items.length - 1) return 5;
    const cur = tryParseTime(items[index].time);
    const next = tryParseTime(items[index + 1].time);
    if (cur == null || next == null) return 5;
    const diff = next - cur;
    return diff > 0 ? diff : 5;
}

async function loadRoutine() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.morningRoutine)) return parsed;
        } catch (e) {
            console.warn('Could not parse saved routine, falling back to default', e);
        }
    }
    const response = await fetch('morning-routine.json');
    return await response.json();
}

function renderRoutine() {
    const routineList = document.getElementById('routine-list');
    routineList.innerHTML = '';

    if (editMode) {
        const startEditor = document.createElement('div');
        startEditor.className = 'start-time-editor';
        startEditor.innerHTML = `
            <span>Start time:</span>
            <input type="text" id="start-time-input" value="${routineData.morningRoutine[0].time}" placeholder="7:00 AM">
        `;
        routineList.appendChild(startEditor);
    }

    routineData.morningRoutine.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.dataset.origIndex = index;

        if (editMode) {
            itemDiv.className = 'edit-item';
            const duration = getItemDuration(index);
            itemDiv.innerHTML = `
                <span class="drag-handle" aria-label="Drag to reorder">☰</span>
                <span class="icon">${item.icon}</span>
                <span class="activity-name">${item.activity}</span>
                <input type="number" class="duration-input" value="${duration}" min="1" max="180">
                <span class="duration-label">min</span>
            `;
        } else {
            itemDiv.innerHTML = `
                <p>
                    <strong>${item.time}</strong>
                    <span class="icon">${item.icon}</span>
                    ${item.activity}
                </p>
            `;
        }
        routineList.appendChild(itemDiv);
    });

    if (editMode) {
        attachDragHandlers();
    } else {
        highlightCurrentActivity();
    }
}

function attachDragHandlers() {
    document.querySelectorAll('#routine-list .drag-handle').forEach(handle => {
        handle.addEventListener('pointerdown', startDrag);
    });
}

function startDrag(e) {
    e.preventDefault();
    const handle = e.currentTarget;
    const item = handle.closest('#routine-list > div');
    if (!item) return;

    dragState = { item, handle, pointerId: e.pointerId };
    item.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);

    handle.addEventListener('pointermove', onDrag);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
}

function onDrag(e) {
    if (!dragState) return;
    const list = document.getElementById('routine-list');
    const draggedItem = dragState.item;
    const others = [...list.querySelectorAll('.edit-item')].filter(i => i !== draggedItem);

    const y = e.clientY;
    for (const other of others) {
        const rect = other.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
            if (y < rect.top + rect.height / 2) {
                list.insertBefore(draggedItem, other);
            } else {
                list.insertBefore(draggedItem, other.nextSibling);
            }
            return;
        }
    }
}

function endDrag() {
    if (!dragState) return;
    const { item, handle, pointerId } = dragState;
    item.classList.remove('dragging');
    try { handle.releasePointerCapture(pointerId); } catch (err) {}
    handle.removeEventListener('pointermove', onDrag);
    handle.removeEventListener('pointerup', endDrag);
    handle.removeEventListener('pointercancel', endDrag);
    dragState = null;
}

function toggleEditMode() {
    editMode = true;
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('save-btn').style.display = '';
    document.getElementById('cancel-btn').style.display = '';
    document.getElementById('reset-btn').style.display = '';
    renderRoutine();
}

function exitEditMode() {
    editMode = false;
    document.getElementById('edit-btn').style.display = '';
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('cancel-btn').style.display = 'none';
    document.getElementById('reset-btn').style.display = 'none';
    renderRoutine();
}

function saveEdits() {
    const list = document.getElementById('routine-list');
    const editItems = [...list.querySelectorAll('.edit-item')];
    const startInput = document.getElementById('start-time-input');
    const parsedStart = tryParseTime(startInput.value);
    const startMinutes = parsedStart != null
        ? parsedStart
        : tryParseTime(routineData.morningRoutine[0].time) || 0;

    let cumulative = startMinutes;
    const newItems = editItems.map(el => {
        const origIndex = parseInt(el.dataset.origIndex);
        const orig = routineData.morningRoutine[origIndex];
        const duration = Math.max(1, parseInt(el.querySelector('.duration-input').value) || 1);
        const item = {
            time: minutesToTimeStr(cumulative),
            activity: orig.activity,
            icon: orig.icon
        };
        cumulative += duration;
        return item;
    });

    routineData = { morningRoutine: newItems };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routineData));
    exitEditMode();
}

function cancelEdits() {
    exitEditMode();
}

async function resetRoutine() {
    if (!confirm('Reset routine to the default? Your changes will be lost.')) return;
    localStorage.removeItem(STORAGE_KEY);
    const response = await fetch('morning-routine.json');
    routineData = await response.json();
    exitEditMode();
}

// Load and render routine on startup
loadRoutine()
    .then(data => {
        routineData = data;
        renderRoutine();
    })
    .catch(error => {
        console.error('Error loading routine:', error);
        document.getElementById('routine-list').innerHTML = '<p>Error loading routine</p>';
    });

// Keep screen awake on iPad
let wakeLock = null;
const statusDiv = document.getElementById('wake-status');

function updateStatus(message) {
    console.log(message);
    if (statusDiv) {
        statusDiv.innerHTML += message + '<br>';
    }
}

async function initKeepAwake() {
    const video = document.getElementById('keep-awake-video');

    updateStatus('Initializing keep-awake...');

    // Try Wake Lock API first (most reliable for modern browsers)
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            updateStatus('✓ Wake Lock API active');

            wakeLock.addEventListener('release', () => {
                updateStatus('Wake Lock released');
            });

            // Re-acquire wake lock when page becomes visible
            document.addEventListener('visibilitychange', async () => {
                if (wakeLock !== null && document.visibilityState === 'visible') {
                    try {
                        wakeLock = await navigator.wakeLock.request('screen');
                        updateStatus('✓ Wake Lock re-acquired');
                    } catch (err) {
                        updateStatus('✗ Wake Lock re-acquire failed: ' + err.message);
                    }
                }
            });
        } catch (err) {
            updateStatus('✗ Wake Lock API failed: ' + err.message);
        }
    } else {
        updateStatus('✗ Wake Lock API not supported');
    }

    // Also try video approach as backup
    updateStatus('Trying video approach...');

    // Create a silent video using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const ctx = canvas.getContext('2d');

    // Draw something that changes to keep it "active"
    let frame = 0;
    function drawFrame() {
        ctx.fillStyle = frame % 2 === 0 ? 'black' : '#010101';
        ctx.fillRect(0, 0, 100, 100);
        frame++;
        requestAnimationFrame(drawFrame);
    }
    drawFrame();

    // Create a video stream from the canvas
    const stream = canvas.captureStream(25);
    video.srcObject = stream;

    // Try to play the video
    try {
        await video.play();
        updateStatus('✓ Video is playing');
        updateStatus('Video paused: ' + video.paused);
        updateStatus('Video muted: ' + video.muted);
    } catch (err) {
        updateStatus('✗ Video autoplay failed: ' + err.message);
        updateStatus('Touch screen to enable video');

        // If autoplay fails, try again on user interaction
        document.addEventListener('touchstart', async () => {
            try {
                await video.play();
                updateStatus('✓ Video playing after touch');
            } catch (e) {
                updateStatus('✗ Still could not play: ' + e.message);
            }
        }, { once: true });
    }

    // Monitor video status
    setInterval(() => {
        if (video.paused) {
            updateStatus('⚠ Video paused, trying to resume...');
            video.play().catch(e => updateStatus('✗ Resume failed: ' + e.message));
        }
    }, 5000);
}

// Initialize keep awake functionality
initKeepAwake();
