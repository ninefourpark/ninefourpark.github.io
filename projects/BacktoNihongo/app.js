let cards = [];
let currentCard = null;

const ALLOWED_USERS = [
  "adalin",
  "hasse",
  "keoni"
];

const VISITOR_NAME = "visitor";

const storedCards = localStorage.getItem("cards");

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || "").trim();
    });
    return obj;
  });
}

function setGoogleSheetLink() {
  const googleSheetLink = document.getElementById("googleSheetLink").value.trim();
  if (!googleSheetLink) {
    alert("请输入有效的 Google Sheet 链接！");
    return;
  }
  localStorage.setItem("googleSheetLink", googleSheetLink);
  alert("Google Sheet 链接已保存！");
}

function fetchCardsFromGoogle(merge = false) {
  const googleSheetLink = localStorage.getItem("googleSheetLink");
  if (!googleSheetLink) {
    alert("请先保存您的 Google Sheet 链接。");
    return;
  }

  return fetch(googleSheetLink)
    .then(res => res.text())
    .then(csv => {
      const rawCards = parseCSV(csv);

      const googleIds = rawCards.map(c => c.id);
      localStorage.setItem("googleCardIds", JSON.stringify(googleIds));

      const savedStatus =
        JSON.parse(localStorage.getItem("cardStatus") || "{}");

      const newCards = rawCards.map(c => ({
        id: c.id,
        zh: c.zh,
        ja: c.ja,
        note: c.note || "",
        source: c.source || "未知",
        status: savedStatus[c.id]?.status || "new",
        count: savedStatus[c.id]?.count || 0
      }));

      cards = newCards;
      if (merge) {
        // 合并之前的卡片进度
        cards = mergeCards(cards);
      }

      saveCards();
      loadCard();
    })
    .catch(error => {
      console.error("加载 Google Sheet 数据时出错：", error);
      alert("加载 Google Sheet 数据失败，请检查链接是否有效！");
    });
}

function mergeCards(newCards) {
  // 获取当前本地的卡片数据
  const existingCards = JSON.parse(localStorage.getItem("cards") || "[]");

  // 使用 Map 合并数据，优先保留新数据
  const mergedMap = new Map();

  existingCards.forEach(card => {
    mergedMap.set(card.id, card);
  });

  newCards.forEach(card => {
    mergedMap.set(card.id, card);
  });

  return Array.from(mergedMap.values());
}

if (storedCards) {
  cards = JSON.parse(storedCards);
  loadCard();
} else {
  fetchCardsFromGoogle();
}

// 「刷新卡片」按钮
function refreshCards() {
  fetchCardsFromGoogle(true);
}

function saveStatus() {
  const map = {};
  cards.forEach(c => {
    map[c.id] = {
      status: c.status,
      count: c.count
    };
  });
  localStorage.setItem("cardStatus", JSON.stringify(map));
}


function nextCard() {
  currentCard = null;
  loadCard();
}


function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) return;

  const isVisitor = name === VISITOR_NAME;
  const isAllowed = ALLOWED_USERS.includes(name);

  if (!isVisitor && !isAllowed) {
    alert("该用户名未被允许使用此系统。");
    return;
  }

  localStorage.setItem("user", name);
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  const label = isVisitor ? "使用者：visitor（体验模式）" : `使用者：${name}`;
  document.getElementById("userLabel").textContent = label;

  loadCard();
}


function loadCard() {
  const zhElement = document.getElementById("zh");
  const jaElement = document.getElementById("ja");
  const noteElement = document.getElementById("note");
  const sourceElement = document.getElementById("source");

  // 检查每个必要的 DOM 元素是否存在
  if (!zhElement || !jaElement || !noteElement || !sourceElement) {
    console.error("Some elements are missing in the HTML.");
    return;
  }
  
  document.getElementById("result").classList.add("hidden");
  document.getElementById("note").classList.add("hidden");
  document.getElementById("ja").classList.add("hidden");
  document.getElementById("answer").value = "";
  document.getElementById("statusMessage").classList.add("hidden");
  document.getElementById("restartReviewBtn").classList.add("hidden");


// 从 localStorage 获取 cards 数据
  cards = JSON.parse(localStorage.getItem("cards")) || [];
  
  if (cards.length === 0) {
    alert("您的浏览器储存里还没有存放任何卡片。请点击右上角的“刷新卡片”按钮，将您 Google 表格中的卡片导入至浏览器存储。");
    return;
  }

  const mode = document.getElementById("modeSelect").value;

  const pool = cards.filter(c => {
    if (c.status === "disabled") return false;
    if (mode === "all") return true;
    return c.status === mode;
  });

  if (pool.length === 0) {
    let message = "";

    if (mode === "new") {
      message = "所有新卡已经练习完。";
    } else if (mode === "learned") {
  message = "所有旧卡已完成本轮复习。";
  document.getElementById("restartReviewBtn")
    .classList.remove("hidden");
} else {
  document.getElementById("restartReviewBtn")
    .classList.add("hidden");
}

    document.getElementById("statusMessage").textContent = message;
    document.getElementById("statusMessage").classList.remove("hidden");
    document.getElementById("zh").textContent = "";
    document.getElementById("source").textContent = "";

    currentCard = null;
    return;
  }

   // 随机选择一张卡片
  currentCard = pool[Math.floor(Math.random() * pool.length)];

  // 显示中文翻译
  zhElement.textContent = currentCard.zh;
  document.getElementById("cardMeta").textContent =
  `已练习 ${currentCard.count} 次`;

    // 显示来源
    if (currentCard.source) {
        sourceElement.textContent = `来源: ${currentCard.source}`;
        sourceElement.classList.remove("hidden");
    } else {
        sourceElement.classList.add("hidden");
    }
}

function submitAnswer() {
  if (!currentCard) return;

  const userAnswer = document.getElementById("answer").value;

  if (currentCard.status === "new") {
    currentCard.status = "learned";
  } else if (currentCard.status === "learned") {
    currentCard.status = "reviewed";
  }

  currentCard.count += 1;
  saveStatus();
  saveCards();


  // 显示笔记（如果有）
  if (currentCard.note) {
    document.getElementById("note").innerHTML =
      currentCard.note;
    document.getElementById("note").classList.remove("hidden");
  } 

  const text =
`您好，請您擔任我的日語老師，協助我學習日語的語法與詞語搭配。流程如下：我將提供原文日文以及我根據中文翻譯所做的日文回譯，請您對比【我的回譯】與【日文原文】，指出其中的差異。請您評估【我的回譯】是否「自然但略顯突兀」、「不太自然」、「有語法錯誤」或「完全正確但表達不同」。

【我的回译】
${userAnswer}

【日文原文】
${currentCard.ja}`;

document.getElementById("ja").textContent = currentCard.ja;
document.getElementById("ja").classList.remove("hidden");

document.getElementById("resultText").textContent = text;
  document.getElementById("result").classList.remove("hidden");
}


function restartReview() {
  cards.forEach(c => {
    if (c.status === "reviewed") {
      c.status = "learned";
    }
  });
  saveCards();
  saveStatus();
  loadCard();
}


function copyResult() {
  const text = document.getElementById("resultText").textContent;
  navigator.clipboard.writeText(text);
}

function disableCard() {
  if (!currentCard) return;
  currentCard.status = "disabled";
  saveStatus();
  saveCards();
  loadCard();
}

// 自动登录
const savedUser = localStorage.getItem("user");

if (
  savedUser &&
  (savedUser === VISITOR_NAME || ALLOWED_USERS.includes(savedUser))
) {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  const label =
    savedUser === VISITOR_NAME
      ? "使用者：visitor（体验模式）"
      : `使用者：${savedUser}`;

  document.getElementById("userLabel").textContent = label;
  loadCard();
} else {
  localStorage.removeItem("user");
}


function exportCSV() {
    const now = new Date(); const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, "0"); const day = String(now.getDate()).padStart(2, "0"); const hours = String(now.getHours()).padStart(2, "0"); const minutes = String(now.getMinutes()).padStart(2, "0"); const seconds = String(now.getSeconds()).padStart(2, "0"); const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  const headers = ["id", "zh", "ja", "note", "source", "status", "count"];
  const rows = cards.map(c =>
    [c.id, c.zh, c.ja, c.note, c.source, c.status, c.count].join(",")
  );

  const csv =
    headers.join(",") + "\n" +
    rows.join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `回译_${timestamp}.csv`;
  a.click();
}


function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const data = parseCSV(e.target.result);

    cards = data.map(c => ({
      id: c.id,
      zh: c.zh,
      ja: c.ja,
      note: c.note || "",
      source: c.source || "未知",
      status: c.status || "new",
      count: Number(c.count) || 0
    }));

    saveStatus();
    loadCard();
  };

  reader.readAsText(file);
}


function generateId(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function addCard() {
    if (localStorage.getItem("user") === "visitor") {
    alert("体验模式下无法使用此功能。");
    return;
    }


  const ja = document.getElementById("newJa").value.trim();
  const zh = document.getElementById("newZh").value.trim();
  const note = document.getElementById("newNote").value.trim();
const source = document.getElementById("newSource").value.trim();

  if (!ja || !zh) return;

  const newCard = {
    id: generateId(),
    ja,
    zh,
    note: "" + note,
    source: source || "未知", 
    status: "new",
    count: 0
  };

  cards.push(newCard);
  saveCards();
  saveStatus();

  // 清空输入框
  document.getElementById("newJa").value = "";
  document.getElementById("newZh").value = "";
  document.getElementById("newNote").value = "";
  document.getElementById("newSource").value = ""; 
  loadCard();
}

function copyNewCards() {
  const googleIds =
    JSON.parse(localStorage.getItem("googleCardIds") || "[]");

  const googleIdSet = new Set(googleIds);

  const newCards = cards.filter(c => !googleIdSet.has(c.id));

  if (newCards.length === 0) {
    alert("没有新增的卡片可复制。");
    return;
  }

  const headers = ["id", "zh", "ja", "note", "source"];
  const rows = newCards.map(c =>
    [c.id, c.zh, c.ja, c.note, c.source].join(",")
  );

  const csvText = headers.join(",") + "\n" + rows.join("\n");

  navigator.clipboard.writeText(csvText).then(() => {
    alert(`已复制 ${newCards.length} 张卡片，可直接粘贴到 Google 表格。`);
  });
}


function saveCards() {
  localStorage.setItem("cards", JSON.stringify(cards));
}


document.addEventListener("keydown", (e) => {
  const active = document.activeElement;

  // Ctrl + Enter：提交答案 或 新增卡片
  if (e.ctrlKey && e.key === "Enter") {
    // 在新增卡片区
    if (active && active.id === "newNote") {
      addCard();
      e.preventDefault();
      return;
    }

    // 在答题区
    if (document.getElementById("answer")) {
      submitAnswer();
      e.preventDefault();
      return;
    }
  }

  // Ctrl + → ：下一张卡片
  if (e.ctrlKey && e.key === "ArrowRight") {
    const resultVisible =
      !document.getElementById("result").classList.contains("hidden");

    if (resultVisible) {
      nextCard();
      e.preventDefault();
    }
  }

  // Ctrl + C：复制结果（只在结果显示时）
  if (e.ctrlKey && e.key.toLowerCase() === "c") {
    const resultVisible =
      !document.getElementById("result").classList.contains("hidden");

    if (resultVisible) {
      copyResult();
      e.preventDefault();
    }
  }
});


function exportToClipboard() {
    if (localStorage.getItem("user") === "visitor") {
    alert("体验模式下无法使用此功能。");
    return;
    }

  const headers = ["id", "zh", "ja", "note", "source", "status", "count"];

  const rows = cards.map(c => [
    c.id,
    c.zh,
    c.ja,
    c.note || "",
    c.source || "",
    c.status,
    c.count
  ].join("\t"));

  const text = headers.join("\t") + "\n" + rows.join("\n");

  navigator.clipboard.writeText(text).then(() => {
    alert("已复制，可直接粘贴到 Google Sheet。");
  });
}
function importFromClipboard() {
    if (localStorage.getItem("user") === "visitor") {
    alert("体验模式下无法使用此功能。");
    return;
    }

  const text = document.getElementById("importArea").value.trim();
  if (!text) return;

  const lines = text.split("\n");
  const headers = lines.shift().split("\t");

  const index = {};
  headers.forEach((h, i) => index[h] = i);

  const imported = lines.map(line => {
    const cols = line.split("\t");
    return {
      id: cols[index.id] || generateId(),
      zh: cols[index.zh] || "",
      ja: cols[index.ja] || "",
      note: cols[index.note] || "",
      source: cols[index.source] || "",
      status: cols[index.status] || "new",
      count: Number(cols[index.count]) || 0
    };
  });

  // 合并逻辑：同 id 覆盖内容，不同 id 新增
  const map = new Map(cards.map(c => [c.id, c]));
  imported.forEach(c => map.set(c.id, c));

  cards = Array.from(map.values());

  saveCards();
  saveStatus();
  loadCard();

  document.getElementById("importArea").value = "";
  alert("导入完成。");
}

