// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyAyZmq7gll12SDjdhTNFuLBqO1as6_tggw",
    authDomain: "dereck168-59adb.firebaseapp.com",
    databaseURL: "https://dereck168-59adb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dereck168-59adb",
    storageBucket: "dereck168-59adb.firebasestorage.app",
    messagingSenderId: "190057015096",
    appId: "1:190057015096:web:66fbdf935ce6a6f12e43cd",
    measurementId: "G-ZYC52LJSM1"
};

// เริ่มต้น Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database(); 
const auth = firebase.auth();

// 2. GLOBAL VARIABLES
let members = [];
let isAdmin = false;
let currentFilter = 'all';
let pendingDeleteId = null;

// --- ตั้งค่าระบบแบ่งหน้า (Pagination) ---
let currentPage = 1;
const itemsPerPage = 12; 
// ------------------------------------

// 3. INITIALIZATION
window.onload = () => {
    document.body.classList.add('locked');
    listenToMembers(); 
    checkAuthStatus();
};

// --- AUTHENTICATION SYSTEM ---
function checkAuthStatus() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("Logged in as:", user.email);
            isAdmin = true;
            document.getElementById('loginFormSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            renderMembers(); 
        } else {
            console.log("No user");
            isAdmin = false;
            document.getElementById('loginFormSection').style.display = 'block';
            document.getElementById('dashboardSection').style.display = 'none';
            renderMembers(); 
        }
    });
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('userInp').value; 
    const pass = document.getElementById('passInp').value;

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            showToast("เข้าสู่ระบบสำเร็จ!", "success");
        })
        .catch((error) => {
            console.error(error);
            let msg = "เข้าสู่ระบบไม่สำเร็จ";
            if (error.code === 'auth/wrong-password') msg = "รหัสผ่านไม่ถูกต้อง";
            if (error.code === 'auth/user-not-found') msg = "ไม่พบอีเมลนี้ในระบบ";
            showToast(msg, "error");
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        showToast("ออกจากระบบแล้ว", "success");
        document.getElementById('userInp').value = "";
        document.getElementById('passInp').value = "";
    }).catch((error) => {
        showToast("Error logout", "error");
    });
}

// 4. DATA MANAGEMENT
function listenToMembers() {
    db.ref('members').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            members = Object.keys(data).map(key => ({
                id: key, 
                ...data[key]
            }));
        } else {
            members = [];
        }
        renderMembers(); 
    });
}

// 5. RENDERING UI (แบบใช้รูปในเครื่องตามชื่อคน)
function renderMembers() {
    const grid = document.getElementById('memberGrid');
    const paginationDiv = document.getElementById('paginationControls'); 
    const searchVal = document.getElementById('memberSearch').value.toLowerCase();
    
    // กรองข้อมูล
    const filtered = members.filter(m => 
        (currentFilter === 'all' || m.type === currentFilter) &&
        m.name.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color:#aaa; text-align:center; width:100%; margin-top:20px;">ไม่พบข้อมูลสมาชิก</p>';
        if(paginationDiv) paginationDiv.innerHTML = "";
        return;
    }

    // คำนวณหน้า
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageMembers = filtered.slice(startIndex, endIndex);

    // วาดการ์ด (ดึงรูปจาก image/members/ชื่อคน.jpg)
    grid.innerHTML = pageMembers.map(m => `
        <div class="card">
            <img src="image/members/default.png"  
                 onerror="this.src='image/avatar.png'" 
                 alt="${m.name}">
            <h4>${m.name}</h4>
            <p>${m.type}</p>
            <a href="${m.fb}" target="_blank" class="fb-link">
                <i class="fa-brands fa-facebook"></i>
            </a>
            ${isAdmin ? `<button onclick="confirmDeleteModal('${m.id}')" class="delete-btn"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
    `).join('');

    // Animation
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animation = `cardEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;
        card.style.animationDelay = `${index * 0.08}s`; 
    });

    grid.classList.remove('grid-fade-out');

    if(paginationDiv) renderPagination(totalPages);
}

// Pagination Logic
function renderPagination(totalPages) {
    const paginationDiv = document.getElementById('paginationControls');
    let buttonsHTML = '';

    buttonsHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="page-btn"><i class="fa-solid fa-chevron-left"></i></button>`;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        buttonsHTML += `<button onclick="changePage(1)" class="page-btn">1</button>`;
        if (startPage > 2) buttonsHTML += `<span>...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        buttonsHTML += `<button onclick="changePage(${i})" class="page-btn ${activeClass}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) buttonsHTML += `<span>...</span>`;
        buttonsHTML += `<button onclick="changePage(${totalPages})" class="page-btn">${totalPages}</button>`;
    }

    buttonsHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="page-btn"><i class="fa-solid fa-chevron-right"></i></button>`;
    paginationDiv.innerHTML = buttonsHTML;
}

function changePage(newPage) {
    const grid = document.getElementById('memberGrid');
    grid.classList.add('grid-fade-out');
    setTimeout(() => {
        currentPage = newPage;
        renderMembers(); 
        document.getElementById('memberPage').scrollIntoView({ behavior: 'smooth' });
    }, 300); 
}

// 6. ADD MEMBER
function addNewMember() {
    const name = document.getElementById('newMemberName').value;
    const fb = document.getElementById('newMemberFB').value;
    const type = document.getElementById('newMemberGroup').value;
    
    // ไม่ต้องใช้ช่อง Image URL แล้ว
    
    if(name) {
        db.ref('members').push({
            name: name,
            fb: fb || "#",
            type: type,
            img: "auto" // ใส่ค่าหลอกๆ ไว้ เพราะเราใช้ชื่อไฟล์แทน
        }, (error) => {
            if (error) showToast("Error: " + error.message, "error");
            else {
                showToast(`เพิ่มคุณ ${name} แล้ว`, "success");
                document.getElementById('newMemberName').value = "";
                document.getElementById('newMemberFB').value = "";
            }
        });
    } else {
        showToast("กรุณาใส่ชื่อ!", "error");
    }
}

// 7. DELETE MEMBER
function confirmDeleteModal(id) {
    pendingDeleteId = id;
    const member = members.find(m => m.id === id);
    const modalHTML = `
        <div id="deleteModal" class="modal-overlay">
            <div class="modal-box">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#ff4444; margin-bottom:15px;"></i>
                <h3 style="color:#fff;">ยืนยันการลบ?</h3>
                <p style="color:#aaa;">ต้องการลบ <strong>${member.name}</strong> ใช่ไหม?</p>
                <div class="modal-btns">
                    <button onclick="executeDelete()" class="btn-confirm">ลบเลย</button>
                    <button onclick="closeModal()" class="btn-cancel">ยกเลิก</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function executeDelete() {
    if(pendingDeleteId) {
        db.ref('members/' + pendingDeleteId).remove()
            .then(() => {
                showToast("ลบเรียบร้อย", "error");
                closeModal();
            })
            .catch((error) => showToast("ลบไม่ได้: " + error.message, "error"));
    }
}

// 8. NAVIGATION FUNCTIONS (ที่น่าจะหายไป)
function enterSite() {
    const landing = document.getElementById('landingPage');
    const mainNav = document.getElementById('mainNav');
    const memberPage = document.getElementById('memberPage');

    landing.style.opacity = '0';
    landing.style.visibility = 'hidden'; 

    setTimeout(() => {
        landing.style.display = 'none';
        mainNav.style.display = 'block';
        memberPage.style.display = 'block';
        document.body.classList.remove('locked');
        
        memberPage.style.animation = 'none';
        memberPage.offsetHeight; 
        memberPage.style.animation = 'fadeIn 0.8s forwards';
    }, 800);
}

function showPage(pageId) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    
    // โชว์หน้าเป้าหมาย
    document.getElementById(pageId).style.display = 'block';
    
    // จัดการปุ่ม Active ในเมนู
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(pageId === 'adminPage') document.getElementById('nav-adm').classList.add('active');
}

// UI HELPERS
function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMembers();
}

function closeModal() {
    const modal = document.getElementById('deleteModal');
    if(modal) modal.remove();
}

function showToast(msg, type) {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;

}
