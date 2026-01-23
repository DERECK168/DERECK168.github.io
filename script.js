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
firebase.initializeApp(firebaseConfig);
const db = firebase.database(); 

// 2. CONFIGURATION & AUTH
const ADMINS = [
    { u: "UmFpemVu", p: "UmFpemVuYWRtaW5TaW5z" }, 
    { u: "ZGVyZWNreGJsaXR6", p: "QWRtaW4xNjg=" }                    
];

// ตัวแปร Global
let members = [];
let isAdmin = false;
let currentFilter = 'all';
let pendingDeleteId = null;

// --- ตั้งค่าระบบแบ่งหน้า (Pagination) ---
let currentPage = 1;
const itemsPerPage = 12; // โชว์หน้าละ 12 คน
// ------------------------------------

// 3. INITIALIZATION
window.onload = () => {
    document.body.classList.add('locked');
    listenToMembers(); 
};

// 4. DATA MANAGEMENT (FIREBASE)
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

// 5. RENDERING UI (พร้อมระบบแบ่งหน้า + Staggered Animation)
function renderMembers() {
    const grid = document.getElementById('memberGrid');
    const paginationDiv = document.getElementById('paginationControls'); 
    const searchVal = document.getElementById('memberSearch').value.toLowerCase();
    
    // 1. กรองข้อมูล
    const filtered = members.filter(m => 
        (currentFilter === 'all' || m.type === currentFilter) &&
        m.name.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color:#aaa; text-align:center; width:100%; margin-top:20px; font-size:1.2rem;">ไม่พบข้อมูลสมาชิก</p>';
        if(paginationDiv) paginationDiv.innerHTML = "";
        return;
    }

    // 2. คำนวณหน้า
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;
    if (currentPage < 1) currentPage = 1;

    // 3. ตัดข้อมูลเฉพาะหน้านั้น
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageMembers = filtered.slice(startIndex, endIndex);

    // 4. วาดการ์ด (ยังไม่ต้องใส่อนิเมชั่นใน HTML)
    grid.innerHTML = pageMembers.map(m => `
        <div class="card">
            <img src="${m.img}" 
                 onerror="this.src='https://via.placeholder.com/150/000000/FFFFFF?text=${m.name.charAt(0)}'" 
                 alt="Avatar">
            <h4>${m.name}</h4>
            <p>${m.type}</p>
            <a href="${m.fb}" target="_blank" class="fb-link">
                <i class="fa-brands fa-facebook"></i>
            </a>
            ${isAdmin ? `<button onclick="confirmDeleteModal('${m.id}')" class="delete-btn"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
    `).join('');

    // !!! ส่วนสำคัญ: สั่งให้การ์ดเด้งมาทีละใบ (Staggered Animation) !!!
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // ใบแรกมาทันที, ใบสองรอ 0.1วิ, ใบสามรอ 0.2วิ ...
        card.style.animation = `cardEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`;
        card.style.animationDelay = `${index * 0.08}s`; 
    });

    // ลบคลาส Grid Fade Out ของเก่าออก (เพื่อให้แสดงผลได้)
    grid.classList.remove('grid-fade-out');

    // 5. วาดปุ่มเปลี่ยนหน้า
    if(paginationDiv) renderPagination(totalPages);
}

// ฟังก์ชันสร้างปุ่ม 1, 2, 3...
function renderPagination(totalPages) {
    const paginationDiv = document.getElementById('paginationControls');
    let buttonsHTML = '';

    // ปุ่มย้อนกลับ
    buttonsHTML += `
        <button onclick="changePage(${currentPage - 1})" 
        ${currentPage === 1 ? 'disabled' : ''} class="page-btn">
        <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;

    // ปุ่มตัวเลข (แสดงแบบย่อ)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        buttonsHTML += `<button onclick="changePage(1)" class="page-btn">1</button>`;
        if (startPage > 2) buttonsHTML += `<span style="color:white; align-self:center;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        buttonsHTML += `<button onclick="changePage(${i})" class="page-btn ${activeClass}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) buttonsHTML += `<span style="color:white; align-self:center;">...</span>`;
        buttonsHTML += `<button onclick="changePage(${totalPages})" class="page-btn">${totalPages}</button>`;
    }

    // ปุ่มถัดไป
    buttonsHTML += `
        <button onclick="changePage(${currentPage + 1})" 
        ${currentPage === totalPages ? 'disabled' : ''} class="page-btn">
        <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    paginationDiv.innerHTML = buttonsHTML;
}

// แก้ไขฟังก์ชันเปลี่ยนหน้า (เพิ่มหน่วงเวลาให้ Animation เล่นจบก่อน)
function changePage(newPage) {
    const grid = document.getElementById('memberGrid');

    // 1. สั่งให้ตารางเฟดออก (Fade Out) ก่อนเปลี่ยนหน้า
    // (เราใช้ Fade Out แบบรวม เพื่อเคลียร์หน้าจอ)
    grid.classList.add('grid-fade-out');

    // 2. รอ 0.3 วินาที ให้ภาพจางหายไปก่อน ค่อยโหลดข้อมูลใหม่
    setTimeout(() => {
        currentPage = newPage;
        renderMembers(); // โหลดใหม่ -> การ์ดจะเด้งขึ้นมาทีละใบ
        
        // เลื่อนจอขึ้นบนสุดของตารางแบบนุ่มนวล
        document.getElementById('memberPage').scrollIntoView({ behavior: 'smooth' });
    }, 300); 
}

// 6. ADD MEMBER
function addNewMember() {
    const name = document.getElementById('newMemberName').value;
    const fb = document.getElementById('newMemberFB').value;
    const type = document.getElementById('newMemberGroup').value;
    const imgUrl = document.getElementById('newMemberImg').value;

    if(name) {
        db.ref('members').push({
            name: name,
            fb: fb || "#",
            type: type,
            img: imgUrl || "image/newlogo.png"
        }, (error) => {
            if (error) {
                showToast("เกิดข้อผิดพลาด: " + error.message, "error");
            } else {
                showToast(`เพิ่มคุณ ${name} แล้ว`, "success");
                document.getElementById('newMemberName').value = "";
                document.getElementById('newMemberFB').value = "";
                document.getElementById('newMemberImg').value = "";
            }
        });
    } else {
        showToast("กรุณาใส่ชื่อ!", "error");
    }
}

// ฟังก์ชัน Bulk Import (สำหรับรายชื่อ 90+ คน)
function runBulkImport() {
    const rawData = document.getElementById('bulkInput').value;
    try {
        const dataArray = JSON.parse(rawData);
        if (!Array.isArray(dataArray)) {
            showToast("รูปแบบข้อมูลผิด (ต้องเป็น Array)", "error");
            return;
        }
        if (!confirm(`ยืนยันจะเพิ่มสมาชิก ${dataArray.length} คน?`)) return;

        let count = 0;
        dataArray.forEach(person => {
            if (person.name) {
                db.ref('members').push({
                    name: person.name,
                    type: person.type || "DERECK",
                    fb: person.fb || "#",
                    img: person.img || "image/newlogo.png"
                });
                count++;
            }
        });
        showToast(`นำเข้าสำเร็จ ${count} คน!`, "success");
        document.getElementById('bulkInput').value = "";
    } catch (e) {
        showToast("JSON ผิดพลาด เช็คโค้ดดีๆ", "error");
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
                <h3 style="color:#fff; margin-bottom:10px;">ยืนยันการลบ?</h3>
                <p style="color:#aaa; margin-bottom:20px;">ต้องการลบ <strong>${member.name}</strong> ใช่ไหม?</p>
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
            .catch((error) => {
                showToast("ลบไม่ได้: " + error.message, "error");
            });
    }
}

// 8. NAVIGATION & UI HELPERS
function enterSite() {
    const landing = document.getElementById('landingPage');
    const mainNav = document.getElementById('mainNav');
    const memberPage = document.getElementById('memberPage');

    // 1. หน้า Landing ค่อยๆ จางหายไป
    landing.style.opacity = '0';
    landing.style.visibility = 'hidden'; 

    // 2. รอ 0.8 วินาที แล้วโชว์หน้าเนื้อหา
    setTimeout(() => {
        landing.style.display = 'none';
        
        mainNav.style.display = 'block';
        memberPage.style.display = 'block';
        
        // ปลดล็อก Scroll
        document.body.classList.remove('locked');
        
        // บังคับให้เล่น Animation Fade In ของ CSS ใหม่
        memberPage.style.animation = 'none';
        memberPage.offsetHeight; /* trigger reflow */
        memberPage.style.animation = 'fadeIn 0.8s forwards';
        
    }, 800);
}

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(pageId === 'memberPage') document.getElementById('nav-mem').classList.add('active');
    if(pageId === 'adminPage') document.getElementById('nav-adm').classList.add('active');
}

function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMembers();
}

function handleAuth(e) {
    e.preventDefault();
    const uInput = document.getElementById('userInp').value;
    const pInput = document.getElementById('passInp').value;
    
    const uCheck = btoa(uInput);
    const pCheck = btoa(pInput);

    const foundAdmin = ADMINS.find(admin => admin.u === uCheck && admin.p === pCheck);

    if(foundAdmin) {
        isAdmin = true;
        document.getElementById('loginFormSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        showToast("ยินดีต้อนรับ Admin", "success");
        renderMembers();
    } else {
        showToast("จะแอบอ้างหรอไอสัส!", "error");
    }
}

function handleLogout() {
    isAdmin = false;
    document.getElementById('loginFormSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('userInp').value = "";
    document.getElementById('passInp').value = "";
    showToast("ออกจากระบบแล้ว", "success");
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