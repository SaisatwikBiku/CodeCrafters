/**
 * app.js — CodeCrafters frontend logic
 */

const state = {
  socket: null,
  sessionId: null,
  playerName: null,
  role: null,
  currentStage: 1,
  score: 0,
  completedStages: 0,
};

const screens = {
  login:    document.getElementById('screen-login'),
  register: document.getElementById('screen-register'),
  lobby:    document.getElementById('screen-lobby'),
  waiting:  document.getElementById('screen-waiting'),
  game:     document.getElementById('screen-game'),
  complete: document.getElementById('screen-complete'),
};

const lobbyStatus      = document.getElementById('lobby-status');
const inputSessionId   = document.getElementById('input-session-id');
const joinPanel        = document.getElementById('join-panel');
const displaySessionId = document.getElementById('display-session-id');
const displayRole      = document.getElementById('display-role');

const hdrRole     = document.getElementById('hdr-role');
const hdrStage    = document.getElementById('hdr-stage');
const hdrScore    = document.getElementById('hdr-score');
const progressBar = document.getElementById('progress-bar');

const missionTitle  = document.getElementById('mission-title');
const missionDesc   = document.getElementById('mission-desc');
const missionSteps  = document.getElementById('mission-steps');
const codeEditor    = document.getElementById('code-editor');
const consoleOutput = document.getElementById('console-output');
const btnRun        = document.getElementById('btn-run');

const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const btnSend      = document.getElementById('btn-send');
const campusCanvas = document.getElementById('campus-canvas');

const modalWaiting  = document.getElementById('modal-waiting');
const modalComplete = document.getElementById('modal-stage-complete');
const completeTitle    = document.getElementById('complete-title');
const completeSubtitle = document.getElementById('complete-subtitle');
const completeScore    = document.getElementById('complete-score');
const completeCanvas   = document.getElementById('complete-canvas');
const btnNextLevel     = document.getElementById('btn-next-level');

// ── Screen Manager ─────────────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Create Game ────────────────────────────────────────────
document.getElementById('btn-create').addEventListener('click', async () => {
  const btn = document.getElementById('btn-create');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: AUTH.authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Could not create session.');
      btn.disabled = false;
      btn.textContent = 'NEW GAME (Create ID)';
      return;
    }

    state.playerName = AUTH.getUsername();
    state.sessionId  = data.sessionId;
    state.role       = data.role;

    displaySessionId.textContent = data.sessionId;
    displayRole.textContent      = data.role;
    showScreen('waiting');
    connectSocket();
  } catch (err) {
    alert('Could not connect to server.');
    btn.disabled = false;
    btn.textContent = 'NEW GAME (Create ID)';
  }
});

// ── Join Game ──────────────────────────────────────────────
document.getElementById('btn-join').addEventListener('click', () => {
  joinPanel.classList.toggle('hidden');
});

document.getElementById('btn-confirm-join').addEventListener('click', async () => {
  const id  = inputSessionId.value.trim().toUpperCase();
  if (!id || id.length < 6) return alert('Enter a valid session ID!');

  const btn = document.getElementById('btn-confirm-join');
  btn.disabled = true;
  btn.textContent = 'Joining...';

  try {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: AUTH.authHeaders(),
      body: JSON.stringify({ sessionId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Could not join session.');
      btn.disabled = false;
      btn.textContent = 'Join';
      return;
    }

    state.playerName   = AUTH.getUsername();
    state.sessionId    = data.sessionId;
    state.role         = data.role;
    state.currentStage = data.stage;

    connectSocket();
  } catch (err) {
    alert('Could not connect to server.');
    btn.disabled = false;
    btn.textContent = 'Join';
  }
});

// ── Socket.IO ──────────────────────────────────────────────
function connectSocket() {
  // Handle rejoin from auth.js
  if (window._pendingJoin) {
    state.playerName   = AUTH.getUsername();
    state.sessionId    = window._pendingJoin.sessionId;
    state.role         = window._pendingJoin.role;
    state.currentStage = window._pendingJoin.stage;
    window._pendingJoin = null;
  }

  state.socket = io({
    auth: { token: AUTH.getToken() },
  });

  state.socket.on('connect', () => {
    lobbyStatus.textContent = 'Status: Connected ✅';
    state.socket.emit('join_room', {
      sessionId:  state.sessionId,
      playerName: state.playerName,
      role:       state.role,
    });
  });

  state.socket.on('player_joined', ({ playerName, role, state: gameState }) => {
    appendSystemChat(`${playerName} joined as ${role}.`);

    if (gameState?.players?.Architect && gameState?.players?.Builder) {
      state.currentStage    = gameState.stage;
      state.score           = gameState.score;
      state.completedStages = gameState.stage - 1;
      loadStage(state.currentStage);
      showScreen('game');
    }
  });

  state.socket.on('chat_message', ({ playerName, message }) => {
    appendChat(playerName, message);
  });

  state.socket.on('partner_status', ({ role, ready, allReady }) => {
    if (ready && !allReady) {
      appendSystemChat(`Your partner is ready! Finishing up...`);
    }
  });

  state.socket.on('stage_complete', ({ completedStage, nextStage, score }) => {
    state.completedStages = completedStage;
    state.score           = score;
    state.currentStage    = nextStage;
    modalWaiting.classList.add('hidden');
    showStageCompleteModal(completedStage, score);
  });

  state.socket.on('game_complete', ({ state: gameState }) => {
    modalWaiting.classList.add('hidden');
    document.getElementById('final-score').textContent = `Final Score: ${gameState.score}/500`;
    CampusRenderer.draw(document.getElementById('final-campus-canvas'), 5);
    showScreen('complete');
  });

  state.socket.on('player_disconnected', ({ playerName, role }) => {
    appendSystemChat(`⚠️ ${playerName} (${role}) disconnected.`);
  });

  state.socket.on('error', ({ message }) => {
    alert('Server error: ' + message);
  });
}

// ── Game Stage Loader ──────────────────────────────────────
function loadStage(stageNumber) {
  const stage = window.STAGES[stageNumber - 1];
  if (!stage) return;

  const task = stage.tasks[state.role];

  missionTitle.textContent = task.title;
  missionDesc.textContent  = task.description;
  missionSteps.innerHTML   = task.steps.map(s => `<li>${s}</li>`).join('');
  codeEditor.value         = task.starterCode;

  consoleOutput.textContent = 'Output will appear here...';
  consoleOutput.className   = 'console';

  hdrRole.textContent  = state.role;
  hdrStage.textContent = `Stage ${stageNumber} / 5`;
  hdrScore.textContent = `Score: ${state.score}`;
  progressBar.style.width = `${((stageNumber - 1) / 5) * 100}%`;

  CampusRenderer.draw(campusCanvas, state.completedStages);
}

// ── Run Code ───────────────────────────────────────────────
btnRun.addEventListener('click', async () => {
  const code = codeEditor.value.trim();
  if (!code) return;

  btnRun.disabled = true;
  btnRun.textContent = '⏳ Running...';
  consoleOutput.textContent = '...';
  consoleOutput.className   = 'console';

  try {
    const stage    = window.STAGES[state.currentStage - 1];
    const task     = stage.tasks[state.role];
    const expected = task.expected_output;

    const res = await fetch('/api/code/run', {
      method: 'POST',
      headers: AUTH.authHeaders(),
      body: JSON.stringify({ source_code: code, expected_output: expected }),
    });
    const data = await res.json();

    if (data.stderr) {
      consoleOutput.textContent = data.stderr;
      consoleOutput.classList.add('error');
    } else {
      consoleOutput.textContent = data.stdout || '(no output)';
    }

    const passed = expected === null ? (data.status === 'Accepted') : data.passed;

    if (passed) {
      consoleOutput.textContent += '\n\n✅ Correct! Waiting for partner...';
      modalWaiting.classList.remove('hidden');
      state.socket.emit('task_complete', {
        sessionId: state.sessionId,
        role:      state.role,
      });
    } else if (!data.stderr) {
      consoleOutput.textContent += '\n\n❌ Not quite right — try again!';
    }
  } catch (err) {
    consoleOutput.textContent = 'Error: Could not reach code runner.';
    consoleOutput.classList.add('error');
  } finally {
    btnRun.disabled   = false;
    btnRun.textContent = '▶ RUN CODE / SUBMIT';
  }
});

// ── Chat ───────────────────────────────────────────────────
function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg || !state.socket) return;
  state.socket.emit('chat_message', {
    sessionId:  state.sessionId,
    playerName: state.playerName,
    message:    msg,
  });
  chatInput.value = '';
}

btnSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

function appendChat(sender, message) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="sender">${escHtml(sender)}:</span><span class="text">${escHtml(message)}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystemChat(message) {
  const div = document.createElement('div');
  div.className = 'chat-msg system';
  div.innerHTML = `<span class="text">${escHtml(message)}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Stage Complete Modal ───────────────────────────────────
function showStageCompleteModal(completedStage, score) {
  const building = window.STAGES[completedStage - 1]?.building || 'Building';
  completeTitle.textContent    = `LEVEL ${completedStage} COMPLETE!`;
  completeSubtitle.textContent = `${building} Built.`;
  completeScore.textContent    = `Team Score: ${score}/500 | Progress: ${(completedStage / 5 * 100).toFixed(0)}%`;
  CampusRenderer.drawMini(completeCanvas, completedStage);
  modalComplete.classList.remove('hidden');
}

btnNextLevel.addEventListener('click', () => {
  modalComplete.classList.add('hidden');
  loadStage(state.currentStage);
});

// ── Helpers ────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
