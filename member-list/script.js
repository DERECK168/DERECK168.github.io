const cardsPerPage = 10;
let currentPage = 1;
let cards = Array.from(document.querySelectorAll(".card"));
let filteredCards = [...cards]; // การ์ดที่กรองแล้ว
const pageInfo = document.getElementById("pageInfo");

// แสดงหน้าเฉพาะการ์ดที่ถูกกรอง
function showPage(page) {
    currentPage = page;
    const start = (page - 1) * cardsPerPage;
    const end = start + cardsPerPage;

    cards.forEach(card => card.style.display = "none");
    filteredCards.slice(start, end).forEach(card => card.style.display = "flex");

    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    pageInfo.innerText = `หน้า ${currentPage} / ${totalPages}`;

    applyAnimation();    // feed ซ้าย→ขวา
    applyHoverEffect();  // hover เด้ง
}

function nextPage() {
    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
    if (currentPage < totalPages) {
        showPage(currentPage + 1);
    }
}

function prevPage() {
    if (currentPage > 1) {
        showPage(currentPage - 1);
    }
}

// Animation เฉพาะการ์ดที่ visible
function applyAnimation() {
    const visibleCards = filteredCards.filter(card => card.style.display !== 'none');

    visibleCards.forEach((card, index) => {
        // Reset animation ก่อน
        card.style.opacity = 0;
        card.style.transform = "translateX(-30px)";
        
        // Apply feed-in animation
        card.style.animation = 'none';
        card.offsetHeight; // Reset animation
        card.style.animation = `fadeLeft 0.5s ease forwards`;
        card.style.animationDelay = `${index * 0.05}s`; // delay ต่างกัน
    });
}


// Hover effect ให้เด้งขึ้น
function applyHoverEffect() {
    const visibleCards = filteredCards.filter(card => card.style.display !== 'none');

    visibleCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-15px) scale(1.08)";
            card.style.boxShadow = "0 25px 50px rgba(0,0,0,0.7), inset 0 0 15px rgba(255,255,255,0.05)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0) scale(1)";
            card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)";
        });
    });
}

// Search + filter
function filterMembers() {
    const input = document.getElementById("search").value.toLowerCase();

    filteredCards = cards.filter(card => {
        const name = card.querySelector("span").innerText.toLowerCase();
        return name.includes(input);
    });

    currentPage = 1; // กลับไปหน้าหลัก
    showPage(currentPage);
}

// คัดลอกชื่อ
function copyText(text) {
    navigator.clipboard.writeText(text);

    const notification = document.createElement("div");
    notification.textContent = "ชื่อเฟสถูกคัดลอกแล้ว!";
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.padding = "10px 20px";
    notification.style.backgroundColor = "#4CAF50";
    notification.style.color = "white";
    notification.style.borderRadius = "5px";
    notification.style.zIndex = "1000";
    notification.style.fontSize = "16px";

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// โหลดหน้าแรก
showPage(1);
