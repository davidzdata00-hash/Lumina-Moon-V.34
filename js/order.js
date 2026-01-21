// ประกาศตัวแปรคำทำนาย (Moonlight Fortune) 🌙
const FORTUNES = [
    "🌙 ดวงจันทร์กระซิบว่า... รสชาติมื้อนี้จะตราตรึงใจคุณไปอีกนาน",
    "🕊️ นกพิราบขาวทำนายว่า... เกรด 4 วิชาถัดไปกำลังรอคุณอยู่",
    "✨ แสงดาวส่องนำทาง... วันนี้คุณอาจได้เจอคนที่แอบปลื้มที่ร้านนี้นะ",
    "🌑 ในความมืดมิด... ชาบูถ้วยนี้จะเป็นแสงสว่างแห่งความอร่อยให้คุณ",
    "🌟 พรจากลูมิน่า... การงานราบรื่น การเรียนรุ่งโรจน์ ศัตรูพ่ายแพ้",
    "❄️ ความเย็นยะเยือกของเหมันต์... ไม่อาจต้านทานความร้อนแรงของน้ำซุปถ้วยนี้ได้",
    "🎭 หน้ากากแห่งความลับบอกว่า... คุณคือผู้ถูกเลือกให้ได้รับความอร่อยนี้"
];

// ประกาศตัวแปรระบบ
let SETS = {};
let TOPPINGS_SET = [];
let TOPPINGS_CUP = [];

const SOUPS = [
  { name:"น้ำใส", price:0 },
  { name:"น้ำดำ", price:0 },
  { name:"หมาล่า 🌶️", price:15 }
];

let currentSet, total = 0;
let selectedSoup = { name:"น้ำใส", price:0 };
let selectedToppings = {};

// 🔴🔴 ใส่ URL Google Script ของคุณที่นี่ 🔴🔴
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbym7JvkK8GzTeyZ_By8a0Hh0qupyR0mDbX869jwaBsBHMlM44f_TSaCSvh04RcA-iIR/exec';

document.addEventListener("DOMContentLoaded", () => {
    // ⚡ 1. โหลดจาก Cache ก่อน
    const cachedData = localStorage.getItem("menuData");
    if (cachedData) {
        console.log("🚀 โหลดจาก Cache (เร็ว)");
        const data = JSON.parse(cachedData);
        SETS = data.sets;
        TOPPINGS_SET = data.toppings_set;
        TOPPINGS_CUP = data.toppings_cup;
        initPage();
    } else {
        const setDetailEl = document.getElementById("setDetail");
        if(setDetailEl) setDetailEl.innerText = "⏳ กำลังดึงเมนูล่าสุด...";
    }

    // 🌐 2. โหลดข้อมูลจริงจาก Google Sheets
    fetch(SCRIPT_URL + "?type=menu")
    .then(res => res.json())
    .then(data => {
        console.log("🌐 โหลดจาก Sheet เสร็จแล้ว");
        localStorage.setItem("menuData", JSON.stringify(data));
        SETS = data.sets;
        TOPPINGS_SET = data.toppings_set;
        TOPPINGS_CUP = data.toppings_cup;
        initPage();
    })
    .catch(err => {
        console.error("โหลดข้อมูลไม่สำเร็จ", err);
        if (!cachedData) alert("โหลดเมนูไม่ได้ กรุณาเช็คอินเทอร์เน็ต");
    });
});

function initPage() {
  const key = localStorage.getItem("selectedSet");
  if (!SETS || !SETS[key]) return; 

  currentSet = SETS[key];
  total = parseInt(currentSet.price);

  const setNameEl = document.getElementById("setName");
  if(setNameEl) setNameEl.innerHTML = `<option>${currentSet.name}</option>`;
  
  const setDetailEl = document.getElementById("setDetail");
  if(setDetailEl) setDetailEl.innerText = currentSet.detail + ` (ราคาเริ่มต้น ${currentSet.price}.-)`;

  renderSoups();

  // เลือกท็อปปิ้งตามประเภท
  if (key.includes("CUP")) {
      renderToppings(TOPPINGS_CUP); 
  } else {
      renderToppings(TOPPINGS_SET); 
  }

  updateTotal();
  
  const btn = document.getElementById("openBillBtn");
  if(btn) {
      btn.onclick = (e) => { e.preventDefault(); openBill(); };
  }
}

function renderSoups() {
  const soupContainer = document.getElementById("soupGroup");
  if(!soupContainer) return;
  soupContainer.innerHTML = ""; 

  SOUPS.forEach((s, index) => {
    let price = s.name.includes("หมาล่า") && currentSet.name.includes("Full") ? 0 : s.price;
    const l = document.createElement("label");
    l.className = "topping"; 
    l.innerHTML = `<input type="radio" name="soup" ${index===0?'checked':''}> <span>${s.name} ${price>0?`(+${price})`:'(ฟรี)'}</span>`;
    l.onclick = () => {
      document.querySelectorAll('#soupGroup .topping').forEach(el => el.classList.remove('active'));
      l.classList.add('active');
      total -= selectedSoup.price;
      selectedSoup = { name: s.name, price };
      total += price;
      updateTotal();
    };
    if(index === 0) l.click();
    soupContainer.appendChild(l);
  });
}

function renderToppings(toppingList) {
  const toppingContainer = document.getElementById("toppingGroup");
  if(!toppingContainer) return;
  toppingContainer.innerHTML = ""; 

  if (!toppingList || toppingList.length === 0) {
      toppingContainer.innerHTML = "<p style='color:#ccc; text-align:center; width:100%;'>เมนูนี้ไม่มีท็อปปิ้งเพิ่มเติม</p>";
      return;
  }

  toppingList.forEach(t => {
    selectedToppings[t.name] = { ...t, qty:0 };
    const d = document.createElement("div");
    d.className = "topping"; 
    d.innerHTML = `<span>${t.name} (+${t.price})</span><div class="qty-control"><button class="minus">-</button><span class="qty">0</span><button class="plus">+</button></div>`;
    const qtySpan = d.querySelector(".qty");
    
    d.querySelector(".plus").onclick = (e) => {
        e.stopPropagation(); selectedToppings[t.name].qty++;
        qtySpan.innerText = selectedToppings[t.name].qty;
        total += parseInt(t.price); d.classList.add('active'); updateTotal();
    };
    d.querySelector(".minus").onclick = (e) => {
        e.stopPropagation();
        if (selectedToppings[t.name].qty > 0) {
            selectedToppings[t.name].qty--;
            qtySpan.innerText = selectedToppings[t.name].qty;
            total -= parseInt(t.price);
            if(selectedToppings[t.name].qty === 0) d.classList.remove('active');
            updateTotal();
        }
    };
    toppingContainer.appendChild(d);
  });
}

function updateTotal() { 
    const el = document.getElementById("totalPrice");
    if(el) el.innerText = total; 
}

function openBill() {
  let toppingText = "";
  Object.values(selectedToppings).forEach(t => { if(t.qty > 0) toppingText += `<br>+ ${t.name} x${t.qty}`; });
  document.getElementById("billDetail").innerHTML = `<p><b>${currentSet.name}</b></p><p>ซุป: ${selectedSoup.name}</p><p style="font-size:0.9rem; color:#666">${toppingText || "ไม่มีท็อปปิ้งเพิ่ม"}</p>`;
  document.getElementById("billTotal").innerText = total;
  document.getElementById("billModal").style.display = "flex";
}

function closeBill() { document.getElementById("billModal").style.display = "none"; }

// ✅ ฟังก์ชันส่งออเดอร์พร้อมคำทำนาย
function submitOrder() {
  const fileInput = document.getElementById("slipInput");
  const submitBtn = document.querySelector(".pay-action"); 
  if (!fileInput.files[0]) return alert("กรุณาแนบสลิปโอนเงินก่อนครับ");
  if(submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = "⏳ กำลังส่งข้อมูล..."; }

  let toppingDetailsStr = "";
  Object.values(selectedToppings).forEach(t => { if(t.qty > 0) toppingDetailsStr += `${t.name} x${t.qty}, `; });
  toppingDetailsStr = toppingDetailsStr === "" ? "-" : toppingDetailsStr.slice(0, -2);

  const reader = new FileReader();
  reader.readAsDataURL(fileInput.files[0]);
  reader.onload = function () {
    const img = new Image();
    img.src = reader.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 800;
      const scale = maxWidth / img.width;
      canvas.width = img.width > maxWidth ? maxWidth : img.width;
      canvas.height = img.width > maxWidth ? img.height * scale : img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const newOrder = {
          id: Date.now(),
          orderTime: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          name: sessionStorage.getItem("name") || "ไม่ระบุชื่อ",
          cls: sessionStorage.getItem("classroom") || "-",
          set: currentSet.name,
          soup: selectedSoup.name,
          toppings: toppingDetailsStr,
          price: total,
          slip: canvas.toDataURL('image/jpeg', 0.7)
      };

      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(newOrder) })
      .then(() => { 
          // 🔥 สุ่มคำทำนาย
          const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
          
          // 🔥 สร้าง Modal คำทำนายแบบ HTML
          const modal = document.createElement("div");
          modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:20px; color:white; animation: fadeIn 0.5s;";
          modal.innerHTML = `
            <div style="font-size:4rem; margin-bottom:20px; animation: float 3s infinite ease-in-out;">🌙✨</div>
            <h2 style="color:#a8c0ff; margin-bottom:15px; font-family:'Sarabun';">สั่งอาหารสำเร็จ!</h2>
            <div style="background:rgba(255,255,255,0.1); padding:20px; border-radius:15px; border:1px solid #a8c0ff; max-width:300px; margin-bottom:30px;">
                <p style="font-size:1.1rem; line-height:1.6; margin:0;">"${fortune}"</p>
            </div>
            <button id="closeFortuneBtn" style="background:white; color:black; border:none; padding:12px 35px; border-radius:50px; font-weight:bold; cursor:pointer; font-size:1rem; box-shadow:0 0 15px rgba(255,255,255,0.5);">รับพรแห่งดวงดาว</button>
            <style>
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            </style>
          `;
          document.body.appendChild(modal);
          
          // พอกดรับพร ค่อยกลับหน้าเมนู
          document.getElementById("closeFortuneBtn").onclick = () => {
              location.href = "menu.html";
          };
      })
      .catch((err) => { 
          console.error(err);
          alert("เกิดข้อผิดพลาดในการส่งข้อมูล"); 
          if(submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = "✅ ยืนยันการชำระเงิน";
          }
      });
    };
  };
}