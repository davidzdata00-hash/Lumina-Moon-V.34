/* =========================================
   LUMINA SHABU - CORE SYSTEM (js/app.js)
   Updated: Fixed Admin & Order Logic
========================================= */

// ⚠️ สำคัญมาก: เปลี่ยน Link นี้เป็นอันล่าสุดที่คุณเพิ่ง Deploy New Version
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbym7JvkK8GzTeyZ_By8a0Hh0qupyR0mDbX869jwaBsBHMlM44f_TSaCSvh04RcA-iIR/exec'; 

// --- ส่วนของการทำงานอัตโนมัติเมื่อเปิดหน้าเว็บ (Auto Run) ---
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname;

    // เช็คว่าอยู่หน้าไหน ให้รันฟังก์ชันหน้านั้น
    if (page.includes('admin.html')) {
        renderAdmin(); // เรียกดึงข้อมูลทันที
        setInterval(renderAdmin, 30000); // (Option) ดึงใหม่ทุก 30 วิ
    } 
    else if (page.includes('order.html')) {
        // ถ้ามีฟังก์ชันโหลดเมนู ให้เรียกตรงนี้
        // loadMenuData(); 
    }
    else if (page.includes('track.html')) {
        // loadQueue();
    }
    
    // เอฟเฟกต์กลีบดอกไม้ (ถ้ามี div)
    initPetals();
});

/* =========================
    🔐 LOGIN / LOGOUT
========================= */
function login() {
  const name = document.getElementById("name")?.value.trim();
  const cls = document.getElementById("classroom")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const code = document.getElementById("code")?.value.trim();

  if (!name || !cls || !phone) {
    alert("กรอกข้อมูลให้ครบ");
    return;
  }

  // เช็ค Code ลับสำหรับ Admin
  const role = code === "Luonotar" ? "admin" : "user";
  
  sessionStorage.setItem("role", role);
  sessionStorage.setItem("name", name);
  sessionStorage.setItem("classroom", cls);

  // เปลี่ยนหน้า
  location.href = role === "admin" ? "admin.html" : "menu.html";
}

function logout() {
  if(confirm("ต้องการออกจากระบบ?")) {
      sessionStorage.clear();
      location.href = "index.html";
  }
}

/* =========================
    🍱 MENU & NAVIGATION
========================= */
function goOrder(set) {
  localStorage.setItem("selectedSet", set);
  location.href = "order.html";
}

/* =========================
    🧑‍💼 ADMIN DASHBOARD
========================= */
function renderAdmin() {
  const adminList = document.getElementById("adminList");
  if (!adminList) return; // ถ้าไม่มีกล่องแสดงผล ให้จบการทำงาน (กัน Error หน้าอื่น)

  // แสดงสถานะ Loading...
  // adminList.innerHTML = "<p style='text-align:center; margin-top:20px;'>⏳ กำลังโหลดข้อมูล...</p>";

  fetch(SCRIPT_URL)
    .then(res => res.json())
    .then(orders => {
        // --- 1. สรุปยอดเงินและจำนวน ---
        // แปลง price เป็นตัวเลข (กันข้อมูลขยะ)
        const totalIncome = orders
            .filter(o => o.status !== 'pending' && o.status !== 'cancel')
            .reduce((sum, o) => sum + (parseInt(o.price) || 0), 0);
            
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'done').length;

        // --- 2. สร้าง HTML ส่วนสรุป ---
        let html = `
            <div class="card" style="background: white; border: none; margin-bottom: 20px; padding: 15px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div><small style="color: #888;">รายได้ (฿)</small><div style="font-size: 1.5rem; font-weight: bold; color: #2ecc71;">${totalIncome.toLocaleString()}</div></div>
                    <div style="width: 1px; background: #eee;"></div>
                    <div><small style="color: #888;">เสร็จสิ้น</small><div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${completedOrders}/${totalOrders}</div></div>
                </div>
            </div>
        `;

        if (orders.length === 0) {
            adminList.innerHTML = html + "<p style='text-align:center; color:#666; margin-top:20px;'>ยังไม่มีออเดอร์ในระบบ</p>";
            return;
        }

        // --- 3. สร้างการ์ดออเดอร์ (เรียงจากใหม่สุดไปเก่า) ---
        html += orders.slice().reverse().map(o => `
            <div class="admin-card ${o.status}" id="card-${o.id}" style="background:rgba(255,255,255,0.1); margin-bottom:15px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.2);">
                <div class="admin-header" style="padding:10px; background:rgba(0,0,0,0.2); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-size:0.8rem; opacity:0.7;">🕒 ${o.orderTime}</span>
                        <div style="font-weight:bold; font-size:1.1rem;">${o.name} <small>(${o.cls})</small></div>
                    </div>
                    <span class="status-badge" style="padding:4px 8px; border-radius:4px; font-size:0.8rem; background:${getStatusColor(o.status)}; color:white;">
                        ${o.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="admin-body" style="padding:10px;">
                    <div style="margin-bottom:5px;"><strong>ชุด:</strong> ${o.set} | <strong>ซุป:</strong> ${o.soup}</div>
                    <div style="font-size:0.9rem; color:#ddd; margin-bottom:5px;"><strong>+</strong> ${o.toppings || "-"}</div>
                    <div style="text-align:right; font-weight:bold; color:#ffd700;">ยอดรวม: ${o.price} บาท</div>
                </div>

                <div class="status-actions" style="display:flex; gap:5px; padding:10px; border-top:1px solid rgba(255,255,255,0.1);">
                    <button onclick="updateStatus('${o.id}', 'cooking')" style="flex:1; background:#ffc107; border:none; padding:8px; border-radius:5px; cursor:pointer;">🔥 ทำ</button>
                    <button onclick="updateStatus('${o.id}', 'done')" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">✅ เสร็จ</button>
                    <button onclick="updateStatus('${o.id}', 'cancel')" style="flex:1; background:#dc3545; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">❌ ยกเลิก</button>
                </div>
                
                ${o.slip ? `<div style="padding:10px; text-align:center; background:white;"><a href="${o.slip}" target="_blank" style="color:#007bff; text-decoration:none;">ดูสลิปโอนเงิน 📄</a></div>` : ''}
            </div>
        `).join("");

        adminList.innerHTML = html;
    })
    .catch(err => {
        console.error("Fetch Error:", err);
        // adminList.innerHTML = "<p style='color:red; text-align:center;'>โหลดข้อมูลไม่สำเร็จ (โปรดเช็ค Console)</p>";
    });
}

// ฟังก์ชันช่วยเลือกสีป้ายสถานะ
function getStatusColor(status) {
    if(status === 'cooking') return '#ffc107'; // เหลือง
    if(status === 'done') return '#28a745';    // เขียว
    if(status === 'cancel') return '#dc3545';  // แดง
    return '#6c757d'; // เทา (pending)
}

function updateStatus(id, newStatus) {
    const card = document.getElementById(`card-${id}`);
    if(card) card.style.opacity = "0.5";

    if(!confirm(`ยืนยันเปลี่ยนสถานะเป็น "${newStatus}" ?`)) {
        if(card) card.style.opacity = "1";
        return;
    }

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "updateStatus", id: id, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if(data.result === "success") {
            renderAdmin(); 
        } else {
            alert("หา ID ไม่เจอ หรือ ID ผิดพลาด");
            if(card) card.style.opacity = "1";
        }
    })
    .catch(err => {
        alert("เชื่อมต่อไม่ได้ (เช็คเน็ต หรือ URL)");
        if(card) card.style.opacity = "1";
    });
}

/* =========================
    🌸 VISUAL EFFECTS
========================= */
function initPetals() {
  const petalContainer = document.querySelector(".petal-container");
  if (petalContainer) {
    setInterval(() => {
      const p = document.createElement("div");
      p.className = "petal";
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = 8 + Math.random() * 6 + "s";
      petalContainer.appendChild(p);
      setTimeout(() => p.remove(), 15000);
    }, 600);
  }
}