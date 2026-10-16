/**
 * ═══════════════════════════════════════════════════════════════
 *  TTT ARENA — script.js
 *
 *  PART 1 : Landing Page Systems
 *           (Loader · Splash · Particles · Cursor · Scroll · Magnetic)
 *  PART 2 : Game Screen Router
 *  PART 3 : DOM References
 *  PART 4 : Game State
 *  PART 5 : Win Conditions
 *  PART 6 : Firebase Init
 *  PART 7 : Navigation Handlers (Landing ↔ Game, Nav Tabs, Back)
 *  PART 8 : Mode Selection
 *  PART 9 : Online Lobby (Create / Join Room, Firebase sync)
 *  PART 10: Game Start / Round Init
 *  PART 11: Cell Click Handler
 *  PART 12: Mark Placement
 *  PART 13: Win / Draw / Deadlock Logic
 *  PART 14: AI Engine (Easy / Medium / Hard Minimax)
 *  PART 15: System Log
 *  PART 16: Match History (localStorage)
 *  PART 17: Leaderboard  (localStorage)
 *  PART 18: UI Helpers
 *  PART 19: Win Line SVG
 *  PART 20: Outcome Modal
 *  PART 21: Event Listeners
 *  PART 22: Init
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
//  PART 1: LANDING PAGE SYSTEMS
// ═══════════════════════════════════════════════════════════════

/* ── 1.1 Loader & Tactical Disclaimer ────────────────────────── */
const DISCLAIMER_ACK_KEY = 'ttt_tactical_disclaimer_ack_v1';

function isDisclaimerAcknowledged() {
  try {
    return localStorage.getItem(DISCLAIMER_ACK_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function setDisclaimerAcknowledged() {
  try {
    localStorage.setItem(DISCLAIMER_ACK_KEY, 'true');
  } catch (e) {}
}

function initLoader() {
  const loader    = document.getElementById('loader');
  const bar       = document.getElementById('loader-bar');
  const statusEl  = document.getElementById('loader-status');

  const messages = [
    'INITIALIZING SYSTEMS…',
    'LOADING BATTLE ENGINE…',
    'CALIBRATING AI CORE…',
    'CONNECTING ARENA…',
    'SYSTEM READY.',
  ];

  let pct = 0;
  let msgIdx = 0;

  const tick = setInterval(() => {
    pct += Math.random() * 18 + 4;
    if (pct >= 100) pct = 100;
    bar.style.width = pct + '%';

    const newIdx = Math.min(Math.floor(pct / 25), messages.length - 1);
    if (newIdx !== msgIdx) {
      msgIdx = newIdx;
      statusEl.textContent = messages[msgIdx];
    }

    if (pct >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
          if (isDisclaimerAcknowledged()) {
            // Already acknowledged -> Skip disclaimer completely, go directly to landing
            const splash = document.getElementById('splash');
            if (splash) {
              splash.classList.remove('visible', 'shown', 'hiding');
              splash.style.display = 'none';
            }
            showLanding();
            checkUrlRoomParam();
          } else {
            // First time visit -> Show disclaimer once
            showSplash();
          }
        }, 520);
      }, 300);
    }
  }, 110);
}

/* ── 1.2 Splash screen ───────────────────────────────────────── */
function showSplash() {
  if (isDisclaimerAcknowledged()) {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.remove('visible', 'shown', 'hiding');
      splash.style.display = 'none';
    }
    showLanding();
    checkUrlRoomParam();
    return;
  }
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.style.display = 'flex';
  splash.classList.remove('hiding');
  splash.classList.add('visible');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isDisclaimerAcknowledged()) {
        splash.classList.add('shown');
      }
    });
  });
}

function hideSplash(cb) {
  const splash = document.getElementById('splash');
  if (!splash) { if (cb) cb(); return; }
  splash.classList.add('hiding');
  setTimeout(() => {
    splash.classList.remove('visible', 'shown', 'hiding');
    splash.style.display = 'none';
    if (cb) cb();
  }, 400);
}

document.getElementById('btn-acknowledge')?.addEventListener('click', (e) => {
  e?.preventDefault?.();
  setDisclaimerAcknowledged();
  hideSplash(() => {
    showLanding();
    checkUrlRoomParam();
  });
});

/* ── 1.3 Show / hide landing and game ─────────────────────────── */
function showLanding() {
  const landing = document.getElementById('landing');
  landing.classList.add('visible');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => landing.classList.add('shown'));
  });
  initScrollReveal();
  initMagneticButtons();
}

function enterGame(startFn) {
  const landing = document.getElementById('landing');
  const app     = document.getElementById('app');
  landing.classList.remove('shown');
  setTimeout(() => {
    landing.classList.remove('visible');
    app.classList.add('visible');
    if (startFn) startFn();
  }, 400);
}

/* ── 1.4 Particle System (canvas) ─────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 70 }, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r:  Math.random() * 1.5 + 0.4,
    op: Math.random() * 0.45 + 0.08,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dots
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,136,${p.op})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,255,136,${0.09 * (1 - d / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* ── 1.5 Cursor glow ─────────────────────────────────────────── */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

/* ── 1.6 Scroll reveal (Intersection Observer) ────────────────── */
function initScrollReveal() {
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── 1.7 Magnetic buttons ────────────────────────────────────── */
function initMagneticButtons() {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  PART 2: GAME SCREEN ROUTER
// ═══════════════════════════════════════════════════════════════

const ALL_SCREENS = [
  'screen-home', 'screen-ai-select', 'screen-online-lobby',
  'screen-history', 'screen-leaderboard', 'screen-game', 'screen-friends',
];

let screenStack = ['screen-home'];

/** Shows one game screen, hides all others. Updates back button & nav tabs. */
function showScreen(id) {
  ALL_SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('active', s === id);
  });

  // Back button: hide on home, show elsewhere
  navBack.classList.toggle('visible', id !== 'screen-home');

  // Nav tab active state
  document.querySelectorAll('.gtab').forEach(t => t.classList.remove('active'));
  if (id === 'screen-game' || id === 'screen-home') {
    const arenaTab = document.getElementById('tab-arena');
    if (arenaTab) arenaTab.classList.add('active');
  } else if (id === 'screen-leaderboard') {
    const lbTab = document.getElementById('btn-game-leaderboard');
    if (lbTab) lbTab.classList.add('active');
  } else if (id === 'screen-history') {
    const hTab = document.getElementById('btn-game-history');
    if (hTab) hTab.classList.add('active');
  } else if (id === 'screen-friends') {
    const fTab = document.getElementById('tab-friends');
    if (fTab) fTab.classList.add('active');
  }

  screenStack.push(id);
}

// ═══════════════════════════════════════════════════════════════
//  PART 3: DOM REFERENCES
// ═══════════════════════════════════════════════════════════════

const navBack            = document.getElementById('nav-back');
const btnModeLocal       = document.getElementById('btn-mode-local');
const btnModeAI          = document.getElementById('btn-mode-ai');
const btnModeOnline      = document.getElementById('btn-mode-online');
const btnGotoLeaderboard = document.getElementById('btn-goto-leaderboard');
const btnGotoHistory     = document.getElementById('btn-goto-history');

const btnDiffEasy   = document.getElementById('btn-diff-easy');
const btnDiffMedium = document.getElementById('btn-diff-medium');
const btnDiffHard   = document.getElementById('btn-diff-hard');

const firebaseWarning    = document.getElementById('firebase-warning');
const lobbyPanel         = document.getElementById('lobby-panel');
const btnCreateRoom      = document.getElementById('btn-create-room');
const createdCodeDisplay = document.getElementById('created-code-display');
const createdCodeValue   = document.getElementById('created-code-value');
const btnCopyCode        = document.getElementById('btn-copy-code');
const joinCodeInput      = document.getElementById('join-code-input');
const btnJoinRoom        = document.getElementById('btn-join-room');
const joinError          = document.getElementById('join-error');

const historyList         = document.getElementById('history-list');
const btnClearHistory     = document.getElementById('btn-clear-history');
const leaderboardBody     = document.getElementById('leaderboard-body');
const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');

const cells         = document.querySelectorAll('.cell');
const board         = document.getElementById('board');
const statusMessage = document.getElementById('status-message');
const scoreXEl      = document.getElementById('score-x');
const scoreOEl      = document.getElementById('score-o');
const drawCountEl   = document.getElementById('draw-count');
const labelX        = document.getElementById('label-x');
const labelO        = document.getElementById('label-o');
const pips          = [
  document.getElementById('pip-1'),
  document.getElementById('pip-2'),
  document.getElementById('pip-3'),
];
const scoreXCard = document.getElementById('score-x-card');
const scoreOCard = document.getElementById('score-o-card');
const winLine    = document.getElementById('win-line');
const modeBadge  = document.getElementById('mode-badge');
const roomCodePill = document.getElementById('room-code-pill');
const gameTagline  = document.getElementById('game-tagline'); // hidden, legacy compat
const btnNewRound  = document.getElementById('btn-new-round');
const btnReset     = document.getElementById('btn-reset');
const btnGameHistory     = document.getElementById('btn-game-history');
const btnGameLeaderboard = document.getElementById('btn-game-leaderboard');
const mcRound      = document.getElementById('mc-round');
const logEntries   = document.getElementById('log-entries');

const modalOverlay  = document.getElementById('modal-overlay');
const modalIcon     = document.getElementById('modal-icon');
const modalTitle    = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalNewRound = document.getElementById('modal-new-round');
const modalReset    = document.getElementById('modal-reset');

// ═══════════════════════════════════════════════════════════════
//  PART 4: GAME STATE
// ═══════════════════════════════════════════════════════════════

let boardState     = Array(9).fill('');
let currentPlayer  = 'X';
let gameActive     = true;
let scores         = { X: 0, O: 0 };
let roundNumber    = 1;
let xMoveHistory   = [];
let oMoveHistory   = [];
let turnCount      = 0;

let maxRevivals       = 3;
let revivalsUsed      = 0;
let revivalsRemaining = 3;
let matchWinner       = null; // null | 'X' | 'O'
let roundResults      = [];   // Array of strings, e.g. ["X Win", "O Win", "Draw"]
let revivalUsage      = [];   // Array of integers, e.g. [1, 2]

let gameMode      = 'local';   // 'local' | 'ai' | 'online'
let aiDifficulty  = 'medium';
let mySymbol      = 'X';
let roomCode      = '';
let aiThinking    = false;
let matchStartTime = Date.now();
let lastPlacedIndex = -1;
let onlinePlayerNameX = 'Player X';
let onlinePlayerNameO = 'Player O';
let matchResultPersisted = false;

let fbApp        = null;
let fbDB         = null;
let roomRef      = null;
let roomListener = null;
let joinWatcher  = null;

// ═══════════════════════════════════════════════════════════════
//  PART 5: WIN CONDITIONS
// ═══════════════════════════════════════════════════════════════

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

/** SVG line endpoints (in 0–300 viewBox space) for each combo */
const WIN_LINE_COORDS = {
  '0,1,2':[17,50,283,50], '3,4,5':[17,150,283,150], '6,7,8':[17,250,283,250],
  '0,3,6':[50,17,50,283], '1,4,7':[150,17,150,283], '2,5,8':[250,17,250,283],
  '0,4,8':[17,17,283,283],'2,4,6':[283,17,17,283],
};

// ═══════════════════════════════════════════════════════════════
//  PART 6: FIREBASE INIT
// ═══════════════════════════════════════════════════════════════

function initFirebase() {
  try {
    if (
      typeof FIREBASE_CONFIG === 'undefined' ||
      !FIREBASE_CONFIG.databaseURL ||
      FIREBASE_CONFIG.databaseURL.includes('YOUR_PROJECT')
    ) return false;
    if (!fbApp && typeof firebase !== 'undefined') {
      fbApp = firebase.initializeApp(FIREBASE_CONFIG);
      fbDB  = firebase.database();
    }
    if (!fbAuth && typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
      try {
        fbAuth = firebase.auth();
        fbAuth.onAuthStateChanged(handleAuthStateChange);
      } catch (authErr) {
        console.warn('[TTTArena] Auth init warning:', authErr);
      }
    }
    return true;
  } catch (e) {
    console.warn('[TTTArena] Firebase init failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 7: NAVIGATION HANDLERS
// ═══════════════════════════════════════════════════════════════

/* Back button */
navBack.addEventListener('click', () => {
  screenStack.pop();
  const prev = screenStack.pop() || 'screen-home';
  if (joinWatcher && roomRef) { roomRef.off('value', joinWatcher); joinWatcher = null; }
  showScreen(prev);
});

/* Nav tabs */
document.getElementById('tab-arena').addEventListener('click', () => {
  showScreen('screen-home');
});
btnGameLeaderboard.addEventListener('click', () => {
  renderLeaderboard();
  showScreen('screen-leaderboard');
});
btnGameHistory.addEventListener('click', () => {
  renderHistory();
  showScreen('screen-history');
});
document.getElementById('btn-start-match').addEventListener('click', () => {
  showScreen('screen-home');
});

/* History / Leaderboard from mode home */
btnGotoLeaderboard.addEventListener('click', () => {
  renderLeaderboard();
  showScreen('screen-leaderboard');
});
btnGotoHistory.addEventListener('click', () => {
  renderHistory();
  showScreen('screen-history');
});

/* Landing → Game entries */
document.getElementById('btn-enter-arena').addEventListener('click', () => {
  enterGame(() => showScreen('screen-home'));
});
document.getElementById('btn-hero-local').addEventListener('click', () => {
  enterGame(() => {
    gameMode = 'local';
    setupLocalMode();
    startGame();
  });
});
document.getElementById('btn-hero-ai').addEventListener('click', () => {
  enterGame(() => showScreen('screen-ai-select'));
});
document.getElementById('btn-hero-online')?.addEventListener('click', () => {
  enterGame(() => {
    const ok = initFirebase();
    firebaseWarning.style.display    = ok ? 'none' : 'flex';
    lobbyPanel.style.display         = ok ? 'flex' : 'none';
    createdCodeDisplay.style.display = 'none';
    joinError.style.display          = 'none';
    joinCodeInput.value              = '';
    showScreen('screen-online-lobby');
    if (!authUser) {
      showAuthModal();
      showToast('Please login or play as guest to battle online.', 'info');
    }
  });
});
document.getElementById('btn-price-recruit').addEventListener('click', () => {
  enterGame(() => showScreen('screen-home'));
});
document.getElementById('btn-price-operator').addEventListener('click', () => {
  enterGame(() => {
    // Run the same Firebase check as btnModeOnline so the warning shows correctly
    const ok = initFirebase();
    firebaseWarning.style.display    = ok ? 'none' : 'flex';
    lobbyPanel.style.display         = ok ? 'flex' : 'none';
    createdCodeDisplay.style.display = 'none';
    joinError.style.display          = 'none';
    joinCodeInput.value              = '';
    showScreen('screen-online-lobby');
  });
});
document.getElementById('btn-cta-enter').addEventListener('click', () => {
  enterGame(() => showScreen('screen-home'));
});

// ═══════════════════════════════════════════════════════════════
//  PART 8: MODE SELECTION
// ═══════════════════════════════════════════════════════════════

/* Firebase fallback buttons — inside the "not configured" warning */
document.getElementById('fw-goto-local').addEventListener('click', () => {
  setupLocalMode(); startGame();
});
document.getElementById('fw-goto-ai').addEventListener('click', () => {
  showScreen('screen-ai-select');
});


function setupLocalMode() {
  gameMode = 'local'; mySymbol = 'X';
  labelX.textContent = 'PLAYER X';
  labelO.textContent = 'PLAYER O';
  modeBadge.textContent = 'LOCAL';
  modeBadge.className   = 'mode-badge badge-local';
  roomCodePill.style.display = 'none';
  if (gameTagline) gameTagline.textContent = 'Two Players. One Winner.';
}

function setupAIMode(diff) {
  gameMode     = 'ai';
  aiDifficulty = diff;
  mySymbol     = 'X';
  const lbl    = diff.charAt(0).toUpperCase() + diff.slice(1);
  labelX.textContent = 'YOU';
  labelO.textContent = `AI (${lbl})`;
  modeBadge.textContent = `AI · ${lbl.toUpperCase()}`;
  modeBadge.className   = `mode-badge badge-ai-${diff}`;
  roomCodePill.style.display = 'none';
  if (gameTagline) gameTagline.textContent = `You vs AI — ${lbl} Mode`;
}

btnModeLocal.addEventListener('click', () => {
  setupLocalMode();
  startGame();
});

btnModeAI.addEventListener('click', () => {
  showScreen('screen-ai-select');
});

btnDiffEasy.addEventListener('click',   () => { setupAIMode('easy');   startGame(); });
btnDiffMedium.addEventListener('click', () => { setupAIMode('medium'); startGame(); });
btnDiffHard.addEventListener('click',   () => { setupAIMode('hard');   startGame(); });

// ═══════════════════════════════════════════════════════════════
//  PART 9: ONLINE LOBBY
// ═══════════════════════════════════════════════════════════════

btnModeOnline.addEventListener('click', () => {
  const ok = initFirebase();
  firebaseWarning.style.display = ok ? 'none' : 'flex';
  lobbyPanel.style.display      = ok ? 'flex' : 'none';
  createdCodeDisplay.style.display = 'none';
  joinError.style.display          = 'none';
  joinCodeInput.value              = '';
  showScreen('screen-online-lobby');
});

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function ensureFirebaseAuth() {
  if (!initFirebase()) return null;
  if (!fbAuth && typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
    fbAuth = firebase.auth();
  }
  if (!fbAuth) return null;

  if (fbAuth.currentUser) {
    authUser = fbAuth.currentUser;
    return fbAuth.currentUser;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const unsubscribe = fbAuth.onAuthStateChanged(async (user) => {
      if (user && !resolved) {
        resolved = true;
        unsubscribe();
        authUser = user;
        resolve(user);
      }
    });

    setTimeout(async () => {
      if (!resolved) {
        try {
          const cred = await fbAuth.signInAnonymously();
          if (!resolved) {
            resolved = true;
            unsubscribe();
            authUser = cred.user;
            resolve(cred.user);
          }
        } catch (e) {
          console.error('[TTTArena] Anonymous auth trigger error:', e);
          if (!resolved) {
            resolved = true;
            unsubscribe();
            resolve(null);
          }
        }
      }
    }, 600);
  });
}

btnCreateRoom.addEventListener('click', async () => {
  console.log("CREATE ROOM CLICKED");
  console.log("=== FIREBASE DEBUG ===");
  console.log("firebase exists:", typeof firebase !== "undefined");
  console.log("fbDB:", fbDB);
  console.log("DATABASE URL:", fbDB?.ref()?.toString?.());
  console.log("AUTH USER:", typeof firebase !== 'undefined' && firebase.auth ? firebase.auth()?.currentUser : null);
  console.log("UID:", typeof firebase !== 'undefined' && firebase.auth ? firebase.auth()?.currentUser?.uid : null);
  console.log("AUTH STATE:", typeof firebase !== 'undefined' && firebase.auth ? !!firebase.auth()?.currentUser : false);

  btnCreateRoom.disabled    = true;
  btnCreateRoom.textContent = 'Creating…';

  // Ensure Firebase authentication is complete before database write
  const currentUser = await ensureFirebaseAuth();
  console.log("POST-ENSURE AUTH USER:", currentUser);
  console.log("POST-ENSURE UID:", currentUser?.uid);

  if (!currentUser) {
    btnCreateRoom.disabled    = false;
    btnCreateRoom.textContent = 'Create Room';
    showToast('Authentication required. Please login to create a room.', 'warn');
    showAuthModal();
    return;
  }

  if (!fbDB) {
    const ok = initFirebase();
    if (!ok) {
      btnCreateRoom.disabled    = false;
      btnCreateRoom.textContent = 'Create Room';
      showToast('Firebase not initialized. Cannot create room.', 'error');
      return;
    }
  }

  roomCode = generateRoomCode();
  const ref = fbDB.ref(`ttt_rooms/${roomCode}`);
  const profile = playerProfile || loadProfile() || { name: 'Player X', emoji: '⚡', playerId: currentUser.uid, friendCode: generatePlayerId() };

  console.log("========== FIREBASE RUNTIME CHECK ==========");
  console.log("Firebase projectId:", firebase.app().options.projectId);
  console.log("Firebase databaseURL:", firebase.app().options.databaseURL);
  console.log("Firebase authDomain:", firebase.app().options.authDomain);
  console.log("Current user:", firebase.auth().currentUser);
  console.log("Current UID:", firebase.auth().currentUser?.uid);
  console.log("Authenticated:", !!firebase.auth().currentUser);
  console.log("fbDB exists:", !!fbDB);
  console.log("Room ref:", ref?.toString?.());
  console.log("=============================================");

  try {
    await ref.set({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      status: 'waiting',
      winner: null,
      combo: null,
      scoresX: 0,
      scoresO: 0,
      createdAt: Date.now(),
      creatorId: currentUser.uid,
      creatorName: profile.name || 'Player X',
      creatorEmoji: profile.emoji || '⚡',
      creatorFriendCode: profile.friendCode || '',
      joinerId: '',
      joinerName: '',
      joinerEmoji: '',
      joinerFriendCode: '',
      revivalsRemaining: 3,
      revivalsUsed: 0,
      roundNumber: 1,
      matchWinner: null,
      xMoveHistory: [],
      oMoveHistory: [],
      turnCount: 0
    });

    console.log("ROOM CREATED SUCCESSFULLY");

    createdCodeValue.textContent     = roomCode;
    createdCodeDisplay.style.display = 'flex';
    btnCreateRoom.disabled           = false;
    btnCreateRoom.textContent        = 'Create Room';
    mySymbol = 'X';
    joinWatcher = ref.on('value', snap => {
      const d = snap.val();
      if (d && d.status === 'playing') {
        ref.off('value', joinWatcher);
        joinWatcher = null;
        startOnlineGame(roomCode, 'X', ref);
      }
    });
  } catch (error) {
    console.error("========== FIREBASE WRITE ERROR ==========");
    console.error("CODE:", error?.code);
    console.error("MESSAGE:", error?.message);
    console.error("FULL ERROR:", error);
    console.error("==========================================");
    btnCreateRoom.disabled           = false;
    btnCreateRoom.textContent        = 'Create Room';
    showToast(`Failed to create room: ${error?.message || 'Database error'}`, 'error');
  }
});

btnCopyCode.addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode).then(() => {
    btnCopyCode.textContent = '✅';
    setTimeout(() => { btnCopyCode.textContent = '📋'; }, 1600);
  }).catch(() => {
    const t = document.createElement('input');
    t.value = roomCode;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    btnCopyCode.textContent = '✅';
    setTimeout(() => { btnCopyCode.textContent = '📋'; }, 1600);
  });
});

async function joinRoomByCode(code) {
  if (!code) return;
  const currentUser = await ensureFirebaseAuth();
  if (!currentUser || !fbDB) {
    showJoinError('Authentication required to join room.');
    return;
  }
  const ref  = fbDB.ref(`ttt_rooms/${code}`);
  try {
    const snap = await ref.once('value');
    const data = snap.val();
    if (!data) { showJoinError('Room not found. Double-check the code.'); return; }
    if (data.status === 'playing' || data.status === 'finished') {
      showJoinError('This room is already in progress.');
      return;
    }
    const profile = playerProfile || loadProfile() || { name: 'Player O', emoji: '👾', playerId: currentUser.uid, friendCode: generatePlayerId() };
    roomCode = code; mySymbol = 'O';
    await ref.update({
      status: 'playing',
      joinerId: currentUser.uid,
      joinerName: profile.name,
      joinerEmoji: profile.emoji,
      joinerFriendCode: profile.friendCode || ''
    });
    startOnlineGame(code, 'O', ref);
  } catch (e) {
    console.warn('[TTTArena] joinRoomByCode failed:', e);
    showJoinError('Failed to join room: ' + (e?.message || 'Database error'));
  }
}

btnJoinRoom.addEventListener('click', async () => {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (code.length !== 6) { showJoinError('Enter a valid 6-character room code.'); return; }
  if (!fbDB) return;
  btnJoinRoom.disabled = true; btnJoinRoom.textContent = '…';
  await joinRoomByCode(code);
  btnJoinRoom.disabled = false; btnJoinRoom.textContent = 'JOIN';
});

function showJoinError(msg) {
  joinError.textContent   = msg;
  joinError.style.display = 'block';
  setTimeout(() => { joinError.style.display = 'none'; }, 5000);
}

function startOnlineGame(code, symbol, ref) {
  console.log("\n=== START ONLINE GAME ===");
  console.log("Code:", code);
  console.log("Symbol (role):", symbol);
  console.log("Ref exists:", !!ref);
  gameMode = 'online';
  mySymbol = symbol;
  roomCode = code;
  roomRef = ref;
  console.log("State set - gameMode:", gameMode, "mySymbol:", mySymbol, "roomCode:", roomCode);
  labelX.textContent = symbol === 'X' ? 'YOU (X)' : 'FRIEND (X)';
  labelO.textContent = symbol === 'O' ? 'YOU (O)' : 'FRIEND (O)';
  modeBadge.textContent = 'ONLINE';
  modeBadge.className   = 'mode-badge badge-online';
  roomCodePill.textContent   = `🔑 ${code}`;
  roomCodePill.style.display = 'inline-flex';
  if (gameTagline) gameTagline.textContent = `Room: ${code} · You are ${symbol}`;
  
  // Set up room listener
  console.log("Setting up roomListener BEFORE startGame()");
  if (roomListener) ref.off('value', roomListener);
  roomListener = ref.on('value', snap => {
    const d = snap.val();
    console.log("roomListener triggered with status:", d?.status, "mySymbol:", mySymbol);
    if (d) syncBoardFromFirebase(d);
  });
  console.log("roomListener is now active and listening");

  // Immediate read to update UI and opponent friend button without delay
  ref.once('value').then(snap => {
    const d = snap.val();
    if (d) syncBoardFromFirebase(d);
  });
  
  console.log("About to call startGame()");
  startGame();
  console.log("startGame() returned");
  
  console.log("=== START ONLINE GAME END ===\n");
}

function syncBoardFromFirebase(data) {
  console.log("\n=== SYNC BOARD FROM FIREBASE ===");
  console.log("MY SYMBOL:", mySymbol);
  console.log("Received Status:", data ? data.status : undefined);
  console.log("currentPlayer before sync:", currentPlayer);
  console.log("gameActive before sync:", gameActive);
  console.log("boardState before sync:", boardState);
  
  if (!data) {
    console.log("ERROR: syncBoardFromFirebase data is null/undefined");
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", undefined);
    return;
  }
  if (!data.board) {
    console.log("ERROR: syncBoardFromFirebase data.board is missing");
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  
  // Sync names
  onlinePlayerNameX = data.creatorName || 'Player X';
  onlinePlayerNameO = data.joinerName || 'Player O';
  labelX.textContent = `${onlinePlayerNameX} (X)`;
  labelO.textContent = `${onlinePlayerNameO} (O)`;

  // Update in-match opponent add-friend button
  updateMatchOpponentFriendUI(data);

  // Sync board layout and clear/add marks - Safe loop by index handling sparse arrays/objects
  const fbBoard = Array.isArray(data.board) ? data.board : Object.values(data.board);
  for (let i = 0; i < 9; i++) {
    const val = fbBoard[i] !== undefined ? fbBoard[i] : '';
    if (val !== boardState[i]) {
      const cell = cells[i];
      if (val === '') {
        const oldVal = boardState[i];
        boardState[i] = val;
        if (data.status === 'playing') {
          expireCellVisually(i, null, oldVal);
        } else {
          cell.innerHTML = '';
          cell.className = 'cell';
        }
      } else {
        boardState[i] = val;
        cell.innerHTML = '';
        cell.className = `cell taken ${val.toLowerCase()}`;
        const mark = document.createElement('span');
        mark.classList.add('mark');
        mark.textContent = val;
        cell.appendChild(mark);
      }
    }
  }

  // Sync queues and turn details - Safe conversions to real arrays
  xMoveHistory = Array.isArray(data.xMoveHistory) ? [...data.xMoveHistory] : (data.xMoveHistory ? Object.values(data.xMoveHistory) : []);
  oMoveHistory = Array.isArray(data.oMoveHistory) ? [...data.oMoveHistory] : (data.oMoveHistory ? Object.values(data.oMoveHistory) : []);
  turnCount    = data.turnCount || 0;
  
  // Sync round score and revival counters
  scores.X = data.scoresX ?? scores.X;
  scores.O = data.scoresO ?? scores.O;
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  
  revivalsRemaining = data.revivalsRemaining ?? 3;
  revivalsUsed      = data.revivalsUsed ?? 0;
  roundNumber       = data.roundNumber ?? roundNumber;
  matchWinner       = data.matchWinner ?? null;
  
  updateDrawUI();
  updateRoundDisplay();

  // Process newround status check before gameActive check
  if (data.status === 'newround') {
    console.log("\n>>> NEWROUND received");
    console.log("STARTING ROUND:", data.roundNumber);
    boardState = Array(9).fill('');
    gameActive = true;
    aiThinking = false;
    lastPlacedIndex = -1;
    currentPlayer = 'X';
    xMoveHistory = [];
    oMoveHistory = [];
    turnCount = 0;
    revivalsRemaining = 3;
    revivalsUsed = 0;
    roundNumber = data.roundNumber || roundNumber;
    matchWinner = data.matchWinner || null;
    matchResultPersisted = false;
    
    cells.forEach(c => { c.innerHTML = ''; c.className = 'cell'; });
    hideWinLine();
    board.classList.remove('disabled','shake');
    
    updateDrawUI();
    setStatusTurn();
    updateActiveCard();
    updateRoundDisplay();
    closeModal();
    
    board.classList.toggle('disabled', mySymbol !== 'X');
    console.log("Board disabled set to:", board.classList.contains('disabled'), "(should be", mySymbol !== 'X', ")");
    
    clearSysLog();
    addLog(`ROUND ${roundNumber} BEGIN. ARENA PRIMED.`, 'active');

    const playerRole = mySymbol;
    const currentTurn = currentPlayer;
    const boardLocked = board.classList.contains('disabled');
    console.log("NEWROUND - ROLE:", playerRole);
    console.log("NEWROUND - TURN:", currentTurn);
    console.log("NEWROUND - LOCKED:", boardLocked);
    console.log("NEWROUND - CAN PLAY:", playerRole === currentTurn);
    console.log("NEWROUND - GAME ACTIVE:", gameActive);
    console.log(">>> NEWROUND processing done, returning\n");
    return;
  }

  if (!gameActive) {
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  
  if (data.status === 'finished' && data.winner && data.combo) {
    handleWin({ player: data.winner, combo: data.combo.split(',').map(Number) }, true);
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  if (data.status === 'round_finished' && data.winner && data.combo) {
    handleWin({ player: data.winner, combo: data.combo.split(',').map(Number) }, true);
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  if (data.status === 'round_draw') {
    handleDraw(true);
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  if (data.status === 'round_deadlock') {
    handleDeadlock(true);
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  if (data.status === 'round_max_turns') {
    handleMaxTurnsDraw(true);
    console.log("GAME ACTIVE:", gameActive);
    console.log("STATUS:", data.status);
    return;
  }
  
  console.log("\n>>> TURN SYNC - Setting currentPlayer from database");
  currentPlayer = data.currentTurn || data.currentPlayer || 'X';
  console.log("TURN SYNC - MY SYMBOL:", mySymbol);
  console.log("TURN SYNC - CURRENT PLAYER:", currentPlayer);
  console.log("TURN SYNC - Board disabled before toggle:", board.classList.contains("disabled"));
  
  setStatusTurn(); updateActiveCard();
  
  board.classList.toggle('disabled', currentPlayer !== mySymbol);
  console.log("TURN SYNC - Board disabled after toggle:", board.classList.contains("disabled"));
  console.log("TURN SYNC - CAN PLAY:", currentPlayer === mySymbol);
  console.log("TURN SYNC - GAME ACTIVE:", gameActive);
  console.log("TURN SYNC - DATABASE STATUS:", data.status);
  console.log("=== SYNC BOARD FROM FIREBASE END ===\n");
}

async function onlineNextRound() {
  console.log("NEXT ROUND CLICKED");
  console.log("ROOM:", roomCode);
  if (!roomRef) {
    console.log("ERROR: roomRef is null inside onlineNextRound");
    return;
  }
  if (matchWinner || roundNumber >= 3) {
    onlineResetMatch();
    return;
  }
  const nextRoundNumber = Math.min(3, roundNumber + 1);
  closeModal();
  try {
    console.log("WRITING NEWROUND TO FIREBASE");
    await roomRef.update({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      currentTurn: 'X',
      status: 'newround',
      winner: null,
      combo: null,
      scoresX: scores.X,
      scoresO: scores.O,
      xMoveHistory: [],
      oMoveHistory: [],
      turnCount: 0,
      revivalsRemaining: 3,
      revivalsUsed: 0,
      roundNumber: nextRoundNumber,
      matchWinner: null,
      gameStatus: 'active',
      roundResult: null,
      modalState: 'closed'
    });
    console.log("NEWROUND WRITE SUCCESS");
  } catch (e) {
    console.warn('[TTTArena] onlineNextRound failed:', e);
  }
}

async function onlineResetMatch() {
  console.log("RESTART MATCH CLICKED");
  console.log("ROOM:", roomCode);
  if (!roomRef) {
    console.log("ERROR: roomRef is null inside onlineResetMatch");
    return;
  }
  closeModal();
  try {
    console.log("WRITING NEWROUND (RESET) TO FIREBASE");
    await roomRef.update({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      currentTurn: 'X',
      status: 'newround',
      winner: null,
      combo: null,
      scoresX: 0,
      scoresO: 0,
      xMoveHistory: [],
      oMoveHistory: [],
      turnCount: 0,
      revivalsRemaining: 3,
      revivalsUsed: 0,
      roundNumber: 1,
      matchWinner: null,
      gameStatus: 'active',
      roundResult: null,
      modalState: 'closed'
    });
    console.log("NEWROUND WRITE SUCCESS");
  } catch (e) {
    console.warn('[TTTArena] onlineResetMatch failed:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 10: GAME START / ROUND INIT
// ═══════════════════════════════════════════════════════════════

function startGame() {
  scores = { X: 0, O: 0 };
  roundNumber = 1;
  currentPlayer = 'X';
  matchWinner = null;
  matchResultPersisted = false;
  roundResults = [];
  revivalUsage = [];
  xMoveHistory = [];
  oMoveHistory = [];
  turnCount = 0;
  
  scoreXEl.textContent    = '0';
  scoreOEl.textContent    = '0';
  if (gameMode !== 'online') {
    const wrapX = document.getElementById('match-friend-wrap-x');
    const wrapO = document.getElementById('match-friend-wrap-o');
    if (wrapX) wrapX.style.display = 'none';
    if (wrapO) wrapO.style.display = 'none';
  }
  updateDrawUI();
  updateRoundDisplay();
  clearSysLog();
  addLog('SYSTEM INITIALIZED. ARENA READY.', 'active');
  initRound();
  showScreen('screen-game');
}

function initRound() {
  boardState = Array(9).fill('');
  gameActive = true;
  aiThinking = false;
  lastPlacedIndex = -1;
  matchStartTime = Date.now();
  xMoveHistory = [];
  oMoveHistory = [];
  turnCount = 0;
  revivalsRemaining = 3;
  revivalsUsed = 0;
  
  cells.forEach(c => { c.innerHTML = ''; c.className = 'cell'; });
  hideWinLine();
  board.classList.remove('disabled','shake');
  setStatusTurn();
  updateActiveCard();
  closeModal();
  updateDrawUI();
  updateRoundDisplay();
  
  if (gameMode === 'online' && roomRef && mySymbol === 'X') {
    roomRef.update({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      currentTurn: 'X',
      status: 'newround',
      winner: null,
      combo: null,
      scoresX: scores.X,
      scoresO: scores.O,
      xMoveHistory: [],
      oMoveHistory: [],
      turnCount: 0,
      revivalsRemaining: 3,
      revivalsUsed: 0,
      roundNumber: roundNumber,
      matchWinner: null
    });
  }
  if (gameMode === 'online' && mySymbol === 'O') board.classList.add('disabled');
  if (gameMode === 'ai' && currentPlayer !== mySymbol) triggerAIMove();
}

/**
 * resetGame — Always returns to mode selection screen.
 * For online mode, also detaches Firebase listener.
 */
function resetGame() {
  if (gameMode === 'online') detachFirebase();
  scores = { X: 0, O: 0 };
  roundNumber = 1;
  currentPlayer = 'X';
  matchWinner = null;
  roundResults = [];
  revivalUsage = [];
  xMoveHistory = [];
  oMoveHistory = [];
  turnCount = 0;
  
  scoreXEl.textContent    = '0';
  scoreOEl.textContent    = '0';
  updateDrawUI();
  
  boardState = Array(9).fill('');
  cells.forEach(c => { c.innerHTML = ''; c.className = 'cell'; });
  hideWinLine();
  board.classList.remove('disabled', 'shake');
  closeModal();
  aiThinking = false;
  showScreen('screen-home');
}

function detachFirebase() {
  if (roomRef && roomListener) { roomRef.off('value', roomListener); roomListener = null; }
  roomRef = null; roomCode = '';
}

function updateRoundDisplay() {
  if (mcRound) mcRound.textContent = `ROUND ${Math.min(3, roundNumber)} / 3`;
}

// ═══════════════════════════════════════════════════════════════
//  PART 11: CELL CLICK HANDLER
// ═══════════════════════════════════════════════════════════════

function handleCellClick(event) {
  console.log("=== CELL CLICK ===");
  console.log("ROLE:", mySymbol);
  console.log("TURN:", currentPlayer);
  console.log("LOCKED:", board.classList.contains('disabled'));
  console.log("GAME ACTIVE:", gameActive);

  const cell  = event.currentTarget;
  const index = parseInt(cell.dataset.index);
  if (!gameActive) return;
  if (boardState[index] !== '') return;
  if (aiThinking) return;
  if (gameMode === 'online' && currentPlayer !== mySymbol) return;

  placeMark(cell, index);

  // Cell labelling for log
  const cellNames = ['A1','A2','A3','B1','B2','B3','C1','C2','C3'];
  const name = cellNames[index] || `CELL_${index}`;
  addLog(`> ${getPlayerLabel(currentPlayer).toUpperCase()} DEPLOYED [${currentPlayer}] AT ${name}`);

  // 1. Check WIN first
  const winResult = checkWin();
  if (winResult) {
    if (gameMode === 'online' && roomRef) {
      scores[winResult.player]++;
      const isMatchOver = (scores[winResult.player] === 2) || (roundNumber >= 3);
      const newStatus = isMatchOver ? 'finished' : 'round_finished';
      const roundResultVal = `${winResult.player} Win`;
      let mWinner = null;
      if (isMatchOver) {
        if (scores.X > scores.O) mWinner = 'X';
        else if (scores.O > scores.X) mWinner = 'O';
        else mWinner = 'Tie';
      }
      
      roomRef.update({
        board: [...boardState],
        status: newStatus,
        winner: winResult.player,
        combo: winResult.combo.join(','),
        scoresX: scores.X,
        scoresO: scores.O,
        roundNumber: roundNumber,
        matchWinner: mWinner,
        gameStatus: isMatchOver ? 'finished' : 'round_finished',
        roundResult: roundResultVal,
        modalState: 'open'
      });
      handleWin(winResult, true);
    } else {
      handleWin(winResult);
    }
    return;
  }

  // 2. Check FULL BOARD (Revival or Draw)
  if (isBoardFull()) {
    if (revivalsRemaining > 0) {
      // 2a. Perform revival
      revivalsRemaining--;
      revivalsUsed++;
      updateDrawUI();
      
      const oldX = xMoveHistory.shift();
      const oldO = oMoveHistory.shift();
      boardState[oldX] = '';
      boardState[oldO] = '';
      
      addLog(`> DRAW DETECTED. REVIVAL ACTIVATED (${revivalsRemaining}/3 REMAINING)`, 'draw');

      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      setStatusTurn(); updateActiveCard();
      addLog(`> CURRENT TURN: ${getPlayerLabel(currentPlayer).toUpperCase()} (WAITING…)`, 'active');

      if (gameMode === 'online' && roomRef) {
        roomRef.update({
          board: [...boardState],
          currentPlayer,
          currentTurn: currentPlayer,
          lastMove: index,
          xMoveHistory,
          oMoveHistory,
          turnCount,
          revivalsRemaining,
          revivalsUsed,
          status: 'playing',
          gameStatus: 'active',
          roundResult: null,
          modalState: 'closed'
        });
      }

      expireTwoCellsVisually(oldX, oldO, () => {
        if (gameMode === 'ai' && currentPlayer !== mySymbol) {
          triggerAIMove();
        }
      });
      return;
    } else {
      // 2b. revivalsRemaining === 0 -> handleDraw()
      if (gameMode === 'online' && roomRef) {
        const isMatchOver = (roundNumber >= 3) || (scores.X === 2) || (scores.O === 2);
        let mWinner = null;
        if (isMatchOver) {
          if (scores.X > scores.O) mWinner = 'X';
          else if (scores.O > scores.X) mWinner = 'O';
          else mWinner = 'Tie';
        }
        roomRef.update({
          board: [...boardState],
          currentPlayer,
          currentTurn: currentPlayer,
          lastMove: index,
          xMoveHistory,
          oMoveHistory,
          turnCount,
          revivalsRemaining,
          revivalsUsed,
          status: 'round_draw',
          gameStatus: isMatchOver ? 'finished' : 'round_finished',
          roundResult: 'Draw',
          matchWinner: mWinner,
          modalState: 'open'
        });
        handleDraw(true);
      } else {
        handleDraw();
      }
      return;
    }
  }

  // 3. If board is NOT full and revivalsRemaining === 0 -> check isDeadlock()
  if (!isBoardFull() && revivalsRemaining === 0 && isDeadlock()) {
    if (gameMode === 'online' && roomRef) {
      const isMatchOver = (roundNumber >= 3) || (scores.X === 2) || (scores.O === 2);
      let mWinner = null;
      if (isMatchOver) {
        if (scores.X > scores.O) mWinner = 'X';
        else if (scores.O > scores.X) mWinner = 'O';
        else mWinner = 'Tie';
      }
      roomRef.update({
        board: [...boardState],
        status: 'round_deadlock',
        gameStatus: isMatchOver ? 'finished' : 'round_finished',
        roundResult: 'Deadlock',
        matchWinner: mWinner,
        modalState: 'open'
      });
      handleDeadlock(true);
    } else {
      handleDeadlock();
    }
    return;
  }

  // 4. Otherwise: continue the round
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  setStatusTurn(); updateActiveCard();
  addLog(`> CURRENT TURN: ${getPlayerLabel(currentPlayer).toUpperCase()} (WAITING…)`, 'active');

  // Turn count limit protection check
  if (turnCount >= 200) {
    if (gameMode === 'online' && roomRef) {
      roomRef.update({
        status: 'round_max_turns',
        roundResults,
        revivalUsage,
        gameStatus: 'round_finished',
        roundResult: 'MaxTurns',
        modalState: 'open'
      });
      handleMaxTurnsDraw(true);
    } else {
      handleMaxTurnsDraw();
    }
    return;
  }

  if (gameMode === 'online' && roomRef) {
    board.classList.add('disabled');
    roomRef.update({
      board: [...boardState],
      currentPlayer,
      currentTurn: currentPlayer,
      lastMove: index,
      xMoveHistory,
      oMoveHistory,
      turnCount,
      status: 'playing',
      gameStatus: 'active',
      roundResult: null,
      modalState: 'closed'
    });
    return;
  }

  if (gameMode === 'ai' && currentPlayer !== mySymbol) {
    board.classList.add('disabled');
    triggerAIMove();
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 12: MARK PLACEMENT
// ═══════════════════════════════════════════════════════════════

function placeMark(cell, index) {
  boardState[index] = currentPlayer;
  if (currentPlayer === 'X') {
    xMoveHistory.push(index);
  } else {
    oMoveHistory.push(index);
  }
  turnCount++;

  // Remove "just-placed" from previous cell
  if (lastPlacedIndex >= 0) cells[lastPlacedIndex].classList.remove('just-placed');
  lastPlacedIndex = index;

  cell.classList.add('taken', currentPlayer.toLowerCase(), 'just-placed');
  const mark = document.createElement('span');
  mark.classList.add('mark');
  mark.textContent = currentPlayer;
  cell.appendChild(mark);
}

// ═══════════════════════════════════════════════════════════════
//  PART 13: WIN / DRAW / DEADLOCK LOGIC
// ═══════════════════════════════════════════════════════════════

function checkWin() {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
      return { player: boardState[a], combo };
    }
  }
  return null;
}

function isBoardFull() { return boardState.every(v => v !== ''); }

/**
 * DEADLOCK DETECTION
 * A combo is "live for X" when it has no 'O' cells (X could still win it).
 * A combo is "live for O" when it has no 'X' cells.
 * If every combo is blocked for BOTH → DEADLOCK (board not yet full).
 */
function isDeadlock() {
  return isDeadlockOnState(boardState);
}

function checkMatchCompletion(roundOutcomeTitle, roundOutcomeSubtitle, icon = '🏆') {
  const isMatchOver = (scores.X === 2) || (scores.O === 2) || (roundNumber >= 3);
  const dur = Math.round((Date.now() - matchStartTime) / 1000);

  if (isMatchOver) {
    let mWinnerLabel = 'Match Tied';
    let mResult = 'draw';
    if (scores.X > scores.O) {
      matchWinner = 'X';
      mWinnerLabel = getPlayerLabel('X');
      mResult = 'win';
    } else if (scores.O > scores.X) {
      matchWinner = 'O';
      mWinnerLabel = getPlayerLabel('O');
      mResult = 'win';
    } else {
      matchWinner = 'Tie';
      mWinnerLabel = 'Match Tied';
      mResult = 'draw';
    }

    if (!matchResultPersisted) {
      matchResultPersisted = true;
      persistMatchResult({ winner: mWinnerLabel, result: mResult });
      if (matchWinner === 'X' || matchWinner === 'O') {
        updateLeaderboard(matchWinner, 'win');
      }
    }

    if (matchWinner === 'Tie') {
      addLog(`> 🤝 MATCH DRAW! FINAL SCORE: ${scores.X} - ${scores.O}`, 'draw');
      setTimeout(() => {
        showModal('🤝', 'MATCH DRAW', `Best of 3 completed. Final Score: ${scores.X} - ${scores.O}`);
      }, 800);
    } else {
      addLog(`> 🏆 ${mWinnerLabel.toUpperCase()} WINS THE MATCH! (${scores.X} - ${scores.O})`, 'win');
      setTimeout(() => {
        showModal('🏆', 'MATCH WINNER', `${mWinnerLabel} (${scores.X} - ${scores.O})`);
      }, 800);
    }
  } else {
    setTimeout(() => {
      showModal(icon, roundOutcomeTitle, roundOutcomeSubtitle);
    }, 700);
  }
}

function handleWin({ player, combo }, fromFirebase = false) {
  gameActive = false;
  if (!fromFirebase) {
    scores[player]++;
  }
  if (player === 'X') scoreXEl.textContent = scores.X;
  else                scoreOEl.textContent = scores.O;
  combo.forEach(i => cells[i].classList.add('winner'));
  drawWinLine(combo);
  
  const wLabel = getPlayerLabel(player);
  setStatusHTML(`<span class="status-win">🏆 ${wLabel} Wins!</span>`);
  board.classList.add('disabled');
  addLog(`> ⚡ ${wLabel.toUpperCase()} WINS ROUND ${roundNumber}!`, 'win');
  
  roundResults.push(`${player} Win`);
  revivalUsage.push(revivalsUsed);
  
  const dur = Math.round((Date.now() - matchStartTime) / 1000);
  checkMatchCompletion(`${wLabel} Wins Round ${roundNumber}!`, `Duration: ${formatDuration(dur)}`, player === 'X' ? '🏆' : '🎉');
}

function expireCellVisually(index, callback, expiredPlayer) {
  const cell = cells[index];
  if (!cell) {
    if (callback) callback();
    return;
  }
  
  // Temporarily disable board interactions to prevent double-clicks/clashes during visual transition
  const boardWasDisabled = board.classList.contains('disabled');
  board.classList.add('disabled');
  
  cell.classList.add('expiring');
  
  const pulseEl = document.createElement('span');
  pulseEl.className = 'expired-pulse';
  pulseEl.textContent = 'EXPIRED';
  cell.appendChild(pulseEl);
  
  const player = expiredPlayer || boardState[index] || (xMoveHistory.includes(index) ? 'X' : 'O');
  addLog(`> OLDEST ${player} MOVE EXPIRED`, 'draw');
  
  setTimeout(() => {
    cell.innerHTML = '';
    cell.className = 'cell';
    if (!boardWasDisabled) {
      board.classList.remove('disabled');
    }
    if (callback) callback();
  }, 400);
}

function expireTwoCellsVisually(oldXIndex, oldOIndex, callback) {
  const cellX = cells[oldXIndex];
  const cellO = cells[oldOIndex];

  // 1. Disable the board once
  const boardWasDisabled = board.classList.contains('disabled');
  board.classList.add('disabled');

  // 2 & 3. Add expiration animation & show EXPIRED on both cells simultaneously
  if (cellX) {
    cellX.classList.add('expiring');
    const pulseX = document.createElement('span');
    pulseX.className = 'expired-pulse';
    pulseX.textContent = 'EXPIRED';
    cellX.appendChild(pulseX);
  }

  if (cellO) {
    cellO.classList.add('expiring');
    const pulseO = document.createElement('span');
    pulseO.className = 'expired-pulse';
    pulseO.textContent = 'EXPIRED';
    cellO.appendChild(pulseO);
  }

  addLog('> OLDEST X MOVE EXPIRED', 'draw');
  addLog('> OLDEST O MOVE EXPIRED', 'draw');

  // 4, 5, 6. Clear both cells after the same timeout, remove disabled state once, call callback after both cleared
  setTimeout(() => {
    if (cellX) {
      cellX.innerHTML = '';
      cellX.className = 'cell';
    }
    if (cellO) {
      cellO.innerHTML = '';
      cellO.className = 'cell';
    }
    if (!boardWasDisabled) {
      board.classList.remove('disabled');
    }
    if (callback) callback();
  }, 400);
}

function checkAndProcessTrueDrawLocalAI(callback) {
  if (isBoardFull()) {
    if (revivalsRemaining > 0) {
      revivalsRemaining--;
      revivalsUsed++;
      updateDrawUI();
      
      const oldX = xMoveHistory.shift();
      const oldO = oMoveHistory.shift();
      boardState[oldX] = '';
      boardState[oldO] = '';
      
      addLog(`> DRAW DETECTED. REVIVAL ACTIVATED (${revivalsRemaining}/3 REMAINING)`, 'draw');
      
      expireTwoCellsVisually(oldX, oldO, callback);
      return true;
    } else {
      handleDraw();
      return false;
    }
  }
  if (callback) callback();
  return false;
}

function handleMaxTurnsDraw(fromFirebase = false) {
  gameActive = false;
  board.classList.add('disabled');
  setStatusHTML(`<span class="status-gameover">🚫 Max Turns Reached — Round Drawn</span>`);
  addLog(`> 🚫 ROUND ${roundNumber} DRAW. MAXIMUM MATCH LENGTH REACHED.`, 'deadlock');
  
  roundResults.push('MaxTurns');
  revivalUsage.push(revivalsUsed);
  
  if (gameMode === 'online' && roomRef && mySymbol === 'X' && !fromFirebase) {
    roomRef.update({
      status: 'round_max_turns',
      roundResults,
      revivalUsage
    });
  }
  
  checkMatchCompletion('Max Turns Reached!', 'Maximum Match Length Reached (200+ turns).', '🚫');
}

function handleDraw(fromFirebase = false) {
  gameActive = false;
  board.classList.add('shake');
  setTimeout(() => board.classList.remove('shake'), 500);
  addLog(`> 🤝 ROUND ${roundNumber} DRAW DECLARED.`, 'draw');
  
  roundResults.push('Draw');
  revivalUsage.push(revivalsUsed);
  
  board.classList.add('disabled');
  setStatusHTML(`<span class="status-draw">🤝 ROUND DRAW!</span>`);
  
  if (gameMode === 'online' && roomRef && mySymbol === 'X' && !fromFirebase) {
    roomRef.update({
      status: 'round_draw',
      roundResults,
      revivalUsage
    });
  }
  
  checkMatchCompletion('ROUND DRAW', `No more revival chances remaining in Round ${roundNumber}.`, '🤝');
}

function handleDeadlock(fromFirebase = false) {
  gameActive = false;
  board.classList.add('disabled');
  cells.forEach(cell => {
    if (boardState[parseInt(cell.dataset.index)] === '') cell.classList.add('deadlock-cell');
  });
  board.classList.add('shake');
  setTimeout(() => board.classList.remove('shake'), 500);
  setStatusHTML(`<span class="status-deadlock">🔒 Deadlock! No player can win this round.</span>`);
  addLog(`> 🔒 DEADLOCK DETECTED IN ROUND ${roundNumber}.`, 'deadlock');
  
  roundResults.push('Deadlock');
  revivalUsage.push(revivalsUsed);
  
  if (gameMode === 'online' && roomRef && mySymbol === 'X' && !fromFirebase) {
    roomRef.update({
      status: 'round_deadlock',
      roundResults,
      revivalUsage
    });
  }
  
  checkMatchCompletion('DEADLOCK!', `No winning moves remain in Round ${roundNumber}.`, '🔒');
}

// ═══════════════════════════════════════════════════════════════
//  PART 14: AI ENGINE
// ═══════════════════════════════════════════════════════════════

const AI_DELAY_MS = 440;

function triggerAIMove() {
  aiThinking = true;
  setStatusHTML(`<span class="status-wait">🤖 AI CALCULATING RESPONSE…</span>`);
  addLog('> AI CALCULATING RESPONSE…', 'ai');
  setTimeout(() => {
    const index = getAIMove(aiDifficulty);
    if (index === -1) { aiThinking = false; return; }
    const cellNames = ['A1','A2','A3','B1','B2','B3','C1','C2','C3'];
    placeMark(cells[index], index);
    aiThinking = false;
    board.classList.remove('disabled');
    addLog(`> AI DEPLOYED [${currentPlayer}] AT ${cellNames[index]}`, 'ai');

    // 1. Check WIN
    const win = checkWin();
    if (win) { handleWin(win); return; }

    // 2. If board is full (Revival or Draw)
    if (isBoardFull()) {
      if (revivalsRemaining > 0) {
        revivalsRemaining--;
        revivalsUsed++;
        updateDrawUI();
        const oldX = xMoveHistory.shift();
        const oldO = oMoveHistory.shift();
        boardState[oldX] = '';
        boardState[oldO] = '';
        addLog(`> DRAW DETECTED. REVIVAL ACTIVATED (${revivalsRemaining}/3 REMAINING)`, 'draw');

        currentPlayer = mySymbol;
        setStatusTurn(); updateActiveCard();
        addLog(`> CURRENT TURN: YOU (WAITING…)`, 'active');

        expireTwoCellsVisually(oldX, oldO, null);
        return;
      } else {
        handleDraw();
        return;
      }
    }

    // 3. If board is NOT full and revivalsRemaining === 0 -> check Deadlock
    if (!isBoardFull() && revivalsRemaining === 0 && isDeadlock()) {
      handleDeadlock();
      return;
    }

    // 4. Otherwise continue round
    currentPlayer = mySymbol;
    setStatusTurn(); updateActiveCard();
    addLog(`> CURRENT TURN: YOU (WAITING…)`, 'active');

    // Turn count limit protection check
    if (turnCount >= 200) {
      handleMaxTurnsDraw();
      return;
    }
  }, AI_DELAY_MS);
}

function getAIMove(diff) {
  const empties = boardState.reduce((a,v,i) => v === '' ? [...a,i] : a, []);
  if (!empties.length) return -1;
  switch (diff) {
    case 'easy':   return randomMove(empties);
    case 'medium': return mediumMove(empties);
    case 'hard':   return minimaxBestMove();
    default:       return randomMove(empties);
  }
}

function randomMove(empties) { return empties[Math.floor(Math.random() * empties.length)]; }

function mediumMove(empties) {
  const ai  = currentPlayer;
  const hum = ai === 'X' ? 'O' : 'X';
  for (const i of empties) {
    boardState[i] = ai;
    if (checkWinOnState(boardState)) { boardState[i] = ''; return i; }
    boardState[i] = '';
  }
  for (const i of empties) {
    boardState[i] = hum;
    if (checkWinOnState(boardState)) { boardState[i] = ''; return i; }
    boardState[i] = '';
  }
  if (boardState[4] === '') return 4;
  return randomMove(empties);
}

/**
 * MINIMAX WITH ALPHA-BETA PRUNING (Hard AI)
 * Explores all future game states. AI maximises score, human minimises.
 * Alpha-beta pruning eliminates irrelevant branches.
 * Score: AI win = +10−depth (prefer quick wins), Human win = depth−10.
 */
function minimaxBestMove() {
  const ai = currentPlayer;
  let best = -Infinity, bestIdx = -1;
  for (let i = 0; i < 9; i++) {
    if (boardState[i] !== '') continue;
    
    // Clone simulated state and histories
    const nextState = [...boardState];
    const nextXHistory = [...xMoveHistory];
    const nextOHistory = [...oMoveHistory];
    
    // Place move
    nextState[i] = ai;
    if (ai === 'X') nextXHistory.push(i);
    else            nextOHistory.push(i);
    
    const s = minimax(nextState, nextXHistory, nextOHistory, 0, false, -Infinity, Infinity, ai, revivalsRemaining);
    if (s > best) { best = s; bestIdx = i; }
  }
  return bestIdx;
}

function minimax(state, xHist, oHist, depth, isMax, alpha, beta, ai, simRevivals) {
  if (depth >= 16) return 0; // Prevent infinite recursion
  const hum    = ai === 'X' ? 'O' : 'X';
  const winner = checkWinOnState(state);
  if (winner === ai)  return 10 - depth;
  if (winner === hum) return depth - 10;
  if (simRevivals === 0 && isDeadlockOnState(state)) return 0;
  
  const currPlayer = isMax ? ai : hum;
  
  // Clone simulated state and histories
  let simState = [...state];
  let simXHist = [...xHist];
  let simOHist = [...oHist];
  let nextRevivals = simRevivals;
  
  // If simulated board is full, try to apply revival
  if (simState.every(v => v !== '')) {
    if (nextRevivals > 0) {
      nextRevivals--;
      if (simXHist.length > 0 && simOHist.length > 0) {
        const oldX = simXHist.shift();
        const oldO = simOHist.shift();
        simState[oldX] = '';
        simState[oldO] = '';
      }
    } else {
      return 0; // Draw state
    }
  }
  
  // Find empty cells
  const empties = [];
  for (let i = 0; i < 9; i++) {
    if (simState[i] === '') empties.push(i);
  }
  
  if (empties.length === 0) return 0;
  
  if (isMax) {
    let best = -Infinity;
    for (const i of empties) {
      const nextState = [...simState];
      const nextXHist = [...simXHist];
      const nextOHist = [...simOHist];
      nextState[i] = ai;
      if (ai === 'X') nextXHist.push(i);
      else            nextOHist.push(i);
      
      best  = Math.max(best, minimax(nextState, nextXHist, nextOHist, depth+1, false, alpha, beta, ai, nextRevivals));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empties) {
      const nextState = [...simState];
      const nextXHist = [...simXHist];
      const nextOHist = [...simOHist];
      nextState[i] = hum;
      if (hum === 'X') nextXHist.push(i);
      else            nextOHist.push(i);
      
      best  = Math.min(best, minimax(nextState, nextXHist, nextOHist, depth+1, true, alpha, beta, ai, nextRevivals));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function checkWinOnState(state) {
  for (const [a,b,c] of WIN_COMBOS) {
    if (state[a] && state[a] === state[b] && state[b] === state[c]) return state[a];
  }
  return null;
}

function isDeadlockOnState(state) {
  if (state.every(v => v !== '')) return false;
  for (const combo of WIN_COMBOS) {
    const vals = combo.map(i => state[i]);
    if (!vals.includes('O')) return false;
    if (!vals.includes('X')) return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
//  PART 15: SYSTEM LOG
// ═══════════════════════════════════════════════════════════════

const MAX_LOG_LINES = 30;

/**
 * addLog(text, type)
 * Appends a line to the system console.
 * @param {string} text  - log message
 * @param {string} type  - 'active' | 'win' | 'draw' | 'deadlock' | 'ai' | '' (default)
 */
function addLog(text, type = '') {
  if (!logEntries) return;
  const line = document.createElement('div');
  line.classList.add('log-line');
  if (type) line.classList.add(`log-${type}`);
  line.textContent = text;
  logEntries.appendChild(line);

  // Remove old lines
  while (logEntries.children.length > MAX_LOG_LINES) {
    logEntries.removeChild(logEntries.firstChild);
  }

  // Auto-scroll to bottom
  logEntries.scrollTop = logEntries.scrollHeight;
}

function clearSysLog() {
  if (!logEntries) return;
  logEntries.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════════
//  PART 16: MATCH HISTORY (localStorage)
// ═══════════════════════════════════════════════════════════════

const HISTORY_KEY = 'ttt_arena_history';
const MAX_HISTORY = 50;

function persistMatchResult({ winner, result }) {
  const history = loadHistoryRaw();
  history.unshift({
    winner, result,
    mode:       gameMode,
    difficulty: gameMode === 'ai' ? aiDifficulty : null,
    roomCode:   gameMode === 'online' ? roomCode : null,
    duration:   Math.round((Date.now() - matchStartTime) / 1000),
    date:       new Date().toISOString(),
    roundResults: [...roundResults],
    revivalUsage: [...revivalUsage]
  });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadHistoryRaw() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function renderHistory() {
  const history = loadHistoryRaw();
  if (!history.length) {
    historyList.innerHTML = `<div class="empty-state">🎮 No matches played yet.<br>Choose a mode and start battling!</div>`;
    return;
  }
  historyList.innerHTML = history.map(m => {
    const dt = new Date(m.date);
    const dateStr = dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
    const timeStr = dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false });
    const modeStr = m.mode === 'ai'
      ? `AI · ${m.difficulty ? (m.difficulty.charAt(0).toUpperCase()+m.difficulty.slice(1)) : '?'}`
      : m.mode === 'online' ? `Online · ${m.roomCode || '?'}` : 'Local PvP';
    const icons = { win:'🏆', draw:'🤝', deadlock:'🔒' };
    const icon  = icons[m.result] || '❓';
    
    let detailsHtml = '';
    if (m.roundResults && m.roundResults.length > 0) {
      const resultsText = m.roundResults.map((res, idx) => {
        const rev = m.revivalUsage && m.revivalUsage[idx] !== undefined ? m.revivalUsage[idx] : 0;
        return `R${idx + 1}: ${res} (Hearts Used: ${rev}/3)`;
      }).join(' · ');
      detailsHtml = `<div class="hi-details">${escHtml(resultsText)}</div>`;
    }
    
    return `<div class="hi-row">
      <span class="hi-icon">${icon}</span>
      <div class="hi-info">
        <div class="hi-win">${escHtml(m.winner)}</div>
        <div class="hi-meta">${escHtml(modeStr)} · ${formatDuration(m.duration)}</div>
        ${detailsHtml}
      </div>
      <div class="hi-date"><span>${dateStr}</span><span>${timeStr}</span></div>
    </div>`;
  }).join('');
}

btnClearHistory.addEventListener('click', () => {
  if (!confirm('Clear all match history? This cannot be undone.')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// ═══════════════════════════════════════════════════════════════
//  PART 17: LEADERBOARD (localStorage)
// ═══════════════════════════════════════════════════════════════

const LB_KEY = 'ttt_arena_leaderboard';

function updateLeaderboard(winner, result) {
  const lb = loadLBRaw();
  const nameX = gameMode === 'ai' ? 'You (X)'  : 'Player X';
  const nameO = gameMode === 'ai' ? `AI (${aiDifficulty})` : 'Player O';
  if (!lb.X) lb.X = { name: nameX, wins:0, losses:0, draws:0, games:0 };
  if (!lb.O) lb.O = { name: nameO, wins:0, losses:0, draws:0, games:0 };
  lb.X.name = nameX; lb.O.name = nameO;
  lb.X.games++; lb.O.games++;
  if (result === 'win' && winner) {
    lb[winner].wins++;
    lb[winner === 'X' ? 'O' : 'X'].losses++;
  } else if (result === 'draw') { lb.X.draws++; lb.O.draws++; }
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

function loadLBRaw() {
  try { return JSON.parse(localStorage.getItem(LB_KEY)) || {}; }
  catch { return {}; }
}

function renderLeaderboard() {
  const lb = loadLBRaw();
  const players = Object.values(lb).sort((a,b) => b.wins - a.wins || a.losses - b.losses);
  if (!players.length) {
    leaderboardBody.innerHTML = `<tr><td colspan="5" class="empty-state">No data yet.<br>Play some matches to build the leaderboard!</td></tr>`;
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  leaderboardBody.innerHTML = players.map((p, i) => {
    const drawPct = p.games > 0 ? Math.round((p.draws / p.games) * 100) : 0;
    return `<tr>
      <td>${medals[i] || (i+1)}</td>
      <td class="lb-name">${escHtml(p.name)}</td>
      <td class="lb-wins">${p.wins}</td>
      <td class="lb-loss">${p.losses}</td>
      <td>${drawPct}%</td>
    </tr>`;
  }).join('');
}

btnClearLeaderboard.addEventListener('click', () => {
  if (!confirm('Reset the leaderboard? This cannot be undone.')) return;
  localStorage.removeItem(LB_KEY);
  renderLeaderboard();
});

// ═══════════════════════════════════════════════════════════════
//  PART 18: UI HELPERS
// ═══════════════════════════════════════════════════════════════

function getPlayerLabel(sym) {
  if (gameMode === 'ai')     return sym === mySymbol ? 'You' : 'AI';
  if (gameMode === 'online') {
    return sym === 'X' ? onlinePlayerNameX : onlinePlayerNameO;
  }
  return `Player ${sym}`;
}

function formatDuration(secs) {
  if (!secs || secs < 0) return '—';
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateDrawUI() {
  drawCountEl.textContent = `Revival Chances: ${revivalsRemaining}/3`;
  pips.forEach((p, i) => {
    if (i < revivalsRemaining) {
      p.textContent = '❤️';
      p.className = 'mpip mheart active';
    } else {
      p.textContent = '🩶';
      p.className = 'mpip mheart empty';
    }
  });
}


function setStatusTurn() {
  const lbl = getPlayerLabel(currentPlayer);
  const sym = currentPlayer.toLowerCase();
  if (lbl === 'You') {
    statusMessage.innerHTML = `
      <span class="turn-indicator">
        <span class="turn-sym ${sym}-sym">${currentPlayer}</span>
        <span>&nbsp;Your Turn</span>
      </span>`;
  } else {
    statusMessage.innerHTML = `
      <span class="turn-indicator">
        <span class="turn-sym ${sym}-sym">${currentPlayer}</span>
        <span>&nbsp;${lbl}&apos;s Turn</span>
      </span>`;
  }
}

function setStatusHTML(html) { statusMessage.innerHTML = html; }

function updateActiveCard() {
  scoreXCard.classList.toggle('active', currentPlayer === 'X');
  scoreOCard.classList.toggle('active', currentPlayer === 'O');
}

// ═══════════════════════════════════════════════════════════════
//  PART 19: WIN LINE SVG
// ═══════════════════════════════════════════════════════════════

/**
 * drawWinLine — Pure JS animation (no CSS keyframe with CSS variable).
 * Sets initial dash state → forces reflow → applies CSS transition → animates to 0.
 * This works reliably across all browsers including Safari/Mobile.
 */
function drawWinLine(combo) {
  const key    = combo.join(',');
  const coords = WIN_LINE_COORDS[key];
  if (!coords) return;
  const [x1, y1, x2, y2] = coords;
  winLine.setAttribute('x1', x1);
  winLine.setAttribute('y1', y1);
  winLine.setAttribute('x2', x2);
  winLine.setAttribute('y2', y2);

  const len = Math.hypot(x2 - x1, y2 - y1);

  // 1. Disable transition and set INITIAL invisible state
  winLine.style.transition       = 'none';
  winLine.style.strokeDasharray  = len + 'px';
  winLine.style.strokeDashoffset = len + 'px';
  winLine.style.opacity          = '0';

  // 2. Force the browser to flush/apply the initial state before animating
  winLine.getBoundingClientRect();

  // 3. Re-enable transitions (from CSS) and animate to FINAL drawn state
  winLine.style.transition       = '';
  winLine.style.strokeDashoffset = '0px';
  winLine.style.opacity          = '1';
}

function hideWinLine() {
  // Instant hide — no transition
  winLine.style.transition       = 'none';
  winLine.style.strokeDashoffset = '400px';
  winLine.style.opacity          = '0';
  winLine.setAttribute('x1', 0);
  winLine.setAttribute('y1', 0);
  winLine.setAttribute('x2', 0);
  winLine.setAttribute('y2', 0);
}

// ═══════════════════════════════════════════════════════════════
//  PART 20: OUTCOME MODAL
// ═══════════════════════════════════════════════════════════════

function showModal(icon, title, subtitle) {
  modalIcon.textContent     = icon;
  modalTitle.textContent    = title.toUpperCase();
  modalSubtitle.textContent = subtitle;
  
  const isMatchOver = !!matchWinner || (roundNumber >= 3);
  
  if (gameMode === 'online') {
    modalNewRound.style.display = ''; // Always show both buttons in online mode
    if (mySymbol === 'X') {
      modalNewRound.disabled = false;
      modalNewRound.textContent = isMatchOver ? 'RESTART MATCH' : 'NEXT ROUND';
    } else {
      modalNewRound.disabled = true;
      modalNewRound.textContent = 'WAITING FOR HOST...';
    }
  } else {
    modalNewRound.disabled = false;
    modalNewRound.textContent = isMatchOver ? 'RESTART MATCH' : 'NEXT ROUND';
    modalNewRound.style.display = '';
  }
  
  modalOverlay.classList.add('visible');
}

function closeModal() { modalOverlay.classList.remove('visible'); }

// ═══════════════════════════════════════════════════════════════
//  PART 21: EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

// Cell clicks + keyboard
cells.forEach(cell => {
  cell.addEventListener('click', handleCellClick);
  cell.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCellClick({ currentTarget: cell }); }
  });
});

// New round
btnNewRound.addEventListener('click', () => {
  if (gameMode === 'online') {
    if (matchWinner || roundNumber >= 3) {
      onlineResetMatch();
    } else {
      onlineNextRound();
    }
    return;
  }
  
  if (matchWinner || roundNumber >= 3) {
    startGame();
    return;
  }
  currentPlayer = 'X';
  roundNumber = Math.min(3, roundNumber + 1);
  updateRoundDisplay();
  clearSysLog();
  addLog(`ROUND ${roundNumber} BEGIN. ARENA PRIMED.`, 'active');
  initRound();
});

// Reset
btnReset.addEventListener('click', () => { currentPlayer = 'X'; resetGame(); });

// Modal buttons
modalNewRound.addEventListener('click', () => {
  if (gameMode === 'online') {
    if (matchWinner || roundNumber >= 3) {
      onlineResetMatch();
    } else {
      onlineNextRound();
    }
    return;
  }
  
  if (matchWinner || roundNumber >= 3) {
    startGame();
    return;
  }
  currentPlayer = 'X';
  roundNumber = Math.min(3, roundNumber + 1);
  updateRoundDisplay();
  clearSysLog();
  addLog(`ROUND ${roundNumber} BEGIN.`, 'active');
  initRound();
});
modalReset.addEventListener('click', () => { currentPlayer = 'X'; resetGame(); });

// Animate mini-board in preview (cycling highlight)
function animateMiniBoard() {
  const mini = document.getElementById('mini-board');
  if (!mini) return;
  const cells = mini.querySelectorAll('.mw-cell');
  let activeIdx = 4;
  setInterval(() => {
    cells.forEach(c => c.classList.remove('mw-active'));
    const active = mini.querySelector('.mw-cx, .mw-co');
    if (cells[activeIdx]) cells[activeIdx].classList.add('mw-active');
  }, 2500);
}

// ═══════════════════════════════════════════════════════════════
//  PART 22: INIT
// ═══════════════════════════════════════════════════════════════

(function init() {
  initParticles();
  initCursorGlow();
  initLoader();
  animateMiniBoard();
  initAuth();
})();

// ═══════════════════════════════════════════════════════════════
//  PART 23: PLAYER PROFILE & UNIQUE IDENTITY SYSTEM
// ═══════════════════════════════════════════════════════════════

const PROFILE_KEY = 'ttt_arena_player_profile';

function generateRawFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'TTT-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generatePlayerId() {
  return generateRawFriendCode();
}

/** Standardized Friend Code normalization (always returns TTT-XXXXXXXX) */
function normalizeFriendCode(code) {
  if (!code || typeof code !== 'string') return '';
  const trimmed = code.trim().toUpperCase();
  const stripped = trimmed.replace(/^TTT-?/, '');
  return stripped ? `TTT-${stripped}` : '';
}

/** Raw alphanumeric Friend Code suffix (without TTT-) */
function normalizeFriendCodeRaw(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase().replace(/^TTT-?/, '');
}

/** Helper to identify if a friendCode is an old Firebase UID or non-standard format */
function isLegacyUidFriendCode(code, uid = null) {
  if (!code || typeof code !== 'string') return true;
  const trimmed = code.trim();
  if (uid && trimmed === uid) return true;
  if (trimmed.length > 20) return true;
  const raw = trimmed.replace(/^TTT-?/i, '');
  if (!/^[A-Z0-9]{4,12}$/i.test(raw)) return true;
  return false;
}

/** Generates a globally unique Friend Code by checking against Firebase */
async function generateUniqueFriendCode(targetUid = null) {
  if (!fbDB) return generateRawFriendCode();
  for (let attempt = 0; attempt < 25; attempt++) {
    const raw = generateRawFriendCode();
    const normalized = normalizeFriendCode(raw);
    try {
      const snap = await fbDB.ref(`friendCodes/${normalized}`).once('value');
      const existingUid = snap.val();
      if (!existingUid || (targetUid && existingUid === targetUid)) {
        return normalized;
      }
    } catch (e) {
      console.warn('[TTTArena] Friend code collision check error:', e);
      return normalized;
    }
  }
  return generateRawFriendCode();
}

/** Case-insensitive username normalization */
function normalizeUsername(name) {
  return (name || '').trim().replace(/^@+/, '').toLowerCase();
}

/** Checks whether a username is already taken by another user (case-insensitively) */
async function isUsernameTaken(rawName, currentUid = null) {
  const normalized = normalizeUsername(rawName);
  if (!normalized || !fbDB) return false;
  try {
    // Direct O(1) lookup in usernames/ collection
    const snap = await fbDB.ref(`usernames/${normalized}`).once('value');
    const ownerUid = snap.val();
    if (ownerUid && ownerUid !== currentUid) {
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[TTTArena] isUsernameTaken check warning:', e);
    return false;
  }
}

/** Claims/releases username and friendCode mappings in Firebase safely */
async function claimIdentity(uid, rawName, rawFriendCode, oldRawName = null, oldRawFriendCode = null) {
  if (!fbDB || !uid) return;
  const normalizedNewUsername = normalizeUsername(rawName);
  const normalizedOldUsername = oldRawName ? normalizeUsername(oldRawName) : null;
  const shortNewFriendCode = normalizeFriendCodeRaw(rawFriendCode);
  const fullNewFriendCode = normalizeFriendCode(rawFriendCode);
  const shortOldFriendCode = oldRawFriendCode ? normalizeFriendCodeRaw(oldRawFriendCode) : null;
  const fullOldFriendCode = oldRawFriendCode ? normalizeFriendCode(oldRawFriendCode) : null;

  console.log("[IdentityDebug] current UID:", uid);
  console.log("[IdentityDebug] username:", rawName);
  console.log("[IdentityDebug] friendCode:", fullNewFriendCode);
  console.log("[IdentityDebug] username index:", normalizedNewUsername);
  console.log("[IdentityDebug] friendCode index:", shortNewFriendCode);

  try {
    // 1. If username changed, release old index if owned by this UID
    if (normalizedOldUsername && normalizedOldUsername !== normalizedNewUsername) {
      try {
        const oldSnap = await fbDB.ref(`usernames/${normalizedOldUsername}`).once('value');
        if (oldSnap.val() === uid) {
          await fbDB.ref(`usernames/${normalizedOldUsername}`).remove();
        }
      } catch (e) {
        console.warn("[Identity] Clean old username error:", e);
      }
    }

    // 2. Claim new username index
    if (normalizedNewUsername) {
      try {
        const uSnap = await fbDB.ref(`usernames/${normalizedNewUsername}`).once('value');
        const currentOwner = uSnap.val();
        if (!currentOwner || currentOwner === uid) {
          await fbDB.ref(`usernames/${normalizedNewUsername}`).set(uid);
        }
      } catch (e) {
        console.warn("[Identity] Set username index error:", e);
      }
    }

    // 3. If friend code changed, release old index if owned by this UID
    if (shortOldFriendCode && shortOldFriendCode !== shortNewFriendCode) {
      try {
        const [oldFSnap1, oldFSnap2] = await Promise.all([
          fbDB.ref(`friendCodes/${shortOldFriendCode}`).once('value').catch(() => null),
          fullOldFriendCode ? fbDB.ref(`friendCodes/${fullOldFriendCode}`).once('value').catch(() => null) : null
        ]);
        if (oldFSnap1 && oldFSnap1.val() === uid) {
          await fbDB.ref(`friendCodes/${shortOldFriendCode}`).remove();
        }
        if (oldFSnap2 && oldFSnap2.val() === uid) {
          await fbDB.ref(`friendCodes/${fullOldFriendCode}`).remove();
        }
      } catch (e) {
        console.warn("[Identity] Clean old friendCode error:", e);
      }
    }

    // 4. Claim canonical friend code index (both short key e.g. CEPR84U7 and full key e.g. TTT-CEPR84U7)
    if (shortNewFriendCode) {
      try {
        const fSnap = await fbDB.ref(`friendCodes/${shortNewFriendCode}`).once('value');
        const currentOwner = fSnap.val();
        if (!currentOwner || currentOwner === uid) {
          await fbDB.ref(`friendCodes/${shortNewFriendCode}`).set(uid);
        }
      } catch (e) {
        console.warn("[Identity] Set short friendCode index error:", e);
      }

      if (fullNewFriendCode) {
        try {
          const fSnapFull = await fbDB.ref(`friendCodes/${fullNewFriendCode}`).once('value');
          const currentOwnerFull = fSnapFull.val();
          if (!currentOwnerFull || currentOwnerFull === uid) {
            await fbDB.ref(`friendCodes/${fullNewFriendCode}`).set(uid);
          }
        } catch (e) {
          console.warn("[Identity] Set full friendCode index error:", e);
        }
      }
    }
  } catch (err) {
    console.warn('[TTTArena] claimIdentity sync warning:', err);
  }
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; }
  catch { return null; }
}

function saveProfileLocal(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

let playerProfile = null;
let selectedEmoji = '⚡';

function initPlayerProfile() {
  playerProfile = loadProfile();
  if (playerProfile) {
    renderPlayerIdPillV2();
  }
}

function showProfileSetupModal() {
  const modal = document.getElementById('profile-setup-modal');
  if (modal) modal.classList.add('visible');
  const firstOpt = document.querySelector('.emoji-opt');
  if (firstOpt) {
    firstOpt.classList.add('selected');
    selectedEmoji = firstOpt.dataset.emoji || '⚡';
  }
}

function hideProfileSetupModal() {
  const modal = document.getElementById('profile-setup-modal');
  if (modal) modal.classList.remove('visible');
}

function renderPlayerIdPill() {
  renderPlayerIdPillV2();
}

async function saveProfileToFirebase(profile) {
  if (!fbDB || !profile || !profile.playerId) return;
  try {
    await fbDB.ref(`players/${profile.playerId}`).update({
      name:       profile.name,
      emoji:      profile.emoji,
      friendCode: profile.friendCode || '',
      createdAt:  profile.createdAt || Date.now(),
    });
  } catch(e) { console.warn('[TTTArena] Profile save failed:', e); }
}

// Profile setup modal — emoji picker
document.querySelectorAll('.emoji-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEmoji = btn.dataset.emoji || '⚡';
  });
});

// Allow Enter key in name input
document.getElementById('profile-name-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-profile-confirm')?.click();
});

// ═══════════════════════════════════════════════════════════════
//  PART 24: ONLINE PRESENCE SYSTEM
// ═══════════════════════════════════════════════════════════════

function initPresence(playerId) {
  if (!fbDB || !playerId) return;
  try {
    const playerRef = fbDB.ref(`players/${playerId}`);
    const connRef   = fbDB.ref('.info/connected');
    connRef.on('value', snap => {
      if (!snap.val()) return;
      playerRef.update({ online: true, lastSeen: Date.now() });
      playerRef.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
    });
  } catch(e) { console.warn('[TTTArena] Presence init failed:', e); }
}

// ═══════════════════════════════════════════════════════════════
//  PART 25: FRIEND SYSTEM (DELEGATED TO ENHANCED HANDLERS)
// ═══════════════════════════════════════════════════════════════

let friendsListener = null;
let friendsCache    = {};

function openFriendsScreen() {
  if (!requireAuth('use the Friend Network')) return;
  showScreen('screen-friends');
  syncFriendsTabs('fpanel-friends', 'ftab-friends');
  const ok = initFirebase();
  if (!ok) {
    renderFriendsNoFirebase();
    return;
  }
  renderFriendsList();
  listenForFriendRequests();
}

function renderFriendsNoFirebase() {
  const list = document.getElementById('friends-list');
  if (list) list.innerHTML = `
    <div class="empty-state">
      🔒 Online friend system requires Firebase setup.<br>
      <span style="font-size:0.8em;color:var(--text-3);margin-top:6px;display:block">
        Open <code>firebase-config.js</code> and follow the step-by-step instructions.
      </span>
    </div>`;
}

// ── Send Match Invite ─────────────────────────────────────────
async function sendMatchInvite(friendId, friendName) {
  if (!fbDB || !playerProfile) return;
  const currentUser = await ensureFirebaseAuth();
  if (!currentUser) {
    showToast('Please sign in to send match invites.', 'warn');
    return;
  }
  const code  = generateRoomCode();
  const ref   = fbDB.ref(`ttt_rooms/${code}`);
  const profile = playerProfile || loadProfile() || { name: 'Player X', emoji: '⚡', playerId: currentUser.uid, friendCode: generatePlayerId() };

  try {
    await ref.set({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      status: 'waiting',
      winner: null,
      combo: null,
      scoresX: 0,
      scoresO: 0,
      createdAt: Date.now(),
      creatorId: currentUser.uid,
      creatorName: profile.name || 'Player X',
      creatorEmoji: profile.emoji || '⚡',
      creatorFriendCode: profile.friendCode || '',
      joinerId: '',
      joinerName: '',
      joinerEmoji: '',
      joinerFriendCode: '',
      revivalsRemaining: 3,
      revivalsUsed: 0,
      roundNumber: 1,
      matchWinner: null,
      xMoveHistory: [],
      oMoveHistory: [],
      turnCount: 0
    });
    const inviteId = `${currentUser.uid}_${Date.now()}`;
    await fbDB.ref(`invites/${friendId}/${inviteId}`).set({
      fromPlayerId: currentUser.uid,
      fromUid:      currentUser.uid,
      fromName:     profile.name,
      fromEmoji:    profile.emoji,
      roomCode:     code,
      timestamp:    Date.now(),
      status:       'pending',
    });
    showToast(`Invite sent to ${escHtml(friendName)}! Room: ${code}`, 'success');
    // Navigate to lobby as host
    const ok = initFirebase();
    firebaseWarning.style.display    = ok ? 'none' : 'flex';
    lobbyPanel.style.display         = ok ? 'flex' : 'none';
    createdCodeDisplay.style.display = 'flex';
    createdCodeValue.textContent     = code;
    joinCodeInput.value              = '';
    joinError.style.display          = 'none';
    updateInviteLink(code);
    showScreen('screen-online-lobby');
    mySymbol = 'X'; roomCode = code;
    if (joinWatcher && roomRef) { roomRef.off('value', joinWatcher); joinWatcher = null; }
    joinWatcher = ref.on('value', snap => {
      const d = snap.val();
      if (d && d.status === 'playing') {
        ref.off('value', joinWatcher); joinWatcher = null;
        startOnlineGame(code, 'X', ref);
      }
    });
  } catch(e) {
    console.warn('[TTTArena] Send invite failed:', e);
    showToast('Failed to send invite. Try again.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 26: INCOMING INVITE SYSTEM
// ═══════════════════════════════════════════════════════════════

let inviteListener    = null;
let activeInvitePopup = false;

function listenForInvites() {
  if (!fbDB || !playerProfile) return;
  if (inviteListener) {
    try { fbDB.ref(`invites/${playerProfile.playerId}`).off('value', inviteListener); } catch{}
    inviteListener = null;
  }
  inviteListener = fbDB.ref(`invites/${playerProfile.playerId}`).on('value', snap => {
    const data = snap.val() || {};
    const now  = Date.now();
    const EXPIRE = 5 * 60 * 1000;
    Object.entries(data).forEach(([inviteId, invite]) => {
      if (invite.status !== 'pending') return;
      if (now - invite.timestamp > EXPIRE) {
        fbDB.ref(`invites/${playerProfile.playerId}/${inviteId}`).update({ status: 'expired' });
        return;
      }
      if (!activeInvitePopup) showInvitePopup(inviteId, invite);
    });
  });
}

function showInvitePopup(inviteId, invite) {
  const popup = document.getElementById('invite-popup');
  if (!popup) return;
  activeInvitePopup = true;
  const emoji = escHtml(invite.fromEmoji || '⚡');
  const name  = escHtml(invite.fromName  || 'A friend');
  const code  = escHtml(invite.roomCode  || '');
  popup.innerHTML = `
    <div class="invite-card">
      <div class="invite-icon">${emoji}</div>
      <div class="invite-body">
        <div class="invite-title">⚡ MATCH INVITE</div>
        <div class="invite-from">${name} challenged you!</div>
        <div class="invite-room">Room: <strong>${code}</strong></div>
      </div>
      <div class="invite-actions">
        <button class="btn-invite-accept" id="btn-invite-accept">Accept</button>
        <button class="btn-invite-decline" id="btn-invite-decline">Decline</button>
      </div>
    </div>`;
  popup.classList.add('visible');
  document.getElementById('btn-invite-accept')?.addEventListener('click', async () => {
    popup.classList.remove('visible');
    activeInvitePopup = false;
    if (fbDB && playerProfile) {
      try { await fbDB.ref(`invites/${playerProfile.playerId}/${inviteId}`).update({ status: 'accepted' }); } catch{}
    }
    showToast(`Joining ${invite.fromName || 'friend'}'s room…`, 'info');
    acceptInvite(invite.roomCode);
  });
  document.getElementById('btn-invite-decline')?.addEventListener('click', async () => {
    popup.classList.remove('visible');
    activeInvitePopup = false;
    if (fbDB && playerProfile) {
      try { await fbDB.ref(`invites/${playerProfile.playerId}/${inviteId}`).update({ status: 'declined' }); } catch{}
    }
    showToast('Invite declined.', 'info');
  });
}

async function acceptInvite(code) {
  console.log("\n=== ACCEPT INVITE START ===");
  console.log("Code received:", code);
  console.log("Before join - ROLE:", mySymbol);
  console.log("Before join - ROOM CODE:", roomCode);
  console.log("Before join - GAME ACTIVE:", gameActive);
  console.log("Before join - CURRENT TURN:", currentPlayer);

  if (!code || !fbDB) return;
  const ok = initFirebase();
  firebaseWarning.style.display    = ok ? 'none' : 'flex';
  lobbyPanel.style.display         = ok ? 'flex' : 'none';
  createdCodeDisplay.style.display = 'none';
  joinCodeInput.value              = code;
  joinError.style.display          = 'none';

  const proceed = async () => {
    showScreen('screen-online-lobby');
    await joinRoomByCode(code);
  };

  const landing = document.getElementById('landing');
  if (landing && landing.classList.contains('visible')) {
    enterGame(proceed);
  } else {
    await proceed();
  }

  console.log("--- acceptInvite finished ---");
  console.log("ROLE:", mySymbol);
  console.log("GAME ACTIVE:", gameActive);
  console.log("ROOM CODE:", roomCode);
  console.log("ROOM REF:", !!roomRef);
  console.log("CURRENT TURN:", currentPlayer);
  console.log("LOCKED:", board.classList.contains('disabled'));
  console.log("CAN_PLAY:", mySymbol === currentPlayer);
}

// ═══════════════════════════════════════════════════════════════
//  PART 27: INVITE LINK SYSTEM
// ═══════════════════════════════════════════════════════════════

function generateInviteLink(code) {
  let base = window.location.origin + window.location.pathname;
  if (window.location.protocol === 'file:') {
    base = 'http://localhost:8000/';
  }
  return `${base}?room=${code}`;
}

function updateInviteLink(code) {
  const row   = document.getElementById('invite-link-row');
  const input = document.getElementById('invite-link-value');
  if (!row || !input || !code) return;
  input.value = generateInviteLink(code);
  row.style.display = 'flex';
}

function hideInviteLink() {
  const row = document.getElementById('invite-link-row');
  if (row) row.style.display = 'none';
}

// Copy invite link button
document.getElementById('btn-copy-invite-link')?.addEventListener('click', function() {
  const val = document.getElementById('invite-link-value')?.value;
  if (!val) return;
  navigator.clipboard.writeText(val).catch(() => {
    const t = document.createElement('input'); t.value = val;
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
  });
  showToast('Invite link copied! Send it to your friend.', 'success');
  this.textContent = '✅';
  setTimeout(() => { this.textContent = '🔗'; }, 1800);
});

// Share invite link button
document.getElementById('btn-share-invite')?.addEventListener('click', () => {
  const val = document.getElementById('invite-link-value')?.value;
  if (!val) return;
  if (navigator.share) {
    navigator.share({ title: 'TTT Arena — Join My Room!', text: 'I challenged you to Tic-Tac-Toe! Click to join:', url: val }).catch(() => {});
  } else {
    navigator.clipboard.writeText(val).catch(() => {});
    showToast('Invite link copied! (Web Share not supported on this browser)', 'info');
  }
});



// ═══════════════════════════════════════════════════════════════
//  PART 28: ENHANCED ONLINE LOBBY
// ═══════════════════════════════════════════════════════════════

// Observe created-code-value for text changes → auto-show invite link
(function patchLobby() {
  const codeEl = document.getElementById('created-code-value');
  if (!codeEl) return;
  const obs = new MutationObserver(() => {
    const code = codeEl.textContent.trim();
    if (code && code.length === 6 && code !== '\u2014\u2014') {
      updateInviteLink(code);
    }
  });
  obs.observe(codeEl, { childList: true, characterData: true, subtree: true });
})();

// Hide invite link when lobby mode is re-entered
btnModeOnline.addEventListener('click', () => hideInviteLink());
document.getElementById('fw-goto-local')?.addEventListener('click', () => hideInviteLink());
document.getElementById('fw-goto-ai')?.addEventListener('click',    () => hideInviteLink());

// ═══════════════════════════════════════════════════════════════
//  PART 29: TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════

function showToast(message, type) {
  type = type || 'info';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${escHtml(String(message))}</span>
    <button class="toast-close" aria-label="Dismiss">✕</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));
  const timer = setTimeout(() => dismissToast(toast), 4200);
  toast.dataset.timer = timer;
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(Number(toast.dataset.timer));
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  toast.classList.remove('visible');
  toast.classList.add('hiding');
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
}

// ═══════════════════════════════════════════════════════════════
//  PART 30: EXTENDED ROUTER & INIT WIRING
// ═══════════════════════════════════════════════════════════════

// Friends screen nav
document.getElementById('tab-friends')?.addEventListener('click',    openFriendsScreen);
document.getElementById('btn-goto-friends')?.addEventListener('click', openFriendsScreen);

// Add Friend button + Enter key
document.getElementById('btn-add-friend')?.addEventListener('click', () => {
  addFriend(document.getElementById('add-friend-input')?.value || '');
});
document.getElementById('add-friend-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') addFriend(document.getElementById('add-friend-input')?.value || '');
});

// Time-ago helper for presence display
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ═══════════════════════════════════════════════════════════════
//  PART 31: FIREBASE AUTH CORE
// ═══════════════════════════════════════════════════════════════

let fbAuth          = null;
let authUser        = null;
let pendingRoomCode = null; // stores room code when invite link opened before login
let notifListener   = null;
let notifCache      = [];
const NOTIF_LOCAL   = 'ttt_arena_notifs_local';

function initAuth() {
  const ok = initFirebase();
  if (!ok) {
    updateAuthUI(false, true);
    return;
  }
  try {
    if (!fbAuth && typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
      fbAuth = firebase.auth();
      fbAuth.onAuthStateChanged(handleAuthStateChange);
    }
    updateAuthUI(!!authUser);
  } catch(e) {
    console.warn('[TTTArena] Auth SDK not available:', e);
    updateAuthUI(false, true);
  }
}

async function handleAuthStateChange(user) {
  if (user) {
    authUser = user;
    let profileExists = false;
    try { profileExists = await loadOrCreatePlayerProfile(user); } catch(e) { console.warn('[TTTArena] Profile load error:', e); }
    initPresenceV2(user.uid);
    listenForFriends();
    listenForInvites();
    listenForFriendRequests();
    listenForNotificationsV2();
    updateAuthUI(true);
    // Auto-join if invite link was opened before login (and profile exists)
    if (pendingRoomCode && profileExists) {
      const code = pendingRoomCode; pendingRoomCode = null;
      setTimeout(() => acceptInvite(code), 800);
    }
  } else {
    const prevUid = authUser?.uid;
    authUser = null; playerProfile = null;
    if (prevUid && fbDB) {
      try { fbDB.ref(`friends/${prevUid}`).off(); } catch{}
      try { fbDB.ref(`invites/${prevUid}`).off(); } catch{}
      try { fbDB.ref(`friendRequests/${prevUid}`).off(); } catch{}
      try { fbDB.ref(`notifications/${prevUid}`).off(); } catch{}
    }
    friendsListener = null; inviteListener = null; notifListener = null; reqListener = null;
    updateAuthUI(false);
    document.getElementById('profile-edit-modal')?.classList.remove('visible');
    document.getElementById('invite-popup')?.classList.remove('visible');
  }
}

async function loginWithGoogle() {
  console.log("FRIEND LOGIN START (Google)");
  if (!fbAuth) initAuth();
  if (!fbAuth) {
    showToast('Firebase Auth not available.', 'error');
    return;
  }
  const btn = document.getElementById('btn-login-google');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span style="opacity:.65">Connecting…</span>'; }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await fbAuth.signInWithPopup(provider);
    console.log("AUTH STATE:", cred?.user || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null));
    hideAuthModal();
  } catch(e) {
    console.warn('[TTTArena] Google login error:', e);
    const msg = e.code === 'auth/popup-closed-by-user' ? 'Login cancelled.' :
                e.code === 'auth/popup-blocked'         ? 'Popup blocked — allow popups and try again.' :
                `Google login failed: ${e?.message || 'Try again.'}`;
    showToast(msg, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg> Continue with Google`;
    }
  }
}

async function loginAsGuest() {
  console.log("FRIEND LOGIN START (Guest)");
  if (!fbAuth) initAuth();
  if (!fbAuth) {
    showToast('Firebase Auth not available.', 'error');
    return;
  }
  const btn = document.getElementById('btn-login-guest');
  if (btn) { btn.disabled = true; btn.innerHTML = 'Entering arena…'; }
  try {
    const cred = await fbAuth.signInAnonymously();
    console.log("AUTH STATE:", cred?.user || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null));
    hideAuthModal();
  } catch(e) {
    console.warn('[TTTArena] Guest login error:', e);
    showToast(`Guest login failed: ${e?.message || 'Try again.'}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Play as Guest`;
    }
  }
}

async function logout() {
  if (!fbAuth) return;
  try {
    if (authUser && fbDB) setPresence('offline');
    await fbAuth.signOut();
    showScreen('screen-home');
    showToast('Logged out. See you in the arena! 👋', 'info');
  } catch(e) {
    console.warn('[TTTArena] Logout error:', e);
    showToast('Logout failed. Try again.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 32: AUTH UI & GUARDS
// ═══════════════════════════════════════════════════════════════

function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  const noFb = !initFirebase();
  const warn = document.getElementById('auth-firebase-warn');
  const btns = document.getElementById('auth-btns');
  if (warn) warn.style.display = noFb ? 'flex' : 'none';
  if (btns) btns.style.display = noFb ? 'none' : 'flex';
  modal.classList.add('visible');
}

function hideAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('visible');
}

function updateAuthUI(loggedIn) {
  const pill       = document.getElementById('player-id-pill');
  const loginBtn   = document.getElementById('btn-login-home-aux');
  const friendsTab = document.getElementById('tab-friends');
  const friendsAux = document.getElementById('btn-goto-friends');
  const notifBell  = document.getElementById('btn-notif-bell');

  if (loggedIn && playerProfile) {
    if (pill)       pill.style.display       = 'flex';
    if (loginBtn)   loginBtn.style.display   = 'none';
    if (friendsTab) friendsTab.style.display = '';
    if (friendsAux) friendsAux.style.display = '';
    if (notifBell)  notifBell.style.display  = 'flex';
    renderPlayerIdPillV2();
  } else {
    if (pill)       { pill.style.display = 'none'; pill.innerHTML = ''; }
    if (loginBtn)   loginBtn.style.display   = 'flex';
    if (friendsTab) friendsTab.style.display = 'none';
    if (friendsAux) friendsAux.style.display = 'none';
    if (notifBell)  notifBell.style.display  = 'none';
  }
}

function requireAuth(action) {
  if (!initFirebase()) {
    showToast('Firebase not configured. Online features require setup.', 'warn');
    return false;
  }
  if (!authUser && typeof fbAuth !== 'undefined' && fbAuth?.currentUser) {
    authUser = fbAuth.currentUser;
  }
  if (!authUser && typeof firebase !== 'undefined' && firebase.auth && firebase.auth()?.currentUser) {
    authUser = firebase.auth().currentUser;
  }
  if (!authUser) {
    showAuthModal();
    if (action) showToast(`Please login to ${action}.`, 'info');
    return false;
  }
  return true;
}

// Override openFriendsScreen with auth gate
function openFriendsScreen() {
  if (!requireAuth('use the Friend Network')) return;
  showScreen('screen-friends');
  syncFriendsTabs('fpanel-friends', 'ftab-friends');
  renderFriendsList();
  listenForFriendRequests();
}

// Override btnModeOnline click — add auth gate (capture phase fires first)
document.getElementById('btn-mode-online')?.addEventListener('click', e => {
  if (!authUser) { e.stopImmediatePropagation(); requireAuth('use Online Friend mode'); }
}, true);

// Wire auth modal buttons
document.getElementById('btn-login-google')?.addEventListener('click', loginWithGoogle);
document.getElementById('btn-login-guest')?.addEventListener('click',  loginAsGuest);
document.getElementById('btn-auth-skip')?.addEventListener('click', () => {
  hideAuthModal();
  showToast('Playing offline. Login to unlock online features.', 'info');
});
document.getElementById('btn-login-home-aux')?.addEventListener('click', showAuthModal);

// Notification bell
document.getElementById('btn-notif-bell')?.addEventListener('click', () => {
  const nc = document.getElementById('notif-center');
  if (!nc) return;
  const open = nc.classList.contains('visible');
  nc.classList.toggle('visible', !open);
  if (!open) renderNotificationCenter();
});
document.getElementById('btn-notif-close')?.addEventListener('click', () => {
  document.getElementById('notif-center')?.classList.remove('visible');
});
document.addEventListener('click', e => {
  const nc   = document.getElementById('notif-center');
  const bell = document.getElementById('btn-notif-bell');
  if (nc && nc.classList.contains('visible') && !nc.contains(e.target) && !bell?.contains(e.target)) {
    nc.classList.remove('visible');
  }
});

// Friend screen tab switching
function syncFriendsTabs(panelId, tabId) {
  document.querySelectorAll('.fpanel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('ftab-active'));
  const panel = document.getElementById(panelId);
  const tab   = document.getElementById(tabId);
  if (panel) panel.style.display = '';
  if (tab)   tab.classList.add('ftab-active');
}

document.querySelectorAll('.ftab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!requireAuth('use Friend Network')) return;
    const panelId = btn.dataset.panel;
    syncFriendsTabs(panelId, btn.id);
    if (panelId === 'fpanel-friends')  renderFriendsList();
    if (panelId === 'fpanel-requests') renderFriendRequests();
    if (panelId === 'fpanel-search') {
      renderMyIdentityInSearch();
      setTimeout(() => document.getElementById('search-player-input')?.focus(), 50);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  PART 33: PLAYER PROFILE v2 (FIREBASE AUTH-LINKED & LOGIN TRACKING)
// ═══════════════════════════════════════════════════════════════

/** Extracts login session tracking, authentication metadata & email from Firebase Auth user */
function extractLoginTrackingData(user, existingData = null) {
  const now = Date.now();
  const isAnon = user?.isAnonymous || false;
  const isGoogle = !isAnon && (
    (user?.providerData && Array.isArray(user.providerData) && user.providerData.some(p => p?.providerId === 'google.com')) ||
    !!user?.email
  );
  const loginMethod = isGoogle ? 'Google' : 'Guest';
  const email = user?.email || (existingData && existingData.email) || null;
  const displayName = user?.displayName || (existingData && existingData.displayName) || (existingData && existingData.name) || (isAnon ? `Guest_${(user?.uid || '').slice(0, 5).toUpperCase()}` : 'Player');
  const photoURL = user?.photoURL || (existingData && existingData.photoURL) || null;
  const firstLoginAt = (existingData && (existingData.firstLoginAt || existingData.createdAt)) || now;
  const lastLoginAt = now;
  const prevCount = existingData ? (Number(existingData.loginCount) || 0) : 0;
  const loginCount = prevCount + 1;

  const tracking = {
    uid: user?.uid,
    displayName,
    loginMethod,
    firstLoginAt,
    lastLoginAt,
    loginCount
  };

  if (email) {
    tracking.email = email;
  }
  if (photoURL) {
    tracking.photoURL = photoURL;
  }

  return tracking;
}

async function loadOrCreatePlayerProfile(user) {
  if (!fbDB || !user) return false;
  const uid  = user.uid;
  try {
    const snap = await fbDB.ref(`players/${uid}`).once('value');
    const data = snap.val();
    if (data && (data.name || data.username)) {
      const activeName = data.name || data.username || 'OPERATOR';
      // Existing profile — backfill / migrate friendCode and register unique identity mappings
      let friendCode = data.friendCode;
      let oldFriendCode = null;
      if (isLegacyUidFriendCode(friendCode, uid)) {
        oldFriendCode = friendCode;
        friendCode = await generateUniqueFriendCode(uid);
      } else {
        friendCode = normalizeFriendCode(friendCode);
      }

      await claimIdentity(uid, activeName, friendCode, null, oldFriendCode);

      // Track login session & email
      const tracking = extractLoginTrackingData(user, data);
      const username = data.username || activeName;

      const profileUpdates = {
        ...tracking,
        username,
        name: activeName,
        friendCode,
        emoji: data.emoji || '⚡',
        playerId: uid,
        online: true,
        presence: 'online'
      };

      await fbDB.ref(`players/${uid}`).update(profileUpdates).catch((err) => console.warn('[TTTArena] Login tracking update warning:', err));

      playerProfile = { ...data, ...profileUpdates };
      saveProfileLocal(playerProfile);
      renderPlayerIdPillV2();
      showToast(`Welcome back, ${activeName}! ⚡`, 'success');
      return true;
    }
  } catch (err) {
    console.warn('[TTTArena] Remote profile load warning:', err);
  }

  // Check if existing local profile can be linked
  const local = loadProfile();
  if (local && (local.name || local.username)) {
    let name = sanitizeUsername(local.name || local.username);
    if (!name || name.length < 2) name = `OPERATOR_${uid.slice(0, 4).toUpperCase()}`;
    const taken = await isUsernameTaken(name, uid);
    if (taken) {
      name = `${name}_${uid.slice(0, 4)}`;
    }
    const friendCode = await generateUniqueFriendCode(uid);
    const tracking = extractLoginTrackingData(user, local);

    const profile = {
      ...tracking,
      username: name,
      name,
      emoji: local.emoji || '⚡',
      playerId: uid,
      friendCode,
      createdAt: tracking.firstLoginAt,
      online: true, presence: 'online', statusMsg: '',
      stats: local.stats || { matches: 0, wins: 0, losses: 0, draws: 0 }
    };
    playerProfile = profile;
    saveProfileLocal(profile);
    await claimIdentity(uid, name, friendCode);
    try { await fbDB.ref(`players/${uid}`).set(profile); } catch(e) { console.warn('[TTTArena] Profile sync error:', e); }
    renderPlayerIdPillV2();
    showToast(`Welcome, ${profile.name}! ⚡`, 'success');
    return true;
  }

  // For anonymous guest, automatically create guest profile so user immediately enters arena
  if (user.isAnonymous) {
    const guestName = `GUEST_${uid.slice(0, 5).toUpperCase()}`;
    const friendCode = await generateUniqueFriendCode(uid);
    const tracking = extractLoginTrackingData(user, null);
    const profile = {
      ...tracking,
      displayName: guestName,
      username: guestName,
      name: guestName,
      emoji: '👾',
      playerId: uid,
      friendCode,
      createdAt: tracking.firstLoginAt,
      online: true, presence: 'online', statusMsg: '',
      stats: { matches: 0, wins: 0, losses: 0, draws: 0 }
    };
    playerProfile = profile;
    saveProfileLocal(profile);
    await claimIdentity(uid, guestName, friendCode);
    try { await fbDB.ref(`players/${uid}`).set(profile); } catch(e) { console.warn('[TTTArena] Guest profile sync error:', e); }
    renderPlayerIdPillV2();
    showToast(`Logged in as ${guestName}! ⚡`, 'success');
    return true;
  }

  // New Google user — pre-fill from Google account if available
  const nameInput = document.getElementById('profile-name-input');
  if (nameInput && user.displayName) {
    const pre = sanitizeUsername(user.displayName.split(' ')[0]);
    if (pre) nameInput.value = pre;
  }
  showProfileSetupModal();
  return false;
}

// Authoritative listener on btn-profile-confirm with username uniqueness verification
document.getElementById('btn-profile-confirm')?.addEventListener('click', async () => {
  if (!authUser) return;
  const nameInput = document.getElementById('profile-name-input');
  const name = sanitizeUsername(nameInput?.value.trim() || '');
  if (!name || name.length < 2) {
    nameInput?.classList.add('input-error');
    showToast('Please enter a username (2-16 characters).', 'warn');
    setTimeout(() => nameInput?.classList.remove('input-error'), 1600);
    return;
  }

  const confirmBtn = document.getElementById('btn-profile-confirm');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Checking…';
  }

  const taken = await isUsernameTaken(name, authUser.uid);
  if (taken) {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ENTER ARENA`;
    }
    nameInput?.classList.add('input-error');
    showToast('Username already taken. Please choose another.', 'warn');
    setTimeout(() => nameInput?.classList.remove('input-error'), 2000);
    return;
  }

  const friendCode = await generateUniqueFriendCode(authUser.uid);
  const tracking = extractLoginTrackingData(authUser, null);

  const profile = {
    ...tracking,
    username:   name,
    name,
    emoji:      selectedEmoji || '⚡',
    playerId:   authUser.uid,      // playerId = Firebase UID for all internal path lookups
    friendCode,                    // TTT-XXXXXXXX globally unique sharing code
    createdAt:  tracking.firstLoginAt,
    online:     true, presence: 'online', statusMsg: '',
    stats:      { matches: 0, wins: 0, losses: 0, draws: 0 },
  };

  playerProfile = profile;
  saveProfileLocal(profile);
  await claimIdentity(authUser.uid, name, friendCode);
  try { await fbDB.ref(`players/${authUser.uid}`).set(profile); } catch(e) { console.warn('[TTTArena] Profile create failed:', e); }

  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ENTER ARENA`;
  }

  hideProfileSetupModal();
  renderPlayerIdPillV2();
  initPresenceV2(authUser.uid);
  listenForInvites();
  listenForFriendRequests();
  listenForNotificationsV2();
  showToast(`Welcome to the Arena, ${name}! 🎯 Friend Code: ${profile.friendCode}`, 'success');

  // Auto-join if invite link was opened before login
  if (pendingRoomCode) {
    const code = pendingRoomCode; pendingRoomCode = null;
    setTimeout(() => acceptInvite(code), 400);
  }
});

function renderPlayerIdPillV2() {
  const pill = document.getElementById('player-id-pill');
  if (!pill || !playerProfile) return;
  const emoji    = escHtml(playerProfile.emoji || '⚡');
  const name     = escHtml(playerProfile.name  || 'OPERATOR');
  const username = normalizeUsername(playerProfile.name || 'player');
  const code     = escHtml(playerProfile.friendCode || '');
  const isGuest  = authUser?.isAnonymous;
  pill.innerHTML = `
    <span class="pid-emoji">${emoji}</span>
    <div class="pid-info">
      <div class="pid-name">${name}${isGuest ? ' <span class="pid-guest-badge">GUEST</span>' : ''}</div>
      <div class="pid-code"><span class="pid-user-handle">@${escHtml(username)}</span> · <span class="pid-fcode">${code}</span></div>
    </div>
    <button class="pid-copy" id="btn-copy-pid" title="Copy Friend Code">📋</button>
    <button class="pid-edit" id="btn-edit-profile" title="Edit profile">✏️</button>
    <button class="pid-logout" id="btn-logout" title="Logout">↪</button>`;
  pill.style.display = 'flex';
  document.getElementById('btn-copy-pid')?.addEventListener('click', () => {
    const fc = playerProfile.friendCode || '';
    if (!fc) return;
    navigator.clipboard.writeText(fc).catch(() => { const t = document.createElement('input'); t.value = fc; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); });
    showToast('Friend Code copied! Share it so friends can add you. 📋', 'success');
    const btn = document.getElementById('btn-copy-pid');
    if (btn) { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '📋'; }, 1800); }
  });
  document.getElementById('btn-edit-profile')?.addEventListener('click', openProfileEditModal);
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  renderMyIdentityInSearch();
}

// Profile Edit Modal
let peditEmoji = null;

function openProfileEditModal() {
  if (!playerProfile) return;
  const modal = document.getElementById('profile-edit-modal');
  if (!modal) return;
  const nameInput   = document.getElementById('pedit-name');
  const statusInput = document.getElementById('pedit-status');
  if (nameInput)   nameInput.value   = playerProfile.name || '';
  if (statusInput) statusInput.value = playerProfile.statusMsg || '';
  document.querySelectorAll('#pedit-emoji-picker .emoji-opt').forEach(b => {
    b.classList.toggle('selected', b.dataset.emoji === (playerProfile.emoji || '⚡'));
  });
  const st = playerProfile.stats || {};
  const tot = (st.wins || 0) + (st.losses || 0) + (st.draws || 0);
  const pct = tot > 0 ? Math.round((st.wins || 0) / tot * 100) : 0;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('pstat-matches', st.matches || tot);
  set('pstat-wins',    st.wins    || 0);
  set('pstat-losses',  st.losses  || 0);
  set('pstat-draws',   st.draws   || 0);
  set('pstat-winpct',  `${pct}%`);
  peditEmoji = playerProfile.emoji || '⚡';
  modal.classList.add('visible');
}

document.querySelectorAll('#pedit-emoji-picker .emoji-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#pedit-emoji-picker .emoji-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    peditEmoji = btn.dataset.emoji;
  });
});

document.getElementById('btn-pedit-close')?.addEventListener('click', () => {
  document.getElementById('profile-edit-modal')?.classList.remove('visible');
});

document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
  if (!authUser || !playerProfile || !fbDB) return;
  const nameInput   = document.getElementById('pedit-name');
  const statusInput = document.getElementById('pedit-status');
  const name = sanitizeUsername(nameInput?.value.trim() || '');
  if (!name || name.length < 2) {
    nameInput?.classList.add('input-error');
    showToast('Enter a valid username (2-16 characters).', 'warn');
    setTimeout(() => nameInput?.classList.remove('input-error'), 1600);
    return;
  }
  const saveBtn = document.getElementById('btn-save-profile');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  const oldName = playerProfile.name;
  if (normalizeUsername(name) !== normalizeUsername(oldName)) {
    const taken = await isUsernameTaken(name, authUser.uid);
    if (taken) {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> SAVE CHANGES`;
      }
      nameInput?.classList.add('input-error');
      showToast('Username already taken. Please choose another.', 'warn');
      setTimeout(() => nameInput?.classList.remove('input-error'), 2000);
      return;
    }
  }

  const oldFriendCode = playerProfile.friendCode;
  let friendCode = playerProfile.friendCode;
  if (!friendCode || isLegacyUidFriendCode(friendCode, authUser.uid)) {
    friendCode = await generateUniqueFriendCode(authUser.uid);
  }

  const updates = {
    name,
    emoji: peditEmoji || playerProfile.emoji || '⚡',
    statusMsg: (statusInput?.value.trim() || '').slice(0, 40),
    friendCode
  };

  await claimIdentity(authUser.uid, name, friendCode, oldName, oldFriendCode);
  Object.assign(playerProfile, updates);
  saveProfileLocal(playerProfile);
  try {
    await fbDB.ref(`players/${authUser.uid}`).update(updates);
    document.getElementById('profile-edit-modal')?.classList.remove('visible');
    renderPlayerIdPillV2();
    showToast('Profile updated! ✅', 'success');
  } catch(e) { showToast('Failed to save profile. Try again.', 'error'); }

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> SAVE CHANGES`;
  }
});

// ═══════════════════════════════════════════════════════════════
//  PART 34: ENHANCED PRESENCE v2
// ═══════════════════════════════════════════════════════════════

function setPresence(status) {
  if (!fbDB || !authUser) return;
  const uid = authUser.uid;
  try {
    const ts = Date.now();
    fbDB.ref(`presence/${uid}`).update({ status, lastSeen: ts, uid });
    fbDB.ref(`players/${uid}`).update({ online: status !== 'offline', presence: status, lastSeen: ts });
  } catch(e) { console.warn('[TTTArena] setPresence failed:', e); }
}

function initPresenceV2(uid) {
  if (!fbDB || !uid) return;
  try {
    const connRef   = fbDB.ref('.info/connected');
    const presRef   = fbDB.ref(`presence/${uid}`);
    const playerRef = fbDB.ref(`players/${uid}`);
    connRef.on('value', snap => {
      if (!snap.val()) return;
      const ts = Date.now();
      presRef.set({ status: 'online', lastSeen: ts, uid });
      presRef.onDisconnect().update({ status: 'offline', lastSeen: firebase.database.ServerValue.TIMESTAMP });
      playerRef.update({ online: true, presence: 'online' });
      playerRef.onDisconnect().update({ online: false, presence: 'offline', lastSeen: firebase.database.ServerValue.TIMESTAMP });
    });
  } catch(e) { console.warn('[TTTArena] initPresenceV2 failed:', e); }
}

function presenceDotClass(presence, online) {
  if (!online) return 'dot-offline';
  switch (presence) {
    case 'in_match': return 'dot-in-match';
    case 'in_lobby': return 'dot-in-lobby';
    default:         return 'dot-online';
  }
}

function presenceStatusText(presence, online, lastSeen) {
  if (!online) return lastSeen ? `Last seen ${timeAgo(lastSeen)}` : 'Offline';
  switch (presence) {
    case 'in_match': return '⚔ In Match';
    case 'in_lobby': return '🎮 In Lobby';
    default:         return 'Online';
  }
}

// Set presence to in_lobby when entering online lobby
document.getElementById('btn-mode-online')?.addEventListener('click', () => {
  if (authUser) setPresence('in_lobby');
});

// ═══════════════════════════════════════════════════════════════
//  PART 35: FRIEND REQUEST SYSTEM + OVERRIDES
// ═══════════════════════════════════════════════════════════════

let reqListener = null;

/** Send friend request by Target UID */
async function sendFriendRequestToUid(targetUid, targetName, targetEmoji, targetFriendCode) {
  if (!requireAuth('send friend requests')) return { success: false, error: 'Login required.' };
  
  if (!playerProfile) {
    playerProfile = loadProfile() || {
      name: 'Player',
      emoji: '⚡',
      playerId: authUser?.uid || generatePlayerId(),
      friendCode: generatePlayerId()
    };
  }

  const currentUid = authUser?.uid || (typeof fbAuth !== 'undefined' && fbAuth?.currentUser?.uid) || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()?.currentUser?.uid) || playerProfile?.uid || playerProfile?.playerId || null;
  const opponentUid = targetUid;

  if (!opponentUid || (currentUid && opponentUid === currentUid)) {
    showToast("You cannot add yourself as a friend! 😄", 'warn');
    return { success: false, error: "You cannot add yourself! 😄" };
  }

  // Rate limiting (max 5 requests per minute)
  const now = Date.now();
  const rateKey = 'ttt_req_times';
  const times = JSON.parse(localStorage.getItem(rateKey) || '[]').filter(t => now - t < 60000);
  if (times.length >= 5) {
    showToast('Too many friend requests. Wait a moment.', 'warn');
    return { success: false, error: 'Too many friend requests. Wait a moment.' };
  }
  times.push(now);
  localStorage.setItem(rateKey, JSON.stringify(times));

  // 1. Check if already friends (safe check on sender's own path)
  if (currentUid && fbDB) {
    try {
      const exSnap = await fbDB.ref(`friends/${currentUid}/${opponentUid}`).once('value');
      if (exSnap.exists()) {
        showToast(`${targetName || 'Player'} is already your friend!`, 'info');
        return { success: false, error: 'Already your friend!' };
      }
    } catch (err) {
      console.warn('[FriendRequest] existing friends check failed:', err);
    }
  }

  // 2. Check if outgoing request already pending (safe check on sender's own outgoingRequests path)
  if (currentUid && fbDB) {
    try {
      const outSnap = await fbDB.ref(`outgoingRequests/${currentUid}`).once('value');
      if (outSnap.exists()) {
        const outData = outSnap.val() || {};
        for (const val of Object.values(outData)) {
          if (val && val.toUid === opponentUid && (!val.status || val.status === 'pending')) {
            showToast('Friend request already sent!', 'info');
            return { success: false, error: 'Friend request already sent!' };
          }
        }
      }
    } catch (err) {
      console.warn('[FriendRequest] outgoing check failed:', err);
    }
  }

  const reqId = `${currentUid}_${Date.now()}`;
  console.log("[FriendRequest] sender UID:", currentUid);
  console.log("[FriendRequest] opponent UID:", opponentUid);
  console.log("[FriendRequest] writing request...");

  try {
    // 3. Primary write: write directly to target's incoming friendRequests
    await fbDB.ref(`friendRequests/${opponentUid}/${reqId}`).set({
      fromUid: currentUid,
      fromName: playerProfile.name || 'Player',
      fromEmoji: playerProfile.emoji || '⚡',
      fromFriendCode: playerProfile.friendCode || '',
      timestamp: Date.now(),
      status: 'pending',
    });
    console.log("[FriendRequest] request write SUCCESS");
  } catch (e) {
    console.error("[FriendRequest] request write failed:", e);
    showToast('Failed to send friend request. Try again.', 'error');
    return { success: false, error: e?.message || 'Failed to send request.' };
  }

  // 4. Secondary operations: isolated in try/catch so post-write failures never trigger a failure toast
  try {
    await fbDB.ref(`outgoingRequests/${currentUid}/${reqId}`).set({
      toUid: opponentUid,
      toName: targetName || 'Unknown',
      toEmoji: targetEmoji || '⚡',
      toFriendCode: targetFriendCode || '',
      timestamp: Date.now(),
      status: 'pending',
    });
  } catch (error) {
    console.warn("[FriendRequest] post-write sync failed:", error);
  }

  try {
    await fbDB.ref(`notifications/${opponentUid}/${reqId}`).set({
      type: 'friend_request',
      icon: '👥',
      text: `${playerProfile.name || 'Player'} sent you a friend request!`,
      reqId,
      fromUid: currentUid,
      ts: Date.now(),
      read: false,
    });
  } catch (error) {
    console.warn("[FriendRequest] post-write sync failed:", error);
  }

  showToast(`Friend request sent to ${escHtml(targetName || 'Player')}! 📨`, 'success');
  return { success: true, targetName, targetUid: opponentUid, reqId };
}

/** Send friend request by Friend Code or username */
async function sendFriendRequestByCode(friendCodeInput) {
  if (!requireAuth('add friends')) return { success: false, error: 'Login required.' };
  if (!playerProfile) return { success: false, error: 'Profile not loaded.' };
  const rawInput = (friendCodeInput || '').trim();
  if (!rawInput) {
    showToast('Enter a username or Friend Code.', 'warn');
    return { success: false, error: 'Enter a username or Friend Code.' };
  }

  const cleaned = rawInput.replace(/^@+/, '').trim();
  const normalizedUsername = normalizeUsername(cleaned);
  const normalizedFriendCode = normalizeFriendCode(cleaned);
  const rawFriendCodeUpper = normalizeFriendCodeRaw(cleaned);
  const currentUid = authUser?.uid || null;

  // Immediate self-check
  if (
    (playerProfile.friendCode && (
      normalizedFriendCode === normalizeFriendCode(playerProfile.friendCode) ||
      rawFriendCodeUpper === normalizeFriendCodeRaw(playerProfile.friendCode)
    )) ||
    (playerProfile.name && normalizedUsername === normalizeUsername(playerProfile.name)) ||
    (currentUid && normalizedUsername === normalizeUsername(currentUid))
  ) {
    showToast("You cannot add yourself as a friend! 😄", 'warn');
    return { success: false, error: "You cannot add yourself! 😄" };
  }

  try {
    let targetUid = null;

    // 1. Direct O(1) lookup in usernames/
    try {
      if (normalizedUsername) {
        const uSnap = await fbDB.ref(`usernames/${normalizedUsername}`).once('value');
        if (uSnap.exists()) targetUid = uSnap.val();
      }
    } catch (err) {}

    // 2. Direct O(1) lookup in friendCodes/ (with TTT- prefix)
    if (!targetUid && normalizedFriendCode) {
      try {
        const fcSnap = await fbDB.ref(`friendCodes/${normalizedFriendCode}`).once('value');
        if (fcSnap.exists()) targetUid = fcSnap.val();
      } catch (err) {}
    }

    // 3. Fallback lookup in friendCodes/ (without TTT- prefix)
    if (!targetUid && rawFriendCodeUpper) {
      try {
        const fcSnap2 = await fbDB.ref(`friendCodes/${rawFriendCodeUpper}`).once('value');
        if (fcSnap2.exists()) targetUid = fcSnap2.val();
      } catch (err) {}
    }

    if (!targetUid) {
      showToast('User not found. Check the username or Friend Code.', 'error');
      return { success: false, error: 'User not found.' };
    }

    if (currentUid && targetUid === currentUid) {
      showToast("You cannot add yourself as a friend! 😄", 'warn');
      return { success: false, error: "You cannot add yourself! 😄" };
    }

    const pSnap = await fbDB.ref(`players/${targetUid}`).once('value');
    const targetData = pSnap.val() || {};

    return await sendFriendRequestToUid(targetUid, targetData.name || 'Player', targetData.emoji || '⚡', targetData.friendCode || normalizedFriendCode);
  } catch (e) {
    console.error('[FriendSearch] sendFriendRequestByCode failed:', e);
    showToast('Failed to find player. Try again.', 'error');
    return { success: false, error: e?.message || 'Failed to find player.' };
  }
}

// Wrapper for existing call sites
async function addFriend(friendCodeInput) {
  return await sendFriendRequestByCode(friendCodeInput);
}

document.getElementById('btn-search-player')?.addEventListener('click', () => {
  searchPlayerByCode(document.getElementById('search-player-input')?.value);
});
document.getElementById('search-player-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchPlayerByCode(document.getElementById('search-player-input')?.value);
});

async function acceptFriendRequest(fromUid, reqId) {
  if (!requireAuth('accept friend requests')) return;
  const currentUid = authUser?.uid || null;
  if (!currentUid || !fbDB) return;

  if (!playerProfile) {
    playerProfile = loadProfile() || {
      name: 'Player',
      emoji: '⚡',
      playerId: currentUid,
      friendCode: generatePlayerId()
    };
  }

  try {
    let fromData = { name: 'Player', emoji: '⚡', friendCode: '' };
    try {
      const fromSnap = await fbDB.ref(`players/${fromUid}`).once('value');
      if (fromSnap.exists()) fromData = fromSnap.val() || fromData;
    } catch (e) {
      console.warn('[FriendAccept] read from player failed:', e);
    }

    // 1. Primary write to my own friends list
    await fbDB.ref(`friends/${currentUid}/${fromUid}`).set({
      name: fromData.name || 'Friend',
      emoji: fromData.emoji || '⚡',
      friendCode: fromData.friendCode || '',
      addedAt: Date.now()
    });

    // 2. Update incoming request status in my own node
    await fbDB.ref(`friendRequests/${currentUid}/${reqId}`).update({ status: 'accepted' });

    // Update local cache
    friendsCache[fromUid] = {
      name: fromData.name || 'Friend',
      emoji: fromData.emoji || '⚡',
      friendCode: fromData.friendCode || '',
      addedAt: Date.now()
    };

    // 3. Secondary writes (isolated so secondary permission/network errors don't fail acceptance)
    try {
      await fbDB.ref(`friends/${fromUid}/${currentUid}`).set({
        name: playerProfile.name || 'Friend',
        emoji: playerProfile.emoji || '⚡',
        friendCode: playerProfile.friendCode || '',
        addedAt: Date.now()
      });
    } catch (error) {
      console.warn("[FriendAccept] secondary friend write failed:", error);
    }

    try {
      await fbDB.ref(`outgoingRequests/${fromUid}/${reqId}`).update({ status: 'accepted' });
    } catch (error) {
      console.warn("[FriendAccept] outgoing update failed:", error);
    }

    try {
      await fbDB.ref(`notifications/${fromUid}/${reqId}_accepted`).set({
        type: 'friend_accepted',
        icon: '✅',
        text: `${playerProfile.name || 'Your friend'} accepted your friend request! You're now friends.`,
        ts: Date.now(),
        read: false,
      });
    } catch (error) {
      console.warn("[FriendAccept] notification failed:", error);
    }

    renderFriendRequests();
    renderFriendsList();
    if (gameMode === 'online' && lastRoomData) {
      updateMatchOpponentFriendUI(lastRoomData);
    }
    showToast(`You and ${escHtml(fromData.name || 'Player')} are now friends! 🎉`, 'success');
  } catch(e) {
    console.warn('[TTTArena] acceptFriendRequest failed:', e);
    showToast('Failed to accept request.', 'error');
  }
}

async function declineFriendRequest(fromUid, reqId) {
  if (!authUser || !fbDB) return;
  try {
    await fbDB.ref(`friendRequests/${authUser.uid}/${reqId}`).update({ status: 'declined' });
    try {
      await fbDB.ref(`outgoingRequests/${fromUid}/${reqId}`).update({ status: 'declined' });
    } catch {}
    renderFriendRequests();
    showToast('Friend request declined.', 'info');
  } catch(e) { showToast('Failed to decline request.', 'error'); }
}

let outReqListener = null;

function listenForFriendRequests() {
  if (!fbDB || !authUser) return;
  if (reqListener) { try { fbDB.ref(`friendRequests/${authUser.uid}`).off('value', reqListener); } catch{} reqListener = null; }
  reqListener = fbDB.ref(`friendRequests/${authUser.uid}`).on('value', snap => {
    const data  = snap.val() || {};
    const count = Object.values(data).filter(r => r.status === 'pending').length;
    const badge = document.getElementById('ftab-req-badge');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
    if (gameMode === 'online' && lastRoomData) {
      updateMatchOpponentFriendUI(lastRoomData);
    }
  });

  if (outReqListener) { try { fbDB.ref(`outgoingRequests/${authUser.uid}`).off('value', outReqListener); } catch{} outReqListener = null; }
  outReqListener = fbDB.ref(`outgoingRequests/${authUser.uid}`).on('value', () => {
    if (gameMode === 'online' && lastRoomData) {
      updateMatchOpponentFriendUI(lastRoomData);
    }
  });
}

function renderFriendRequests() {
  if (!fbDB || !authUser) return;
  const inEl  = document.getElementById('incoming-requests-list');
  const outEl = document.getElementById('outgoing-requests-list');

  fbDB.ref(`friendRequests/${authUser.uid}`).once('value').then(snap => {
    const data = snap.val() || {};
    const pending = Object.entries(data).filter(([, r]) => r.status === 'pending');
    if (inEl) {
      if (!pending.length) { inEl.innerHTML = `<div class="empty-state">✅ No incoming requests.</div>`; }
      else inEl.innerHTML = pending.map(([reqId, r]) => {
        const fcDisplay = r.fromFriendCode && !isLegacyUidFriendCode(r.fromFriendCode, r.fromUid)
          ? escHtml(r.fromFriendCode)
          : `@${escHtml(normalizeUsername(r.fromName || 'user'))}`;
        return `
        <div class="freq-card" data-req="${escHtml(reqId)}">
          <div class="friend-avatar">${escHtml(r.fromEmoji || '⚡')}</div>
          <div class="freq-info">
            <div class="freq-name">${escHtml(r.fromName || 'Unknown')}</div>
            <div class="freq-code">${fcDisplay}</div>
            <div class="freq-time">${timeAgo(r.timestamp)}</div>
          </div>
          <div class="freq-actions">
            <button class="btn-freq-accept" data-uid="${escHtml(r.fromUid)}" data-req="${escHtml(reqId)}">Accept</button>
            <button class="btn-freq-decline" data-uid="${escHtml(r.fromUid)}" data-req="${escHtml(reqId)}">Decline</button>
          </div>
        </div>`;
      }).join('');
      inEl.querySelectorAll('.btn-freq-accept').forEach(b => b.addEventListener('click', () => acceptFriendRequest(b.dataset.uid, b.dataset.req)));
      inEl.querySelectorAll('.btn-freq-decline').forEach(b => b.addEventListener('click', () => declineFriendRequest(b.dataset.uid, b.dataset.req)));
    }
  });

  if (!outEl) return;
  fbDB.ref(`outgoingRequests/${authUser.uid}`).once('value').then(snap => {
    const data = snap.val() || {};
    const pending = Object.entries(data).filter(([, r]) => !r.status || r.status === 'pending');
    if (!pending.length) { outEl.innerHTML = `<div class="empty-state">No sent requests.</div>`; return; }
    outEl.innerHTML = pending.map(([, r]) => {
      const fcDisplay = r.toFriendCode && !isLegacyUidFriendCode(r.toFriendCode, r.toUid)
        ? escHtml(r.toFriendCode)
        : `@${escHtml(normalizeUsername(r.toName || 'user'))}`;
      return `
      <div class="freq-card">
        <div class="friend-avatar">${escHtml(r.toEmoji || '⚡')}</div>
        <div class="freq-info">
          <div class="freq-name">${escHtml(r.toName || 'Unknown')}</div>
          <div class="freq-code">${fcDisplay}</div>
          <div class="freq-time">${timeAgo(r.timestamp)}</div>
        </div>
        <span class="freq-pending-badge">PENDING</span>
      </div>`;
    }).join('');
  });
}

// Enhanced continuous friends listener + renderFriendsList
function listenForFriends() {
  if (!fbDB || !authUser) return;
  const uid = authUser.uid;
  if (friendsListener) {
    try { fbDB.ref(`friends/${uid}`).off('value', friendsListener); } catch{}
    friendsListener = null;
  }
  friendsListener = fbDB.ref(`friends/${uid}`).on('value', async snap => {
    const data = snap.val() || {};
    friendsCache = data;
    if (gameMode === 'online' && lastRoomData) {
      updateMatchOpponentFriendUI(lastRoomData);
    }
    const listEl = document.getElementById('friends-list');
    if (listEl && document.getElementById('screen-friends')?.classList.contains('visible')) {
      renderFriendsListContent(data);
    }
  });
}

async function renderFriendsListContent(data) {
  const listEl = document.getElementById('friends-list');
  if (!listEl) return;
  const ids = Object.keys(data || {});
  if (!ids.length) {
    listEl.innerHTML = `<div class="empty-state">👥 No friends yet.<br>Click "+ ADD FRIEND" above or use Search to find friends.</div>`;
    return;
  }
  listEl.innerHTML = `<div class="friends-loading">Loading squad…</div>`;
  const rows = await Promise.all(ids.map(async fid => {
    const info = data[fid] || {};
    let online = false, lastSeen = null, presence = 'offline';
    try {
      const ps = await fbDB.ref(`players/${fid}`).once('value');
      const pd = ps.val();
      if (pd) { online = !!pd.online; lastSeen = pd.lastSeen; presence = pd.presence || 'offline'; }
    } catch{}
    return { fid, info, online, lastSeen, presence };
  }));
  const presOrder = { 'in_match': 3, 'in_lobby': 2, 'online': 1, 'offline': 0 };
  rows.sort((a, b) => (presOrder[a.online ? a.presence : 'offline'] || 0) < (presOrder[b.online ? b.presence : 'offline'] || 0) ? 1 : -1);
  listEl.innerHTML = rows.map(({ fid, info, online, lastSeen, presence }) => {
    const dotCls  = presenceDotClass(presence, online);
    const statTxt = presenceStatusText(presence, online, lastSeen);
    const friendDisplayName = escHtml(info.name || 'Friend');
    const friendCodeDisplay = info.friendCode && !isLegacyUidFriendCode(info.friendCode, fid)
      ? escHtml(info.friendCode)
      : `@${escHtml(normalizeUsername(info.name || 'friend'))}`;

    return `<div class="friend-row" data-fid="${escHtml(fid)}">
      <div class="friend-avatar">${escHtml(info.emoji || '⚡')}</div>
      <div class="friend-info">
        <div class="friend-name">${friendDisplayName}</div>
        <div class="friend-status"><span class="status-dot ${dotCls}"></span>${escHtml(statTxt)}</div>
        <div class="friend-id-small">${friendCodeDisplay}</div>
      </div>
      <div class="friend-actions">
        <button class="fr-btn fr-invite" data-fid="${escHtml(fid)}" data-name="${friendDisplayName}" title="Play match with ${friendDisplayName}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          PLAY
        </button>
        <button class="fr-btn fr-remove" data-fid="${escHtml(fid)}" title="Remove friend">✕</button>
      </div>
    </div>`;
  }).join('');
  listEl.querySelectorAll('.fr-invite').forEach(btn => btn.addEventListener('click', () => sendMatchInvite(btn.dataset.fid, btn.dataset.name)));
  listEl.querySelectorAll('.fr-remove').forEach(btn => btn.addEventListener('click', () => removeFriendV2(btn.dataset.fid)));
}

function renderFriendsList() {
  if (!fbDB || !authUser) { renderFriendsNoFirebase(); return; }
  listenForFriends();
  renderFriendsListContent(friendsCache);
}

async function removeFriendV2(friendUid) {
  if (!fbDB || !authUser) return;
  let friendName = 'this friend';
  try {
    const s = await fbDB.ref(`friends/${authUser.uid}/${friendUid}`).once('value');
    if (s.exists()) friendName = s.val().name || 'this friend';
  } catch{}
  if (!confirm(`Remove ${friendName} from your squad?`)) return;
  try {
    await Promise.all([
      fbDB.ref(`friends/${authUser.uid}/${friendUid}`).remove(),
      fbDB.ref(`friends/${friendUid}/${authUser.uid}`).remove(),
    ]);
    if (gameMode === 'online' && lastRoomData) {
      updateMatchOpponentFriendUI(lastRoomData);
    }
    showToast('Friend removed from your squad.', 'info');
  } catch(e) { showToast('Failed to remove friend.', 'error'); }
}

// ═══════════════════════════════════════════════════════════════
//  PART 36: PLAYER SEARCH (ENHANCED WITH LIVE RELATION STATES)
// ═══════════════════════════════════════════════════════════════

function renderMyIdentityInSearch() {
  const el = document.getElementById('fap-my-identity');
  if (!el || !playerProfile) return;
  const username = normalizeUsername(playerProfile.name || 'player');
  const code = playerProfile.friendCode || '';

  console.log("[IdentityDebug] currentUser.uid =", authUser?.uid);
  console.log("[IdentityDebug] displayed username =", username);
  console.log("[IdentityDebug] displayed friendCode =", code);

  el.innerHTML = `
    <div class="fap-mid-left">
      <span class="fap-mid-label">YOUR IDENTITY</span>
      <div class="fap-mid-grid">
        <div class="fap-mid-item">
          <span class="fap-mid-caption">Username</span>
          <span class="fap-mid-val"><strong>@${escHtml(username)}</strong></span>
        </div>
        <div class="fap-mid-item">
          <span class="fap-mid-caption">Friend Code</span>
          <span class="fap-mid-val"><strong>${escHtml(code)}</strong></span>
        </div>
      </div>
    </div>
    <button class="fap-mid-copy" id="btn-copy-search-identity" title="Copy Friend Code">📋 COPY CODE</button>
  `;
  el.style.display = 'flex';
  document.getElementById('btn-copy-search-identity')?.addEventListener('click', () => {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {
      const t = document.createElement('input');
      t.value = code;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
    });
    showToast('Friend Code copied to clipboard! 📋', 'success');
    const btn = document.getElementById('btn-copy-search-identity');
    if (btn) { btn.textContent = '✅ COPIED'; setTimeout(() => { btn.textContent = '📋 COPY CODE'; }, 1800); }
  });
}

async function searchPlayerByCode(query) {
  if (!requireAuth('search players')) return;
  if (!fbDB) return;

  const currentAuthUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : authUser;
  console.log("[FriendSearch] authenticated UID:", currentAuthUser?.uid);
  if (!currentAuthUser) {
    const resultEl = document.getElementById('search-results-list');
    if (resultEl) resultEl.innerHTML = `<div class="empty-state">Please sign in to search for players.</div>`;
    return;
  }

  const rawInput = (query || '').trim();
  const resultEl = document.getElementById('search-results-list');
  if (!rawInput) {
    if (resultEl) resultEl.innerHTML = `<div class="empty-state">Enter a username or Friend Code to search.</div>`;
    return;
  }

  // Normalize inputs
  const cleaned = rawInput.replace(/^@+/, '').trim();
  const normalizedUsername = normalizeUsername(cleaned);
  const shortFriendCode = normalizeFriendCodeRaw(cleaned);
  const fullFriendCode = normalizeFriendCode(cleaned);
  const currentUid = currentAuthUser?.uid || null;

  // Determine search type
  let detectedType = 'username';
  if (/^TTT-[A-Z0-9]{4,12}$/i.test(cleaned) || /^TTT-/i.test(rawInput)) {
    detectedType = 'friendCode';
  } else if (rawInput.startsWith('@')) {
    detectedType = 'username';
  } else if (/^[A-Z0-9]{6,12}$/i.test(cleaned) && !cleaned.includes('_') && !cleaned.includes(' ')) {
    detectedType = 'friendCode';
  }

  const lookupPath = detectedType === 'friendCode' ? `friendCodes/${shortFriendCode}` : `usernames/${normalizedUsername}`;

  console.log("[IdentityDebug] current UID:", currentUid);
  console.log("[IdentityDebug] username:", playerProfile?.name);
  console.log("[IdentityDebug] friendCode:", playerProfile?.friendCode);
  console.log("[IdentityDebug] username index:", normalizeUsername(playerProfile?.name));
  console.log("[IdentityDebug] friendCode index:", normalizeFriendCodeRaw(playerProfile?.friendCode));
  console.log("[FriendSearch] raw input:", rawInput);
  console.log("[FriendSearch] normalized input:", detectedType === 'friendCode' ? shortFriendCode : normalizedUsername);
  console.log("[FriendSearch] detected type:", detectedType);
  console.log("[FriendSearch] lookup path:", lookupPath);

  if (resultEl) resultEl.innerHTML = `<div class="friends-loading">Searching…</div>`;

  let firebaseErrorType = null;
  let firebaseErrorMessage = null;

  try {
    let targetUid = null;

    if (detectedType === 'friendCode') {
      // 1. Primary: Lookup in friendCodes/CEPR84U7
      try {
        if (shortFriendCode) {
          const fcSnap = await fbDB.ref(`friendCodes/${shortFriendCode}`).once('value');
          if (fcSnap.exists()) targetUid = fcSnap.val();
        }
      } catch (err) {
        console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
        firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
        firebaseErrorMessage = err.message || String(err);
      }

      // 2. Secondary: Lookup in friendCodes/TTT-CEPR84U7
      if (!targetUid && fullFriendCode && !firebaseErrorType) {
        try {
          const fcSnap2 = await fbDB.ref(`friendCodes/${fullFriendCode}`).once('value');
          if (fcSnap2.exists()) targetUid = fcSnap2.val();
        } catch (err) {
          console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
          firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
          firebaseErrorMessage = err.message || String(err);
        }
      }

      // 3. Fallback: Lookup in usernames/
      if (!targetUid && normalizedUsername && !firebaseErrorType) {
        try {
          const uSnap = await fbDB.ref(`usernames/${normalizedUsername}`).once('value');
          if (uSnap.exists()) targetUid = uSnap.val();
        } catch (err) {
          console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
          firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
          firebaseErrorMessage = err.message || String(err);
        }
      }
    } else {
      // 1. Primary: Lookup in usernames/
      try {
        if (normalizedUsername) {
          const uSnap = await fbDB.ref(`usernames/${normalizedUsername}`).once('value');
          if (uSnap.exists()) targetUid = uSnap.val();
        }
      } catch (err) {
        console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
        firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
        firebaseErrorMessage = err.message || String(err);
      }

      // 2. Fallback: Lookup in friendCodes/CEPR84U7
      if (!targetUid && shortFriendCode && !firebaseErrorType) {
        try {
          const fcSnap = await fbDB.ref(`friendCodes/${shortFriendCode}`).once('value');
          if (fcSnap.exists()) targetUid = fcSnap.val();
        } catch (err) {
          console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
          firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
          firebaseErrorMessage = err.message || String(err);
        }
      }

      // 3. Fallback: Lookup in friendCodes/TTT-CEPR84U7
      if (!targetUid && fullFriendCode && !firebaseErrorType) {
        try {
          const fcSnap2 = await fbDB.ref(`friendCodes/${fullFriendCode}`).once('value');
          if (fcSnap2.exists()) targetUid = fcSnap2.val();
        } catch (err) {
          console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
          firebaseErrorType = (err.code === 'PERMISSION_DENIED' || String(err).includes('permission_denied')) ? 'permission' : 'network';
          firebaseErrorMessage = err.message || String(err);
        }
      }
    }

    // 4. Non-indexed fallback: If targetUid still not found, check players directly
    if (!targetUid && !firebaseErrorType) {
      try {
        if (fullFriendCode) {
          const pFcSnap = await fbDB.ref('players').orderByChild('friendCode').equalTo(fullFriendCode).once('value');
          if (pFcSnap.exists()) {
            const pVal = pFcSnap.val();
            const pKey = Object.keys(pVal)[0];
            if (pKey) {
              targetUid = pKey;
              if (shortFriendCode) fbDB.ref(`friendCodes/${shortFriendCode}`).set(targetUid).catch(() => {});
              if (fullFriendCode) fbDB.ref(`friendCodes/${fullFriendCode}`).set(targetUid).catch(() => {});
            }
          }
        }
        if (!targetUid && normalizedUsername) {
          const pNameSnap = await fbDB.ref('players').orderByChild('name').equalTo(cleaned).once('value');
          if (pNameSnap.exists()) {
            const pVal = pNameSnap.val();
            const pKey = Object.keys(pVal)[0];
            if (pKey) {
              targetUid = pKey;
              fbDB.ref(`usernames/${normalizedUsername}`).set(targetUid).catch(() => {});
            }
          }
        }
      } catch (e) {
        // Fallback query might fail if rules require index, which is safe to ignore
      }
    }

    console.log("[FriendSearch] resolved UID:", targetUid);

    if (firebaseErrorType === 'permission') {
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty-state">Unable to search right now. Firebase permissions are blocking search.</div>`;
      }
      showToast('Firebase permission error reading search index.', 'error');
      return;
    }

    if (firebaseErrorType === 'network') {
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty-state">Unable to search right now. Network error.</div>`;
      }
      showToast('Network error while searching.', 'error');
      return;
    }

    if (!targetUid) {
      console.log("[FriendSearch] INDEX NOT FOUND");
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty-state">User not found. Check the username or Friend Code.</div>`;
      }
      return;
    }

    // Fetch the player's profile data directly by UID
    let playerData = null;
    try {
      const pSnap = await fbDB.ref(`players/${targetUid}`).once('value');
      if (pSnap.exists()) playerData = pSnap.val();
    } catch (err) {
      console.error("[FriendSearch] FIREBASE PERMISSION ERROR", err);
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty-state">Unable to search right now. Firebase permissions are blocking search.</div>`;
      }
      return;
    }

    console.log("[FriendSearch] player profile:", playerData);

    if (!playerData) {
      console.log("[FriendSearch] PROFILE NOT FOUND FOR INDEX UID");
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty-state">User not found. Check the username or Friend Code.</div>`;
      }
      return;
    }

    // Check relationship statuses
    const isSelf = (currentUid && targetUid === currentUid);
    let isFriend = false;
    let incomingReqId = null;
    let outgoingPending = false;

    if (!isSelf && currentUid) {
      // 1. Is friend?
      if (friendsCache && friendsCache[targetUid]) {
        isFriend = true;
      } else {
        try {
          const fSnap = await fbDB.ref(`friends/${currentUid}/${targetUid}`).once('value');
          if (fSnap.exists()) isFriend = true;
        } catch (e) {}
      }

      // 2. Incoming request from target?
      try {
        const inSnap = await fbDB.ref(`friendRequests/${currentUid}`).once('value');
        if (inSnap.exists()) {
          const inData = inSnap.val() || {};
          for (const [key, val] of Object.entries(inData)) {
            if (val && val.fromUid === targetUid && val.status === 'pending') {
              incomingReqId = key;
              break;
            }
          }
        }
      } catch (e) {}

      // 3. Outgoing request to target?
      try {
        const outSnap = await fbDB.ref(`outgoingRequests/${currentUid}`).once('value');
        if (outSnap.exists()) {
          const outData = outSnap.val() || {};
          for (const val of Object.values(outData)) {
            if (val && val.toUid === targetUid && (!val.status || val.status === 'pending')) {
              outgoingPending = true;
              break;
            }
          }
        }
      } catch (e) {}
    }

    const dotCls  = presenceDotClass(playerData.presence, playerData.online);
    const statTxt = presenceStatusText(playerData.presence, playerData.online, playerData.lastSeen);
    const displayName = escHtml(playerData.name || 'Player');
    const usernameHandle = '@' + escHtml(normalizeUsername(playerData.name || 'player'));
    const friendCodeDisplay = escHtml(playerData.friendCode || fullFriendCode || '');

    let actionHtml = '';
    if (isSelf) {
      actionHtml = `<span class="src-badge-self">You (This is your profile)</span>`;
    } else if (isFriend) {
      actionHtml = `<span class="src-badge-friend">✓ FRIENDS</span>`;
    } else if (incomingReqId) {
      actionHtml = `<button class="btn-freq-accept btn-search-accept" data-uid="${escHtml(targetUid)}" data-req="${escHtml(incomingReqId)}">ACCEPT REQUEST</button>`;
    } else if (outgoingPending) {
      actionHtml = `<span class="src-badge-sent">REQUEST SENT</span>`;
    } else {
      actionHtml = `<button class="fr-btn fr-invite btn-search-add" data-uid="${escHtml(targetUid)}" data-name="${displayName}" data-emoji="${escHtml(playerData.emoji || '⚡')}" data-code="${friendCodeDisplay}" title="Send friend request">+ ADD FRIEND</button>`;
    }

    resultEl.innerHTML = `
      <div class="search-result-card" data-uid="${escHtml(targetUid)}">
        <div class="src-avatar">${escHtml(playerData.emoji || '⚡')}</div>
        <div class="src-info">
          <div class="src-name">${displayName} <span class="src-handle">${usernameHandle}</span></div>
          <div class="src-code">Friend Code: <strong>${friendCodeDisplay}</strong></div>
          <div class="src-status"><span class="status-dot ${dotCls}"></span>${escHtml(statTxt)}</div>
        </div>
        <div class="src-action-wrap">${actionHtml}</div>
      </div>`;

    // Attach search card button listeners
    resultEl.querySelectorAll('.btn-search-add').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const name = btn.dataset.name;
        const emoji = btn.dataset.emoji;
        const code = btn.dataset.code;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        const res = await sendFriendRequestToUid(uid, name, emoji, code);
        if (res && res.success) {
          const wrap = btn.closest('.src-action-wrap');
          if (wrap) wrap.innerHTML = `<span class="src-badge-sent">REQUEST SENT</span>`;
        } else {
          btn.disabled = false;
          btn.textContent = '+ ADD FRIEND';
        }
      });
    });

    resultEl.querySelectorAll('.btn-search-accept').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const reqId = btn.dataset.req;
        btn.disabled = true;
        btn.textContent = 'Accepting…';
        await acceptFriendRequest(uid, reqId);
        const wrap = btn.closest('.src-action-wrap');
        if (wrap) wrap.innerHTML = `<span class="src-badge-friend">✓ FRIENDS</span>`;
      });
    });

  } catch (error) {
    console.error("[FriendSearch] search failed:", error);
    if (resultEl) {
      resultEl.innerHTML = `<div class="empty-state">Unable to search right now. Please try again.</div>`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 36B: IN-MATCH OPPONENT FRIEND UI & ADD FRIEND MODAL
// ═══════════════════════════════════════════════════════════════

let lastRoomData = null;

async function updateMatchOpponentFriendUI(roomData) {
  if (!roomData) return;
  lastRoomData = roomData;

  const wrapX = document.getElementById('match-friend-wrap-x');
  const wrapO = document.getElementById('match-friend-wrap-o');
  if (!wrapX || !wrapO) return;

  // If not online mode, hide both wraps
  if (gameMode !== 'online') {
    wrapX.style.display = 'none';
    wrapX.innerHTML = '';
    wrapO.style.display = 'none';
    wrapO.innerHTML = '';
    return;
  }

  // Get current player identity
  let currentUid = authUser?.uid || (typeof fbAuth !== 'undefined' && fbAuth?.currentUser?.uid) || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()?.currentUser?.uid) || playerProfile?.uid || playerProfile?.playerId || null;

  let opponentUid = null;
  let opponentName = '';
  let opponentEmoji = '⚡';
  let opponentFriendCode = '';
  let opponentWrap = null;
  let selfWrap = null;

  // Use mySymbol as the ground-truth perspective source
  if (mySymbol === 'X') {
    currentUid = roomData.creatorId || currentUid;
    opponentUid = roomData.joinerId || null;
    opponentName = roomData.joinerName || 'Player O';
    opponentEmoji = roomData.joinerEmoji || '👾';
    opponentFriendCode = roomData.joinerFriendCode || '';
    selfWrap = wrapX;
    opponentWrap = wrapO;
  } else if (mySymbol === 'O') {
    currentUid = roomData.joinerId || currentUid;
    opponentUid = roomData.creatorId || null;
    opponentName = roomData.creatorName || 'Player X';
    opponentEmoji = roomData.creatorEmoji || '⚡';
    opponentFriendCode = roomData.creatorFriendCode || '';
    selfWrap = wrapO;
    opponentWrap = wrapX;
  } else {
    // Fallback if mySymbol is not yet 'X' or 'O'
    if (currentUid && roomData.creatorId && currentUid === roomData.creatorId) {
      opponentUid = roomData.joinerId || null;
      opponentName = roomData.joinerName || 'Player O';
      opponentEmoji = roomData.joinerEmoji || '👾';
      opponentFriendCode = roomData.joinerFriendCode || '';
      selfWrap = wrapX;
      opponentWrap = wrapO;
    } else if (currentUid && roomData.joinerId && currentUid === roomData.joinerId) {
      opponentUid = roomData.creatorId || null;
      opponentName = roomData.creatorName || 'Player X';
      opponentEmoji = roomData.creatorEmoji || '⚡';
      opponentFriendCode = roomData.creatorFriendCode || '';
      selfWrap = wrapO;
      opponentWrap = wrapX;
    }
  }

  // Hide own card's friend action wrap ALWAYS
  if (selfWrap) {
    selfWrap.style.display = 'none';
    selfWrap.innerHTML = '';
  }

  // Strict diagnostics requested
  console.log("[FriendUI] mySymbol:", mySymbol);
  console.log("[FriendUI] room creatorId:", roomData.creatorId);
  console.log("[FriendUI] room joinerId:", roomData.joinerId);
  console.log("[FriendUI] Firebase current UID:", currentUid);
  console.log("[FriendUI] RESOLVED opponent UID:", opponentUid);

  // Safety validation
  if (!opponentUid || opponentUid === currentUid) {
    console.error(
      "[FriendUI] INVALID OPPONENT UID",
      { currentUid, opponentUid, mySymbol, roomData }
    );
    if (opponentWrap) {
      opponentWrap.style.display = 'none';
      opponentWrap.innerHTML = '';
    }
    return;
  }

  // Ensure opponent wrap is visible on the opponent's card
  if (opponentWrap) {
    opponentWrap.style.display = 'flex';
    opponentWrap.style.visibility = 'visible';
    opponentWrap.style.opacity = '1';
  }

  // Helper renderers
  const renderAddBtn = () => {
    opponentWrap.innerHTML = `<button class="btn-match-friend btn-match-friend-add" id="btn-match-add-opp">+ ADD FRIEND</button>`;
    document.getElementById('btn-match-add-opp')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = document.getElementById('btn-match-add-opp');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (!currentUid || !fbDB) {
        showToast('Please sign in to send friend requests.', 'warn');
        if (btn) { btn.disabled = false; btn.textContent = '+ ADD FRIEND'; }
        return;
      }
      const res = await sendFriendRequestToUid(opponentUid, opponentName, opponentEmoji, opponentFriendCode);
      if (res && res.success) {
        renderPendingBadge();
      } else {
        if (btn) { btn.disabled = false; btn.textContent = '+ ADD FRIEND'; }
      }
    });
  };

  const renderDoneBadge = () => {
    opponentWrap.innerHTML = `<span class="btn-match-friend btn-match-friend-done" title="Already in your squad">✓ FRIENDS</span>`;
  };

  const renderPendingBadge = () => {
    opponentWrap.innerHTML = `<span class="btn-match-friend btn-match-friend-pending" title="Friend request is pending">REQUEST SENT</span>`;
  };

  const renderAcceptBtn = (incomingReqId) => {
    opponentWrap.innerHTML = `<button class="btn-match-friend btn-match-friend-accept" id="btn-match-accept-opp">ACCEPT REQUEST</button>`;
    document.getElementById('btn-match-accept-opp')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = document.getElementById('btn-match-accept-opp');
      if (btn) { btn.disabled = true; btn.textContent = 'Accepting…'; }
      await acceptFriendRequest(opponentUid, incomingReqId);
      if (opponentUid) friendsCache[opponentUid] = true;
      renderDoneBadge();
    });
  };

  // Immediate default rendering to guarantee button is visibly rendered without waiting
  renderAddBtn();

  if (!fbDB || !currentUid || !opponentUid) {
    return;
  }

  try {
    // 1. Is already friend?
    if (friendsCache[opponentUid]) {
      renderDoneBadge();
      return;
    }
    const fSnap = await fbDB.ref(`friends/${currentUid}/${opponentUid}`).once('value');
    if (fSnap.exists()) {
      friendsCache[opponentUid] = fSnap.val() || true;
      renderDoneBadge();
      return;
    }

    // 2. Incoming request from opponent?
    const inSnap = await fbDB.ref(`friendRequests/${currentUid}`).once('value');
    let incomingReqId = null;
    if (inSnap.exists()) {
      const inData = inSnap.val() || {};
      for (const [key, val] of Object.entries(inData)) {
        if (val && val.fromUid === opponentUid && val.status === 'pending') {
          incomingReqId = key;
          break;
        }
      }
    }

    if (incomingReqId) {
      renderAcceptBtn(incomingReqId);
      return;
    }

    // 3. Outgoing request sent to opponent?
    let outgoingPending = false;
    const [outSnap, oppReqSnap] = await Promise.all([
      fbDB.ref(`outgoingRequests/${currentUid}`).once('value').catch(err => {
        console.warn("[FriendRequest] outgoing read error:", err);
        return { exists: () => false, val: () => ({}) };
      }),
      fbDB.ref(`friendRequests/${opponentUid}`).once('value').catch(err => {
        console.warn("[FriendRequest] opponent req read error:", err);
        return { exists: () => false, val: () => ({}) };
      })
    ]);

    if (outSnap.exists()) {
      const outData = outSnap.val() || {};
      for (const val of Object.values(outData)) {
        if (val && val.toUid === opponentUid && (!val.status || val.status === 'pending')) {
          outgoingPending = true;
          break;
        }
      }
    }

    if (!outgoingPending && oppReqSnap.exists()) {
      const oppData = oppReqSnap.val() || {};
      for (const val of Object.values(oppData)) {
        if (val && val.fromUid === currentUid && val.status === 'pending') {
          outgoingPending = true;
          break;
        }
      }
    }

    if (outgoingPending) {
      renderPendingBadge();
      return;
    }

    // 4. Default: + ADD FRIEND
    renderAddBtn();
  } catch (err) {
    console.warn('[TTTArena] updateMatchOpponentFriendUI query error:', err);
    renderAddBtn();
  }
}

// ═══════════════════════════════════════════════════════════════
//  PART 37: NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════

function listenForNotificationsV2() {
  if (!fbDB || !authUser) return;
  const uid = authUser.uid;
  if (notifListener) { try { fbDB.ref(`notifications/${uid}`).off('value', notifListener); } catch{} notifListener = null; }
  notifListener = fbDB.ref(`notifications/${uid}`).orderByChild('ts').limitToLast(50).on('value', snap => {
    const data = snap.val() || {};
    notifCache = Object.entries(data).map(([id, n]) => ({ id, ...n })).sort((a, b) => b.ts - a.ts);
    const unread = notifCache.filter(n => !n.read).length;
    const badge  = document.getElementById('notif-badge');
    if (badge) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
  });
}

function renderNotificationCenter() {
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;
  const localRaw = JSON.parse(localStorage.getItem(NOTIF_LOCAL) || '[]');
  const all = [...notifCache, ...localRaw].sort((a, b) => b.ts - a.ts).slice(0, 40);
  if (!all.length) { listEl.innerHTML = `<div class="empty-state" style="padding:28px 0">🔔 No notifications yet.</div>`; return; }
  listEl.innerHTML = all.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${escHtml(n.id || '')}">
      <div class="notif-icon">${escHtml(n.icon || '🔔')}</div>
      <div class="notif-body">
        <div class="notif-text">${escHtml(n.text || '')}</div>
        <div class="notif-time">${timeAgo(n.ts || Date.now())}</div>
      </div>
    </div>`).join('');
  listEl.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.remove('unread');
      const nid = el.dataset.id;
      if (authUser && fbDB && nid && !nid.startsWith('local_')) {
        fbDB.ref(`notifications/${authUser.uid}/${nid}`).update({ read: true }).catch(() => {});
      }
    });
  });
}

function markAllNotificationsRead() {
  if (authUser && fbDB) {
    notifCache.filter(n => !n.read).forEach(n => {
      fbDB.ref(`notifications/${authUser.uid}/${n.id}`).update({ read: true }).catch(() => {});
    });
  }
  const local = JSON.parse(localStorage.getItem(NOTIF_LOCAL) || '[]').map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIF_LOCAL, JSON.stringify(local));
  renderNotificationCenter();
  const badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
}
document.getElementById('btn-mark-all-read')?.addEventListener('click', markAllNotificationsRead);

// ═══════════════════════════════════════════════════════════════
//  PART 38: SECURITY & SANITIZATION
// ═══════════════════════════════════════════════════════════════

function sanitizeUsername(name) {
  if (!name) return '';
  // Remove HTML tags, special chars; allow alphanumeric + space + underscore + dash
  return name.replace(/[<>&"']/g, '').replace(/[^a-zA-Z0-9 _\-]/g, '').trim().slice(0, 16);
}

// Dedup invite sends (in-memory per session)
const _sentInvites = new Set();
function isDuplicateInvite(toUid) {
  const key = `${authUser?.uid}_${toUid}`;
  if (_sentInvites.has(key)) return true;
  _sentInvites.add(key);
  setTimeout(() => _sentInvites.delete(key), 60000);
  return false;
}

// ═══════════════════════════════════════════════════════════════
//  PART 39: ARCHITECTURE STUBS + AUTH-AWARE INVITE LINK
// ═══════════════════════════════════════════════════════════════
/*
  Future Firebase Collections (ready for extension without rewrites):

  chat/{roomId}/messages/{msgId}         — In-game or global chat
    { uid, name, text, ts, emoji }

  clans/{clanId}/
    { name, tag, ownerUid, banner, members/{uid}: role, createdAt }
  clanMembers/{uid}/clanId               — Reverse index

  tournaments/{tournamentId}/
    { name, status, bracket, participants/{uid}: seed }

  achievements/{uid}/unlocked/{achId}
    { ts, name, icon, desc, rarity }

  reports/{reportId}/
    { fromUid, targetUid, reason, evidence, ts, status }

  Each collection is orthogonal and independently extensible.
  Auth UID is the canonical key across ALL collections.
*/

// Override checkUrlRoomParam with auth-aware version
function checkUrlRoomParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const room   = (params.get('room') || '').toUpperCase().slice(0, 6);
    if (!room || room.length !== 6) return;

    const joinRoom = () => {
      if (!initFirebase()) {
        showToast('Firebase not configured — cannot join via invite link.', 'warn');
        return;
      }
      if (!authUser) {
        // Save room code and prompt login
        pendingRoomCode = room;
        showToast(`Room code "${room}" detected. Login to join! ⚡`, 'info');
        setTimeout(showAuthModal, 500);
        return;
      }
      // Logged in — fill in join input and go to lobby
      try {
        firebaseWarning.style.display    = 'none';
        lobbyPanel.style.display         = 'flex';
        createdCodeDisplay.style.display = 'none';
        joinCodeInput.value              = room;
        joinError.style.display          = 'none';
        hideInviteLink();
        
        const proceed = () => {
          showScreen('screen-online-lobby');
          showToast(`Invite link detected! Room: ${room}. Press JOIN to enter. 🎮`, 'info');
        };

        const landing = document.getElementById('landing');
        if (landing && landing.classList.contains('visible')) {
          enterGame(proceed);
        } else {
          proceed();
        }
      } catch(e) { console.warn('[TTTArena] URL join failed:', e); }
    };

    const splash = document.getElementById('splash');
    if (isDisclaimerAcknowledged() || !splash || splash.style.display === 'none' || !splash.classList.contains('visible')) {
      setTimeout(joinRoom, 800);
    } else {
      document.getElementById('btn-acknowledge')?.addEventListener('click', () => setTimeout(joinRoom, 800), { once: true });
    }
  } catch(e) { console.warn('[TTTArena] checkUrlRoomParam failed:', e); }
}

