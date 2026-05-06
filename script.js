/* ═══════════════════════════════════════════════════════════════════════════
   Minerva.io — script.js (COMPLETE)
   AI‑Powered Trading Analysis Platform
   All logic: chat, AI, auth, payments, credits, settings, news, charts
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ──────────────────────────────────────────────────────────────────────────
  // GLOBAL ERROR HANDLER (never kills the UI)
  // ──────────────────────────────────────────────────────────────────────────
  window.onerror = function (msg, src, line, col, err) {
    console.error("⚠️ Minerva caught:", msg, "at line", line, err);
    showToast("Something went wrong. The app is still running.");
    return true;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // UTILITY HELPERS
  // ──────────────────────────────────────────────────────────────────────────
  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.95);color:#e8e6e3;padding:10px 22px;border-radius:50px;z-index:9999;font-size:0.85rem;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(8px);pointer-events:none;";
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  function safeGetEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn("Minerva: element not found —", id);
    return el;
  }

  function bindClick(id, handler) {
    const el = safeGetEl(id);
    if (el) el.addEventListener("click", handler);
    else console.warn("Minerva: cannot bind click to", id);
  }

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  function validateSignup(username, password) {
    if (!username || username.length < 5)
      return "Username must be at least 5 characters.";
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
      return "Password: 8+ chars, 1 uppercase, 1 number.";
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SYMBOL MAPPING
  // ──────────────────────────────────────────────────────────────────────────
  const KEYWORD_MAP = {
    btc: "BTCUSDT", bitcoin: "BTCUSDT",
    eth: "ETHUSDT", ethereum: "ETHUSDT",
    sol: "SOLUSDT", solana: "SOLUSDT",
    gold: "XAUUSD", xau: "XAUUSD", xauusd: "XAUUSD",
    silver: "XAGUSD", oil: "USOIL", wti: "USOIL", crude: "USOIL",
    eur: "EURUSD", eurusd: "EURUSD",
    gbp: "GBPUSD", gbpusd: "GBPUSD",
    usdjpy: "USDJPY",
    apple: "AAPL", aapl: "AAPL",
    tesla: "TSLA", tsla: "TSLA",
    nvidia: "NVDA", msft: "MSFT",
    spx: "SPX", sp500: "SPX",
    usoil: "USOIL", dxy: "DXY", "dollar index": "DXY",
    nas100: "NAS100", us30: "US30"
  };

  const TIMEFRAME_MAP = {
    "1m": "1 Minute", "5m": "5 Minutes", "15m": "15 Minutes",
    "30m": "30 Minutes", "1h": "1 Hour", "4h": "4 Hours",
    "1d": "Daily", "1w": "Weekly"
  };

  const CRYPTO_ADDRESSES = {
    USDT_TRC20: "TNJozdHLTNmGUZHEKD623JMfro5aKQHiu3",
    USDT_BEP20: "0x103D279E8f691b98609D5A107f7BCbAd96a17C8d",
    BTC: "bc1q6sndxj968gsvmngew32yzu83jnmu4tefk0g7m8",
    ETH: "0x103D279E8f691b98609D5A107f7BCbAd96a17C8d",
    SOL: "FLMnnvuEAerTAWQizHB1AFtLcYbJvtYsYFpMi7aETuWY"
  };

  function detectSymbol(text) {
    const lower = (text || "").toLowerCase();
    for (const [k, v] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(k)) return v;
    }
    const patterns = [
      /XAU\/?USD/i, /EUR\/?USD/i, /GBP\/?USD/i, /USD\/?JPY/i,
      /BTC\/?USDT/i, /ETH\/?USDT/i, /SOL\/?USDT/i,
      /AAPL/i, /TSLA/i, /NVDA/i, /MSFT/i, /SPX/i, /USOIL/i, /DXY/i
    ];
    const symbols = [
      "XAUUSD", "EURUSD", "GBPUSD", "USDJPY",
      "BTCUSDT", "ETHUSDT", "SOLUSDT",
      "AAPL", "TSLA", "NVDA", "MSFT", "SPX", "USOIL", "DXY"
    ];
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i].test(text)) return symbols[i];
    }
    return null;
  }

  function isAnalysisRequest(text) {
    return /analyze|analysis|chart|setup|entry|price|target|trade|view|check|xauusd|btc|eth|sol|gold|oil|eurusd|aapl|tsla|nvda|spx/i.test(text || "");
  }

  function detectTimeframe(text) {
    for (const [k, v] of Object.entries(TIMEFRAME_MAP)) {
      if ((text || "").toLowerCase().includes(k)) return v;
    }
    return "1 Hour";
  }

  function mapSymbol(pair) {
    const m = {
      BTCUSDT: "BINANCE:BTCUSDT", ETHUSDT: "BINANCE:ETHUSDT",
      SOLUSDT: "BINANCE:SOLUSDT", XAUUSD: "OANDA:XAUUSD",
      XAGUSD: "OANDA:XAGUSD", EURUSD: "OANDA:EURUSD",
      GBPUSD: "OANDA:GBPUSD", USDJPY: "OANDA:USDJPY",
      AAPL: "NASDAQ:AAPL", TSLA: "NASDAQ:TSLA",
      NVDA: "NASDAQ:NVDA", MSFT: "NASDAQ:MSFT",
      SPX: "SP:SPX", USOIL: "TVC:USOIL", DXY: "TVC:DXY"
    };
    return m[pair] || "BINANCE:BTCUSDT";
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  const USERS_KEY = "minerva_users";
  const CURRENT_USER_KEY = "minerva_currentUser";
  const COOLDOWN_MS = 5000;
  const NEWS_API_KEY = "pub_641995e8a0a82e4cb8eec91b5d3a8b092ba07"; // ⚠️ Replace with your own NewsData.io key

  let appState = null;
  let currentAuthMode = "login";
  let lastMessageTime = 0;
  let isAITyping = false;
  let typewriterInterval = null;
  let paymentMode = null;
  let selectedTier = null;
  let selectedPaymentMethod = null;
  let paymentTimerInterval = null;
  let goldPrice = null;

  function loadUserState(email) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    if (!users[email]) {
      users[email] = {
        password: "",
        tier: "free",
        credits: 46,
        creditDate: new Date().toDateString(),
        chatHistory: [],
        theme: "dark",
        language: "en",
        username: email.split("@")[0]
      };
    }
    const s = users[email];
    const today = new Date().toDateString();
    if (s.creditDate !== today) {
      s.creditDate = today;
      s.credits = getDailyCredits(s.tier);
    }
    return s;
  }

  function saveUserState(email, state) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    users[email] = state;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadCurrentUser() {
    const email = localStorage.getItem(CURRENT_USER_KEY);
    if (!email) { appState = null; return false; }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    if (!users[email]) { appState = null; localStorage.removeItem(CURRENT_USER_KEY); return false; }
    appState = loadUserState(email);
    appState.email = email;
    return true;
  }

  function isLoggedIn() {
    return !!localStorage.getItem(CURRENT_USER_KEY) && appState && appState.email;
  }

  function getDailyCredits(t) {
    return t === "pro" ? 130 : t === "businessman" ? 257 : 46;
  }

  function getTierPrice(t) {
    return t === "pro" ? 12.99 : t === "businessman" ? 35.99 : 0;
  }

  function getTierFeatures(t) {
    return t === "pro"
      ? ["Multi‑timeframe", "Custom indicators", "Deeper reasoning", "~10 analyses/day"]
      : t === "businessman"
        ? ["Orderflow simulation", "Liquidity zones", "Volume analysis", "Smart money logic", "~21 analyses/day"]
        : ["Support/Resistance", "RSI & MA", "Basic structure", "~3 analyses/day"];
  }

  function saveState() {
    if (appState && appState.email) {
      appState.creditDate = new Date().toDateString();
      const copy = { ...appState };
      delete copy.email;
      saveUserState(appState.email, copy);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRICE FETCHING (Binance + fallback)
  // ──────────────────────────────────────────────────────────────────────────
  async function getSafePrice(symbol) {
    if (!symbol) return { price: 100, source: "fallback" };

    // Gold via metals.live
    if (symbol === "XAUUSD") {
      if (!goldPrice) {
        try {
          const r = await fetch("https://api.metals.live/v1/spot");
          if (r.ok) {
            const d = await r.json();
            const g = Array.isArray(d) ? d.find(function (i) { return i.gold; }) : null;
            if (g && g.gold) {
              goldPrice = parseFloat(g.gold);
              return { price: goldPrice, source: "live" };
            }
          }
        } catch (e) { console.warn("metals.live failed"); }
        goldPrice = 2650;
        return { price: goldPrice, source: "estimated" };
      }
      return { price: goldPrice, source: "live" };
    }

    // Crypto via Binance
    const cryptoPairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "BTCUSD", "ETHUSD", "SOLUSD"];
    if (cryptoPairs.includes(symbol)) {
      try {
        const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=" + symbol);
        if (r.ok) {
          const d = await r.json();
          const p = parseFloat(d.price);
          if (p > 0) return { price: p, source: "live" };
        }
      } catch (e) { console.warn("Binance failed for", symbol); }
      // CoinGecko fallback
      const cgId = { BTCUSDT: "bitcoin", BTCUSD: "bitcoin", ETHUSDT: "ethereum", ETHUSD: "ethereum", SOLUSDT: "solana", SOLUSD: "solana" }[symbol];
      if (cgId) {
        try {
          const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=" + cgId + "&vs_currencies=usd");
          if (r.ok) {
            const d = await r.json();
            if (d[cgId] && d[cgId].usd) return { price: parseFloat(d[cgId].usd), source: "fallback" };
          }
        } catch (e) { console.warn("CoinGecko failed for", cgId); }
      }
      const fb = { BTCUSDT: 64000, BTCUSD: 64000, ETHUSDT: 3200, ETHUSD: 3200, SOLUSDT: 145, SOLUSD: 145 };
      return { price: fb[symbol] || 100, source: "estimated" };
    }

    // Forex via exchangerate.host
    const forexPairs = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "NZDUSD", "USDCAD"];
    if (forexPairs.includes(symbol)) {
      const base = symbol.slice(0, 3);
      const quote = symbol.slice(3, 6);
      try {
        const r = await fetch("https://api.exchangerate.host/latest?base=" + base + "&symbols=" + quote);
        if (r.ok) {
          const d = await r.json();
          if (d.rates && d.rates[quote]) return { price: parseFloat(d.rates[quote]), source: "live" };
        }
      } catch (e) { console.warn("exchangerate.host failed for", symbol); }
      const sf = { EURUSD: 1.08, GBPUSD: 1.26, USDJPY: 154, AUDUSD: 0.65, NZDUSD: 0.59, USDCAD: 1.36 };
      return { price: sf[symbol] || 1.0, source: "estimated" };
    }

    // Fallback for everything else
    const fallbacks = { XAGUSD: 31, USOIL: 78, AAPL: 188, TSLA: 240, NVDA: 860, MSFT: 415, SPX: 5180, DXY: 104, NAS100: 18300, US30: 39300 };
    return { price: fallbacks[symbol] || 200, source: "estimated" };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NAVIGATION (smooth page transitions)
  // ──────────────────────────────────────────────────────────────────────────
  function switchPage(pageId) {
    var pages = document.querySelectorAll(".page");
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove("active");
    }
    var page = document.getElementById(pageId);
    if (page) {
      page.classList.add("active");
      var sidebar = document.getElementById("sidebar");
      if (pageId === "chatPage" && isLoggedIn()) {
        if (sidebar) sidebar.style.display = "flex";
        updateAllUI();
        restoreChatHistory();
      } else {
        if (sidebar) sidebar.style.display = "none";
      }
    }
    closeSidebar();
  }

  function navigateTo(page) {
    if (page === "chat") {
      if (!isLoggedIn()) { navigateTo("login"); showToast("Please login first!"); return; }
      switchPage("chatPage");
    } else if (page === "landing") {
      switchPage("landingPage");
    } else if (page === "login" || page === "signup") {
      currentAuthMode = page;
      switchPage("loginPage");
      updateAuthUI();
    } else if (page === "news") {
      switchPage("newsPage");
      fetchNews();
    }
  }

  function updateAuthUI() {
    var isSignup = currentAuthMode === "signup";
    var title = safeGetEl("authTitle");
    var subtitle = safeGetEl("authSubtitle");
    var usernameG = safeGetEl("usernameGroup");
    var submitBtn = safeGetEl("authSubmitBtn");
    var switchText = safeGetEl("switchText");
    var switchLink = safeGetEl("switchLink");
    var errEl = safeGetEl("authError");
    if (title) title.textContent = isSignup ? "Create Account" : "Welcome Back";
    if (subtitle) subtitle.textContent = isSignup ? "Join Minerva and start analyzing markets" : "Log in to your Minerva account";
    if (usernameG) usernameG.style.display = isSignup ? "block" : "none";
    if (submitBtn) submitBtn.textContent = isSignup ? "Create Account" : "Log In";
    if (switchText) switchText.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
    if (switchLink) switchLink.textContent = isSignup ? "Log In" : "Sign Up";
    if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // AUTH SYSTEM
  // ──────────────────────────────────────────────────────────────────────────
  function handleAuth() {
    var emailEl = safeGetEl("authEmail");
    var passwordEl = safeGetEl("authPassword");
    var usernameEl = safeGetEl("authUsername");
    var errEl = safeGetEl("authError");
    var email = emailEl ? emailEl.value.trim() : "";
    var password = passwordEl ? passwordEl.value : "";
    var isSignup = currentAuthMode === "signup";
    var username = isSignup && usernameEl ? usernameEl.value.trim() : "";

    if (!email || !password) {
      if (errEl) { errEl.textContent = "Please fill in all fields."; errEl.style.display = "block"; }
      showToast("Email and password required");
      return;
    }

    if (isSignup) {
      var valErr = validateSignup(username, password);
      if (valErr) {
        if (errEl) { errEl.textContent = valErr; errEl.style.display = "block"; }
        showToast(valErr);
        return;
      }
    }

    if (errEl) { errEl.textContent = ""; errEl.style.display = "none"; }

    var users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");

    if (isSignup) {
      if (users[email]) {
        if (errEl) { errEl.textContent = "An account with this email already exists."; errEl.style.display = "block"; }
        showToast("Account exists. Please log in.");
        return;
      }
      users[email] = {
        password: password,
        tier: "free",
        credits: 46,
        creditDate: new Date().toDateString(),
        chatHistory: [],
        theme: "dark",
        language: "en",
        username: username
      };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_USER_KEY, email);
      loadCurrentUser();
      showToast("Account created! Welcome to Minerva.");
      navigateTo("chat");
    } else {
      if (!users[email]) {
        if (errEl) { errEl.textContent = "No account found with this email."; errEl.style.display = "block"; }
        showToast("User not found");
        return;
      }
      if (users[email].password !== password) {
        if (errEl) { errEl.textContent = "Incorrect password."; errEl.style.display = "block"; }
        showToast("Incorrect password");
        return;
      }
      localStorage.setItem(CURRENT_USER_KEY, email);
      loadCurrentUser();
      showToast("Logged in successfully.");
      navigateTo("chat");
    }
  }

  function toggleAuthMode() {
    currentAuthMode = currentAuthMode === "login" ? "signup" : "login";
    updateAuthUI();
  }

  function simulateSocialLogin(provider) {
    var email = (provider === "Google" ? "google_" : "apple_") + Date.now() + "@minerva.demo";
    var users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    users[email] = {
      password: "social",
      tier: "free",
      credits: 46,
      creditDate: new Date().toDateString(),
      chatHistory: [],
      theme: "dark",
      language: "en",
      username: provider + "_Trader"
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, email);
    loadCurrentUser();
    showToast(provider + " login successful!");
    navigateTo("chat");
  }

  function handleGoogleLogin(response) {
    if (response && response.credential) {
      var payload = parseJwt(response.credential);
      if (payload) {
        var email = payload.email || "google_user@minerva.demo";
        var username = payload.name || payload.given_name || "GoogleUser";
        var users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
        if (!users[email]) {
          users[email] = {
            password: "google_oauth",
            tier: "free",
            credits: 46,
            creditDate: new Date().toDateString(),
            chatHistory: [],
            theme: "dark",
            language: "en",
            username: username
          };
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(CURRENT_USER_KEY, email);
        loadCurrentUser();
        showToast("Google login successful!");
        navigateTo("chat");
      } else {
        showToast("Google login failed.");
      }
    }
  }

  function confirmLogout() { var m = safeGetEl("logoutModal"); if (m) m.style.display = "flex"; }
  function cancelLogout() { var m = safeGetEl("logoutModal"); if (m) m.style.display = "none"; }
  function executeLogout() {
    var m = safeGetEl("logoutModal"); if (m) m.style.display = "none";
    localStorage.removeItem(CURRENT_USER_KEY);
    appState = null;
    navigateTo("landing");
    showToast("Logged out.");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SIDEBAR & HISTORY
  // ──────────────────────────────────────────────────────────────────────────
  function toggleSidebar() { var s = safeGetEl("sidebar"); if (s) { s.classList.toggle("open"); if (s.classList.contains("open")) renderHistoryList(); } }
  function closeSidebar() { var s = safeGetEl("sidebar"); if (s) s.classList.remove("open"); }
  function renderHistoryList() {
    var c = safeGetEl("historyList");
    if (!c) return;
    var h = (appState && appState.chatHistory) || [];
    if (!h.length) { c.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;">No history yet.</p>'; return; }
    var html = "";
    for (var i = h.length - 1; i >= 0; i--) {
      var m = h[i];
      var preview = m.content.replace(/<[^>]*>/g, "").substring(0, 60);
      html += '<div class="history-item" style="padding:10px;margin-bottom:4px;border-radius:8px;background:rgba(255,255,255,0.03);cursor:pointer;font-size:0.78rem;"><strong>' + (m.role === "user" ? "👤" : "🦉") + '</strong> ' + preview + '</div>';
    }
    c.innerHTML = html;
  }
  function newChat() { if (appState) { appState.chatHistory = []; saveState(); } restoreChatHistory(); closeSidebar(); showToast("New chat started."); }
  function clearHistoryFromPanel() { if (confirm("Delete all chat history?")) { if (appState) { appState.chatHistory = []; saveState(); } restoreChatHistory(); closeSidebar(); showToast("History cleared."); } }

  // ──────────────────────────────────────────────────────────────────────────
  // CHAT UI
  // ──────────────────────────────────────────────────────────────────────────
  function restoreChatHistory() {
    var container = safeGetEl("chatMessages");
    if (!container) return;
    var h = (appState && appState.chatHistory) || [];
    if (!h.length) {
      container.innerHTML = '<div class="msg-wrapper"><div class="msg ai"><strong style="color:#f0d9a0;">🦉 Minerva AI</strong><br>Welcome! I use real‑time market data and TradingView charts. Ask me: <strong>BTC</strong>, <strong>ETH</strong>, <strong>Gold</strong>, <strong>EURUSD</strong>.</div></div><div id="tvChartContainer" class="chart-container" style="display:none;"></div>';
      return;
    }
    var html = "";
    for (var i = 0; i < h.length; i++) {
      html += '<div class="msg-wrapper"><div class="msg ' + h[i].role + '">' + h[i].content + '</div></div>';
    }
    html += '<div id="tvChartContainer" class="chart-container" style="display:none;"></div>';
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function appendMessageElement(role, content) {
    var container = safeGetEl("chatMessages");
    if (!container) return null;
    var wrapper = document.createElement("div");
    wrapper.className = "msg-wrapper";
    var msgDiv = document.createElement("div");
    msgDiv.className = "msg " + role;
    msgDiv.innerHTML = content;
    wrapper.appendChild(msgDiv);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
  }

  function toggleInput(enabled) {
    var input = safeGetEl("chatInput");
    var btn = safeGetEl("sendBtn");
    if (input) input.disabled = !enabled;
    if (btn) btn.disabled = !enabled;
  }

  function stopTypewriter() {
    if (typewriterInterval) { clearInterval(typewriterInterval); typewriterInterval = null; }
  }

  function typeMessage(element, text, callback) {
    stopTypewriter();
    element.innerHTML = "";
    var cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    element.appendChild(cursor);
    var container = safeGetEl("chatMessages");
    var i = 0;
    var total = text.length;
    var speed = total > 400 ? 6 : total > 200 ? 10 : 14;
    typewriterInterval = setInterval(function () {
      if (i >= total) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
        if (cursor.parentNode) cursor.remove();
        element.innerHTML = text;
        if (container) container.scrollTop = container.scrollHeight;
        if (callback) callback();
        return;
      }
      var chunk = text.substring(0, i + 1);
      cursor.remove();
      element.innerHTML = chunk;
      element.appendChild(cursor);
      if (container) container.scrollTop = container.scrollHeight;
      i++;
    }, speed);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRADINGVIEW CHART
  // ──────────────────────────────────────────────────────────────────────────
  function loadTradingViewChart(symbol) {
    var container = safeGetEl("tvChartContainer");
    if (!container) return;
    var id = "tv_" + Date.now();
    container.innerHTML = '<div class="chart-container" id="' + id + '"><div style="color:#b0aca6;text-align:center;padding-top:140px;">📊 Loading chart for ' + symbol + '...</div></div>';
    container.style.display = "block";
    setTimeout(function () {
      var c = document.getElementById(id);
      if (c && typeof TradingView !== "undefined") {
        c.innerHTML = "";
        try {
          new TradingView.widget({
            container_id: id,
            symbol: mapSymbol(symbol),
            interval: "60",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#0d1421",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: false,
            width: "100%",
            height: "100%",
            studies: ["RSI@tv-basicstudies", "MAExp@tv-basicstudies"]
          });
        } catch (e) {
          c.innerHTML = '<div style="color:#b0aca6;padding-top:140px;">Chart unavailable</div>';
        }
      }
    }, 300);
  }

  function hideTradingViewChart() {
    var c = safeGetEl("tvChartContainer");
    if (c) { c.style.display = "none"; c.innerHTML = ""; }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // AI SYSTEM — send message + generate response
  // ──────────────────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!isLoggedIn()) { navigateTo("login"); showToast("Please login first!"); return; }
    if (isAITyping) { showToast("AI is typing, please wait..."); return; }
    var input = safeGetEl("chatInput");
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    var now = Date.now();
    if (now - lastMessageTime < COOLDOWN_MS) { showToast("Cooldown — wait a moment"); return; }
    if (appState.credits < 12) { openUpgradeModal(); showToast("No credits. Upgrade or refill."); return; }

    lastMessageTime = now;
    isAITyping = true;
    toggleInput(false);
    appState.credits -= 12;
    saveState();
    updateAllUI();

    var clean = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    appendMessageElement("user", clean);
    if (appState.chatHistory) appState.chatHistory.push({ role: "user", content: clean, timestamp: new Date().toISOString() });
    input.value = "";
    input.style.height = "auto";
    updateSendButton();

    var typingMsg = appendMessageElement("ai", '<span style="color:#aaa;">Minerva is analyzing…</span>');
    hideTradingViewChart();
    var isAnalysis = isAnalysisRequest(text);
    var delay = isAnalysis ? 5000 : 2000;

    setTimeout(async function () {
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.innerHTML = "";
        try {
          var responseText = await generateAIResponse(text);
          typeMessage(typingMsg, responseText, function () {
            if (isAnalysis) {
              var sym = detectSymbol(text) || "BTCUSDT";
              loadTradingViewChart(sym);
            }
            if (appState && appState.chatHistory) {
              appState.chatHistory.push({ role: "ai", content: responseText, timestamp: new Date().toISOString() });
            }
            saveState();
            isAITyping = false;
            toggleInput(true);
          });
        } catch (e) {
          console.error("AI Error:", e);
          typingMsg.innerHTML = "⚠️ Error generating response. Please try again.";
          isAITyping = false;
          toggleInput(true);
        }
      } else {
        isAITyping = false;
        toggleInput(true);
      }
    }, delay);
  }

  async function generateAIResponse(userText) {
    if (isAnalysisRequest(userText)) {
      var symbol = detectSymbol(userText) || "BTCUSDT";
      var timeframe = detectTimeframe(userText);
      var priceData = await getSafePrice(symbol);
      var price = priceData.price || 0;
      var srcText = priceData.source === "live" ? "🟢 Live Price" : "🟡 Estimated Price";
      var srcLabel = priceData.source === "live" ? "Binance / Live API" : "Fallback Reference";
      var dir = Math.random() > 0.45 ? "long" : "short";
      var dirLabel = dir === "long" ? "📈 Long (Bullish)" : "📉 Short (Bearish)";
      var dirColor = dir === "long" ? "#4caf84" : "#e05555";
      var strategies = ["Breakout Continuation", "Support & Resistance Bounce", "Trend Following", "Liquidity Sweep", "RSI Divergence", "Fibonacci Retracement", "MA Crossover"];
      var strategy = strategies[Math.floor(Math.random() * strategies.length)];
      var entry = price;
      var tp1 = dir === "long" ? entry * 1.01 : entry * 0.99;
      var tp2 = dir === "long" ? entry * 1.02 : entry * 0.98;
      var tp3 = dir === "long" ? entry * 1.03 : entry * 0.97;
      var sl = dir === "long" ? entry * 0.99 : entry * 1.01;
      var risk = Math.abs(entry - sl);
      var rr1 = risk > 0 ? (Math.abs(tp1 - entry) / risk).toFixed(1) : "N/A";
      var rr2 = risk > 0 ? (Math.abs(tp2 - entry) / risk).toFixed(1) : "N/A";
      var rr3 = risk > 0 ? (Math.abs(tp3 - entry) / risk).toFixed(1) : "N/A";
      var tier = (appState && appState.tier) || "free";
      var tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

      var analysis = "";
      analysis += '<strong style="color:#f0d9a0;font-size:1rem;">🦉 Minerva AI — ' + symbol + ' Analysis</strong><br>';
      analysis += '<span class="live-badge ' + (priceData.source === "live" ? "green" : "amber") + '">' + srcText + ': $' + price.toFixed(4) + '</span> <span style="font-size:0.7rem;color:var(--text-muted);">(' + srcLabel + ')</span><br>';
      analysis += '<div style="margin:8px 0;padding:6px 12px;border-radius:8px;background:rgba(' + (dir === "long" ? "76,175,132" : "224,85,85") + ',0.1);display:inline-block;"><strong style="color:' + dirColor + ';">' + dirLabel + '</strong> • ' + strategy + ' • <span style="color:#f0d9a0;">⏱ ' + timeframe + '</span></div>';
      analysis += '<table class="analysis-table"><thead><tr><th>Entry</th><th>TP1 (+1%)</th><th>TP2 (+2%)</th><th>TP3 (+3%)</th><th>SL (-1%)</th></tr></thead><tbody><tr>';
      analysis += '<td class="entry-cell">$' + entry.toFixed(4) + '</td><td class="tp-cell">$' + tp1.toFixed(4) + '</td><td class="tp-cell">$' + tp2.toFixed(4) + '</td><td class="tp-cell">$' + tp3.toFixed(4) + '</td><td class="sl-cell">$' + sl.toFixed(4) + '</td>';
      analysis += '</tr></tbody></table>';
      analysis += '<div style="font-size:0.82rem;margin:6px 0;">📐 <strong>Risk/Reward:</strong> R:R at TP1 = 1:' + rr1 + ' | TP2 = 1:' + rr2 + ' | TP3 = 1:' + rr3 + '</div>';
      analysis += '<div style="margin-top:8px;font-size:0.85rem;"><strong>📊 Technical Reasoning:</strong><br>• ' + timeframe + ' timeframe analysis<br>• Entry near current price of $' + entry.toFixed(2) + ' based on ' + (priceData.source === "live" ? "live market data" : "reference pricing") + '.<br>• ' + (dir === "long" ? "Bullish momentum building — price testing support with upside potential." : "Bearish pressure expected — price approaching resistance with downside risk.") + '<br>• Simulated ' + strategy + ' pattern detected on current timeframe.</div>';
      analysis += '<div style="margin-top:6px;font-size:0.85rem;"><strong>🏗️ Market Structure:</strong><br>' + (dir === "long" ? "Higher low formation suggests bullish continuation. Key support at $" + sl.toFixed(2) + " must hold for the setup to remain valid." : "Lower high pattern indicates bearish pressure. Resistance at $" + sl.toFixed(2) + " likely to cap any upside attempts.") + '</div>';
      if (tier === "pro" || tier === "businessman") {
        analysis += '<div style="margin-top:6px;font-size:0.85rem;"><strong>⏱️ Multi‑Timeframe Confluence:</strong><br>• Daily: ' + (dir === "long" ? "Bullish structure intact with higher lows." : "Bearish momentum dominating with lower highs.") + '<br>• 4H: ' + (dir === "long" ? "Retracement near completion at key Fibonacci level." : "Distribution forming at resistance zone.") + '<br>• 1H: ' + (dir === "long" ? "RSI bullish divergence — momentum building." : "Bearish engulfing candle — sellers in control.") + '</div>';
      }
      if (tier === "businessman") {
        analysis += '<div style="margin-top:6px;font-size:0.85rem;"><strong>💡 Smart Money / Orderflow Concepts:</strong><br>• <strong>Liquidity Zone:</strong> ' + (dir === "long" ? "Below $" + (sl * 0.997).toFixed(2) + " — potential stop-hunt target before expansion higher." : "Above $" + (sl * 1.003).toFixed(2) + " — smart money may push price into this zone before distributing.") + '<br>• <strong>Volume Profile:</strong> ' + (dir === "long" ? "Accumulation signs at current level with POC shifting higher. VWAP supportive." : "Distribution near resistance with declining delta on bounces. VWAP acting as resistance.") + '<br>• <strong>Winrate Estimate:</strong> ~' + (Math.floor(Math.random() * 7) + 79) + '% based on confluence of factors above (simulated model).</div>';
      }
      analysis += '<div style="margin-top:6px;font-size:0.85rem;"><strong>📰 News & Fundamental Context:</strong><br>' + generateNewsContext(symbol) + '</div>';
      analysis += '<div style="margin-top:10px;font-size:0.7rem;color:var(--text-muted);border-top:1px solid var(--glass-border);padding-top:8px;">⚠️ <em>Simulated analysis model. Based on current data. Not financial advice. Trading involves substantial risk.</em> | Tier: ' + tierLabel + ' | Data: ' + srcLabel + '</div>';
      return analysis;
    } else {
      var lower = userText.toLowerCase();
      if (lower.includes("forex") || lower.includes("currency") || lower.includes("exchange rate"))
        return "💱 <strong>Forex (Foreign Exchange)</strong> is the global market for trading currencies. Major pairs like <strong>EURUSD</strong>, <strong>GBPUSD</strong>, and <strong>USDJPY</strong> are the most liquid. I fetch real exchange rates. Try <strong>\"analyze EURUSD\"</strong> for a live analysis with entry and targets.";
      if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("blockchain"))
        return "🪙 <strong>Cryptocurrency</strong> markets run 24/7 on exchanges like Binance. I track <strong>BTC</strong>, <strong>ETH</strong>, <strong>SOL</strong> and more with live prices. Try <strong>\"analyze bitcoin\"</strong> for a real‑time structured trade plan.";
      if (lower.includes("stock") || lower.includes("equity") || lower.includes("shares"))
        return "📈 <strong>Stocks</strong> represent ownership in publicly traded companies. I monitor <strong>AAPL</strong>, <strong>TSLA</strong>, <strong>NVDA</strong>, <strong>MSFT</strong>. Ask me to <strong>\"analyze Tesla\"</strong> for a full breakdown.";
      if (lower.includes("gold") || lower.includes("commodity") || lower.includes("xau"))
        return "🥇 <strong>Gold (XAUUSD)</strong> is the world's premier safe-haven asset. I fetch live gold prices from metals.live. Other commodities include <strong>Silver (XAGUSD)</strong> and <strong>Oil (USOIL)</strong>. Try <strong>\"analyze gold\"</strong>.";
      if (lower.includes("help") || lower.includes("how") || lower.includes("what can"))
        return "🦉 I'm Minerva, your AI trading assistant. I can help with:<br><br>• <strong>Market Analysis</strong> — try \"analyze bitcoin\" or \"gold analysis\"<br>• <strong>Trade Plans</strong> — entry, TP1/TP2/TP3, and stop-loss<br>• <strong>Live Charts</strong> — TradingView chart loads automatically<br>• <strong>Real Prices</strong> — from Binance, Forex APIs, metals.live<br><br>What would you like me to analyze today?";
      if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey"))
        return "👋 Hello! I'm Minerva, your AI trading analyst. I specialize in real‑time market analysis. Ask me anything — like <strong>\"analyze bitcoin\"</strong> or <strong>\"what is forex?\"</strong> — and I'll help you navigate the markets.";
      if (lower.includes("thank"))
        return "You're welcome! 😊 If you'd like a market analysis, just ask — e.g., <strong>\"analyze gold\"</strong> or <strong>\"BTC setup\"</strong>. I'm here to help.";
      return "🤔 I'm your AI trading assistant — here to provide market analysis with <strong>real‑time data</strong>. You can ask me to:<br><br>• <strong>Analyze a market</strong>: \"analyze bitcoin\" or \"gold analysis\"<br>• <strong>Explain concepts</strong>: \"what is forex?\" or \"how does RSI work?\"<br>• <strong>Check prices</strong>: \"BTC price\" or \"EURUSD rate\"<br><br>What would you like to know? 📈";
    }
  }

  function generateNewsContext(symbol) {
    var isCrypto = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"].includes(symbol);
    var isForex = ["EURUSD", "GBPUSD", "USDJPY"].includes(symbol);
    var isCommodity = ["XAUUSD", "XAGUSD", "USOIL"].includes(symbol);
    var isStock = ["AAPL", "TSLA", "NVDA", "MSFT"].includes(symbol);
    if (isCrypto) return "Crypto markets showing mixed institutional flows. ETF inflows remain positive. Regulatory developments continue to influence sentiment. Volatility expected around upcoming economic releases.";
    if (isForex) return "Central bank policy divergence driving FX markets. Recent economic data supports cautious near-term stance. Bond yield spreads widening. Key PMI and employment data this week may impact direction.";
    if (isCommodity) return "Geopolitical tensions supporting safe-haven demand for commodities. Supply constraints remain a relevant factor. Global industrial demand steady according to recent PMI figures. Seasonal patterns may influence near-term price action.";
    if (isStock) return "Earnings reports driving individual stock moves. Broader market sentiment remains cautiously optimistic. Sector rotation evident in recent sessions. Analyst consensus shows mixed outlook for near-term performance.";
    return "Market conditions remain dynamic. Multiple factors including economic data, geopolitical events, and institutional flows are influencing price action. Stay informed and manage risk appropriately.";
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NEWS FETCH
  // ──────────────────────────────────────────────────────────────────────────
  async function fetchNews() {
    var container = safeGetEl("newsContainer");
    if (!container) return;
    container.innerHTML = '<p style="color:var(--text-muted);">Loading latest market news...</p>';
    try {
      var resp = await fetch("https://newsdata.io/api/1/latest?apikey=" + NEWS_API_KEY + "&category=business&language=en");
      if (resp.ok) {
        var data = await resp.json();
        if (data.results && data.results.length) {
          var html = "";
          for (var i = 0; i < Math.min(data.results.length, 8); i++) {
            var a = data.results[i];
            html += '<div class="news-card"><div class="news-title">' + (a.title || "Untitled") + '</div><div class="news-source">' + (a.source_id || "News Source") + ' • ' + (a.pubDate ? new Date(a.pubDate).toLocaleString() : "") + '</div><div class="news-desc">' + (a.description || a.content || "").substring(0, 180) + '…</div></div>';
          }
          container.innerHTML = html;
        } else {
          container.innerHTML = '<p style="color:var(--text-muted);">No news articles found.</p>';
        }
      } else {
        container.innerHTML = '<p style="color:var(--text-muted);">News temporarily unavailable. Please try again later.</p>';
      }
    } catch (e) {
      container.innerHTML = '<p style="color:var(--text-muted);">Unable to fetch news. Check your internet connection.</p>';
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PAYMENT / UPGRADE SYSTEM
  // ──────────────────────────────────────────────────────────────────────────
  function openPaymentModal(mode) {
    paymentMode = mode;
    var modal = safeGetEl("paymentModal");
    if (!modal) return;
    modal.style.display = "flex";
    var title = safeGetEl("paymentModalTitle");
    if (title) title.textContent = mode === "upgrade" ? "⭐ Upgrade Tier" : "💵 Refill Credits ($4 = 46 credits)";
    if (mode === "upgrade") {
      var tierSelection = safeGetEl("paymentTierSelection");
      var methodSelection = safeGetEl("paymentMethodSelection");
      var addressSection = safeGetEl("paymentAddressDisplay");
      var successSection = safeGetEl("paymentSuccess");
      if (tierSelection) tierSelection.style.display = "block";
      if (methodSelection) methodSelection.style.display = "none";
      if (addressSection) addressSection.style.display = "none";
      if (successSection) successSection.style.display = "none";
      renderUpgradeTierCards();
    } else {
      var ts = safeGetEl("paymentTierSelection");
      var ms = safeGetEl("paymentMethodSelection");
      var as = safeGetEl("paymentAddressDisplay");
      var ss = safeGetEl("paymentSuccess");
      if (ts) ts.style.display = "none";
      if (ms) ms.style.display = "block";
      if (as) as.style.display = "none";
      if (ss) ss.style.display = "none";
      selectedTier = null;
      selectedPaymentMethod = null;
      clearPaymentTimer();
    }
  }

  function closePaymentModal() {
    var modal = safeGetEl("paymentModal");
    if (modal) modal.style.display = "none";
    clearPaymentTimer();
    paymentMode = null;
  }

  function clearPaymentTimer() {
    if (paymentTimerInterval) { clearInterval(paymentTimerInterval); paymentTimerInterval = null; }
  }

  function startAutoPaymentCheck() {
    clearPaymentTimer();
    var seconds = 5;
    var timerEl = safeGetEl("paymentTimer");
    if (timerEl) timerEl.textContent = seconds + "s";
    paymentTimerInterval = setInterval(function () {
      seconds--;
      if (timerEl) timerEl.textContent = seconds + "s";
      if (seconds <= 0) {
        clearPaymentTimer();
        completePayment();
      }
    }, 1000);
  }

  function completePayment() {
    var methodSelection = safeGetEl("paymentMethodSelection");
    var addressSection = safeGetEl("paymentAddressDisplay");
    var successSection = safeGetEl("paymentSuccess");
    if (methodSelection) methodSelection.style.display = "none";
    if (addressSection) addressSection.style.display = "none";
    if (successSection) successSection.style.display = "block";
    try {
      var audio = safeGetEl("successSound");
      if (audio) { audio.currentTime = 0; audio.play().catch(function () {}); }
    } catch (e) {}
    if (paymentMode === "upgrade" && selectedTier) {
      if (appState) {
        appState.tier = selectedTier;
        appState.credits = getDailyCredits(selectedTier);
        appState.creditDate = new Date().toDateString();
        saveState();
      }
    } else if (paymentMode === "refill") {
      if (appState) { appState.credits += 46; saveState(); }
    }
    updateAllUI();
    setTimeout(function () {
      closePaymentModal();
      if (appState) restoreChatHistory();
      showToast(paymentMode === "upgrade" ? "Tier upgraded!" : "Credits refilled!");
    }, 2000);
  }

  function renderUpgradeTierCards() {
    var container = safeGetEl("upgradeTierCards");
    if (!container) return;
    var ct = (appState && appState.tier) || "free";
    var tiers = ["pro", "businessman"];
    var html = "";
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var isCur = t === ct;
      html += '<div class="upgrade-tier-card' + (isCur ? " current" : "") + '" onclick="' + (isCur ? "" : "window._selectTier('" + t + "')") + '"><h4 style="color:#f0d9a0;">' + (t === "pro" ? "⭐ Pro" : "💼 Businessman") + '</h4><div style="font-size:1.4rem;font-weight:700;">$' + getTierPrice(t).toFixed(2) + '/mo</div><div style="font-size:0.8rem;color:#aaa;">' + getDailyCredits(t) + ' credits/day</div><ul style="text-align:left;font-size:0.8rem;margin-top:8px;">';
      var features = getTierFeatures(t);
      for (var j = 0; j < features.length; j++) {
        html += '<li>' + features[j] + '</li>';
      }
      html += '</ul>' + (isCur ? '<div style="color:#4caf84;font-weight:600;font-size:0.8rem;">✓ Current Plan</div>' : "") + '</div>';
    }
    container.innerHTML = html;
  }

  window._selectTier = function (tier) {
    selectedTier = tier;
    var tierSelection = safeGetEl("paymentTierSelection");
    var methodSelection = safeGetEl("paymentMethodSelection");
    var addressSection = safeGetEl("paymentAddressDisplay");
    if (tierSelection) tierSelection.style.display = "none";
    if (methodSelection) methodSelection.style.display = "block";
    if (addressSection) addressSection.style.display = "none";
    selectedPaymentMethod = null;
  };

  function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    var methodSelection = safeGetEl("paymentMethodSelection");
    var addressSection = safeGetEl("paymentAddressDisplay");
    var addressDisplay = safeGetEl("addressDisplay");
    if (methodSelection) methodSelection.style.display = "none";
    if (addressSection) addressSection.style.display = "block";
    if (addressDisplay) addressDisplay.textContent = CRYPTO_ADDRESSES[method] || "";
    clearPaymentTimer();
    startAutoPaymentCheck();
  }

  function copyAddress() {
    var addressDisplay = safeGetEl("addressDisplay");
    if (addressDisplay) {
      navigator.clipboard.writeText(addressDisplay.textContent).then(function () {
        showToast("Address copied!");
      }).catch(function () {
        showToast("Copy manually: " + addressDisplay.textContent);
      });
    }
  }

  function openUpgradeModal() { openPaymentModal("upgrade"); }
  function openRefillModal() { openPaymentModal("refill"); }

  // ──────────────────────────────────────────────────────────────────────────
  // UI UPDATE
  // ──────────────────────────────────────────────────────────────────────────
  function updateAllUI() {
    if (!appState) return;
    var nc = safeGetEl("navCreditsCount");
    if (nc) nc.textContent = appState.credits;
    var tb = safeGetEl("navTierBadge");
    if (tb) {
      tb.textContent = (appState.tier || "free").charAt(0).toUpperCase() + (appState.tier || "free").slice(1);
      tb.className = "nav-badge tier " + (appState.tier === "pro" ? "pro" : appState.tier === "businessman" ? "business" : "");
    }
    updateSendButton();
  }

  function updateSendButton() {
    var sb = safeGetEl("sendBtn");
    var ub = safeGetEl("upgradeSendBtn");
    if (appState && appState.credits < 12) {
      if (sb) sb.style.display = "none";
      if (ub) ub.style.display = "flex";
    } else {
      if (sb) sb.style.display = "flex";
      if (ub) ub.style.display = "none";
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SETTINGS
  // ──────────────────────────────────────────────────────────────────────────
  function toggleSettings() {
    var panel = safeGetEl("settingsPanel");
    if (panel) panel.classList.toggle("active");
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    var sel = safeGetEl("themeToggle");
    if (sel) sel.value = theme;
    if (appState) { appState.theme = theme; saveState(); }
  }

  function applyLanguage(lang) {
    localStorage.setItem("language", lang);
    var sel = safeGetEl("langSelect");
    if (sel) sel.value = lang;
    if (appState) { appState.language = lang; saveState(); }
  }

  function resetCreditsForTesting() {
    if (appState) { appState.credits = getDailyCredits(appState.tier); saveState(); }
    updateAllUI();
    toggleSettings();
    showToast("Credits refilled for testing!");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ──────────────────────────────────────────────────────────────────────────
  function initApp() {
    loadCurrentUser();

    var savedTheme = localStorage.getItem("theme") || "dark";
    var savedLang = localStorage.getItem("language") || "en";
    applyTheme(savedTheme);
    applyLanguage(savedLang);

    // Bind all buttons
    bindClick("logoHome", function () { navigateTo("landing"); });
    bindClick("settingsBtn", toggleSettings);
    bindClick("toggleSidebarBtn", toggleSidebar);
    bindClick("newChatBtn", newChat);
    bindClick("clearHistoryBtn", clearHistoryFromPanel);
    bindClick("upgradeBtn", openUpgradeModal);
    bindClick("refillCreditsBtn", openRefillModal);
    bindClick("settingsRefillCredits", openRefillModal);
    bindClick("sendBtn", sendMessage);
    bindClick("upgradeSendBtn", openUpgradeModal);
    bindClick("landingLoginBtn", function () { currentAuthMode = "login"; navigateTo("login"); });
    bindClick("landingSignupBtn", function () { currentAuthMode = "signup"; navigateTo("signup"); });
    bindClick("authSubmitBtn", handleAuth);
    bindClick("googleLoginBtn", function () { simulateSocialLogin("Google"); });
    bindClick("appleLoginBtn", function () { simulateSocialLogin("Apple"); });
    bindClick("menuSettingsBtn", toggleSettings);
    bindClick("menuNewsBtn", function () { navigateTo("news"); });
    bindClick("menuLogoutBtn", confirmLogout);
    bindClick("newsBackBtn", function () { navigateTo("chat"); });
    bindClick("closePaymentBtn", closePaymentModal);
    bindClick("copyAddressBtn", copyAddress);
    bindClick("verifyPaymentBtn", completePayment);
    bindClick("cancelLogoutBtn", cancelLogout);
    bindClick("confirmLogoutBtn", executeLogout);
    bindClick("profileBtn", function () {
      var m = safeGetEl("dropdownMenu");
      if (m) m.style.display = m.style.display === "block" ? "none" : "block";
    });

    var switchLink = safeGetEl("switchLink");
    if (switchLink) switchLink.addEventListener("click", toggleAuthMode);

    var themeSel = safeGetEl("themeToggle");
    if (themeSel) themeSel.addEventListener("change", function () { applyTheme(this.value); });

    var langSel = safeGetEl("langSelect");
    if (langSel) langSel.addEventListener("change", function () { applyLanguage(this.value); });

    var chatInput = safeGetEl("chatInput");
    if (chatInput) {
      chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      chatInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 120) + "px";
      });
    }

    // Handle payment method button clicks
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".payment-method-btn");
      if (btn) {
        var method = btn.getAttribute("data-method");
        if (method) selectPaymentMethod(method);
      }
      // Close settings panel when clicking outside
      var panel = safeGetEl("settingsPanel");
      var settingsBtn = safeGetEl("settingsBtn");
      if (panel && settingsBtn && !panel.contains(e.target) && !settingsBtn.contains(e.target)) {
        panel.classList.remove("active");
      }
      // Close dropdown when clicking outside
      var menu = safeGetEl("dropdownMenu");
      var prof = safeGetEl("profileBtn");
      if (menu && prof && !menu.contains(e.target) && !prof.contains(e.target)) {
        menu.style.display = "none";
      }
    });

    // Initialize Google OAuth
    if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "94193376030-0gvqmi0r8f6kq5p5q5q5q5q5q5q5q5q5q.apps.googleusercontent.com",
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      var googleDiv = safeGetEl("googleSignInDiv");
      if (googleDiv) {
        google.accounts.id.renderButton(googleDiv, {
          theme: "filled_black",
          size: "large",
          width: "280",
          text: "signin_with",
          shape: "pill"
        });
      }
    }

    // Navigate to correct page
    if (isLoggedIn()) {
      navigateTo("chat");
    } else {
      navigateTo("landing");
    }
    updateAuthUI();
    console.log("🦉 Minerva.io script.js loaded successfully.");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // START THE APP
  // ──────────────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", initApp);
})();