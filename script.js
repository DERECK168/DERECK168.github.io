const items = document.querySelectorAll("[data-speed]");
const bg = document.getElementById("bg");
const bga = document.querySelector(".bg-layer");

let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX - window.innerWidth / 2;
  mouseY = e.clientY - window.innerHeight / 2;
});

function animate() {
  // Smooth follow
  currentX += (mouseX - currentX) * 0.04;
  currentY += (mouseY - currentY) * 0.04;

  // Background (ช้ามาก)
  bg.style.transform = `
    translate(
      ${-currentX / 90}px,
      ${-currentY / 90}px
    )
  `;

  // Foreground elements
  items.forEach(el => {
    const speed = el.dataset.speed;
    el.style.transform = `
      translate(
        ${currentX * speed / 320}px,
        ${currentY * speed / 320}px
      )
    `;
  });

  requestAnimationFrame(animate);
}

animate();

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  bg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
});