// --- 1. GLOBAL STATE ---
let entries = JSON.parse(localStorage.getItem('diary_entries')) || [];
let userPin = localStorage.getItem('diary_pin');
let currentImageData = null;
let entryType = 'text'; 

// --- 2. AUTHENTICATION ---
function checkPassword() {
    const input = document.getElementById('pass-input');
    const val = input.value;
    const errorMsg = document.getElementById('auth-error');

    if (!userPin) {
        if (val.length === 4) {
            localStorage.setItem('diary_pin', val);
            userPin = val;
            alert("PIN Created Successfully!");
            location.reload();
        } else {
            errorMsg.innerText = "Please enter 4 digits to set your PIN";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    if (val === userPin) {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        renderEntries();
    } else {
        errorMsg.innerText = "Access Denied";
        errorMsg.classList.remove('hidden');
        input.value = '';
    }
}

// --- 3. EDITOR LOGIC ---
function setEntryType(type) {
    entryType = type;
    const textBtn = document.getElementById('type-text');
    const listBtn = document.getElementById('type-list');
    const area = document.getElementById('entry-body');
    
    if(type === 'list') {
        listBtn.className = "px-4 py-2 rounded-xl bg-white shadow-sm font-bold text-[10px] uppercase tracking-wider transition-all text-indigo-600";
        textBtn.className = "px-4 py-2 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-wider transition-all";
        area.placeholder = "Enter tasks...";
        if (area.value.trim() === "") area.value = "• ";
    } else {
        textBtn.className = "px-4 py-2 rounded-xl bg-white shadow-sm font-bold text-[10px] uppercase tracking-wider transition-all text-indigo-600";
        listBtn.className = "px-4 py-2 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-wider transition-all";
        area.placeholder = "Write your heart out...";
        if (area.value === "• ") area.value = "";
    }
}

// Auto-bullet logic for List Mode
document.getElementById('entry-body').addEventListener('keydown', function(e) {
    if (entryType === 'list' && e.key === 'Enter') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "\n• " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 3;
    }
});

// --- 4. CORE SAVE & DELETE ---
function saveEntry() {
    const bodyField = document.getElementById('entry-body');
    const bodyInput = bodyField.value.trim();
            
    if (!bodyInput || bodyInput === "•") {
        alert("Please write something first!");
        return;
    }

    const isCoded = confirm("Would you like to save this in CODED form?");

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const newEntry = {
        id: Date.now(),
        type: entryType,
        title: "Memory at " + timeLabel,
        body: isCoded ? btoa(unescape(encodeURIComponent(bodyInput))) : bodyInput,
        image: currentImageData,
        isCoded: isCoded,
        date: dateLabel
    };

    try {
        entries.unshift(newEntry);
        localStorage.setItem('diary_entries', JSON.stringify(entries));
        
        renderEntries();
        toggleView('list');
        clearForm();
    } catch (e) {
        alert("Storage error. The image might be too large.");
    }
}

function deleteEntry(id) {
    if(confirm("Delete this memory forever?")) {
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem('diary_entries', JSON.stringify(entries));
        renderEntries();
    }
}

function clearAll() {
    if(confirm("Wipe all memories? This cannot be undone.")) {
        entries = [];
        localStorage.setItem('diary_entries', JSON.stringify(entries));
        renderEntries();
    }
}

// --- 5. UI RENDERING ---
function renderEntries() {
    const container = document.getElementById('entries-list');
    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 opacity-40">
                <div class="text-7xl mb-4 scale-110">✍️</div>
                <p class="text-xl font-bold text-slate-400 tracking-tight">Your story starts here...</p>
            </div>`;
        return;
    }

    entries.forEach((e, index) => {
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] mb-8 fade-in relative overflow-hidden";
        card.style.animationDelay = `${index * 0.1}s`;

        let displayContent = "";
        if (e.type === 'list') {
            const items = e.body.split('\n');
            displayContent = items.map(item => `
                <div class="flex items-center gap-3 mb-2 group">
                    <input type="checkbox" class="w-5 h-5 rounded-lg border-2 border-indigo-100 checked:bg-indigo-500 transition-all cursor-pointer">
                    <span class="text-slate-700 font-medium group-has-[:checked]:line-through group-has-[:checked]:text-slate-300 transition-all">
                        ${item.replace('•', '').trim()}
                    </span>
                </div>
            `).join('');
        } else {
            displayContent = e.isCoded ? `<span class="italic text-slate-300">Secret locked...</span>` : e.body.replace(/\n/g, '<br>');
        }
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-5">
                <div class="flex items-center gap-3">
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-md shadow-indigo-100">
                        ${e.date}
                    </div>
                </div>
                <button onclick="deleteEntry(${e.id})" class="text-slate-200 hover:text-red-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            ${e.image ? `<img src="${e.image}" class="rounded-[2rem] w-full mb-5 shadow-lg object-cover max-h-80">` : ''}
            <div class="px-1 text-slate-800 leading-[1.7] text-[17px] font-medium tracking-tight">
                ${displayContent}
            </div>
            ${e.isCoded ? `
                <button onclick="decodeAndShow('${e.body}')" class="mt-6 w-full py-4 bg-slate-50 rounded-2xl text-indigo-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all">
                    ✨ Unveil Secret
                </button>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

// --- 6. UTILITIES ---
function decodeAndShow(str) {
    try {
        const decoded = decodeURIComponent(escape(atob(str)));
        alert("Your Secret Message:\n\n" + decoded);
    } catch(e) { alert("Error decoding."); }
}

function toggleView(view) {
    const editor = document.getElementById('editor-view');
    if(view === 'editor') editor.classList.remove('hidden');
    else { editor.classList.add('hidden'); clearForm(); }
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => {
        currentImageData = reader.result;
        document.getElementById('preview-src').src = reader.result;
        document.getElementById('img-preview').classList.remove('hidden');
    };
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function clearImage() {
    currentImageData = null;
    document.getElementById('img-preview').classList.add('hidden');
    document.getElementById('image-input').value = "";
}

function clearForm() {
    document.getElementById('entry-body').value = '';
    currentImageData = null;
    document.getElementById('img-preview').classList.add('hidden');
    setEntryType('text');
}

// Initial Boot
window.onload = () => {
    if (!localStorage.getItem('diary_pin')) {
        document.querySelector('#auth-overlay h1').innerText = "Create Your PIN";
    }
};