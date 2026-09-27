(() => {
    const PROGRESS_KEY = "ronikCasinoProgress";
    const LEVEL_TWO_WINS = 25;
    const LEVEL_THREE_WINS = 50;

    function loadProgress(){
        const stored = localStorage.getItem(PROGRESS_KEY);
        if(stored === null) return { rouletteWins: 0 };
        try{
            const parsed = JSON.parse(stored);
            const wins = Number(parsed.rouletteWins);
            return { rouletteWins: Number.isSafeInteger(wins) && wins >= 0 ? Math.min(wins, LEVEL_THREE_WINS) : 0 };
        }catch(error){
            return { rouletteWins: 0 };
        }
    }

    function saveProgress(progress){
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }

    function getProgressState(){
        const rouletteWins = loadProgress().rouletteWins;
        const level = rouletteWins >= LEVEL_THREE_WINS ? 3 : rouletteWins >= LEVEL_TWO_WINS ? 2 : 1;
        const progress = rouletteWins / LEVEL_THREE_WINS;
        return { rouletteWins, level, progress };
    }

    function recordRouletteWin(){
        const progress = loadProgress();
        if(progress.rouletteWins < LEVEL_THREE_WINS){
            progress.rouletteWins += 1;
            saveProgress(progress);
        }
        renderProgressUI();
    }

    function renderProgressUI(){
        const state = getProgressState();
        const title = state.level === 1 ? "Начинающий" : state.level === 2 ? "Уровень 2" : "MAX";
        const nextText = state.level === 1 ? `${state.rouletteWins} / ${LEVEL_TWO_WINS} побед до Дайса` : state.level === 2 ? `${state.rouletteWins} / ${LEVEL_THREE_WINS} побед до Минёра` : `${LEVEL_THREE_WINS} / ${LEVEL_THREE_WINS} побед`;
        document.querySelectorAll(".levelSlot").forEach(slot => {
            slot.innerHTML = `<div class="levelProgress" aria-label="Прогресс уровня"><div class="levelHeader"><strong>Уровень ${state.level}: ${title}</strong><span>${nextText}</span><button class="levelHelp" type="button" aria-expanded="false" aria-label="Объяснение прогресса">?</button></div><div class="levelTrack"><span></span></div><div class="levelHelpText" hidden>Победы для уровня засчитываются только в режиме «Рулетка Роника». Победы в Дайсе и Минёре прогресс не увеличивают.</div></div>`;
            const fill = slot.querySelector(".levelTrack span");
            requestAnimationFrame(() => {
                fill.style.width = `${state.progress * 100}%`;
            });
            const helpButton = slot.querySelector(".levelHelp");
            const helpText = slot.querySelector(".levelHelpText");
            helpButton.addEventListener("click", () => {
                helpText.hidden = !helpText.hidden;
                helpButton.setAttribute("aria-expanded", String(!helpText.hidden));
            });
        });
    }

    function applyModeLocks(){
        const state = getProgressState();
        document.querySelectorAll("[data-required-level]").forEach(mode => {
            const requiredLevel = Number(mode.dataset.requiredLevel);
            if(state.level >= requiredLevel) return;
            mode.classList.add("locked");
            mode.setAttribute("aria-disabled", "true");
            if(mode.tagName === "A"){
                mode.addEventListener("click", event => event.preventDefault());
            }
            const lockText = requiredLevel === 2 ? "Откроется после 25 побед в рулетке." : "Откроется после 50 побед в рулетке.";
            const description = mode.querySelector("p");
            if(description) description.textContent = lockText;
        });
    }

    function requireGameLevel(requiredLevel, gameName){
        const state = getProgressState();
        if(state.level >= requiredLevel) return true;
        const main = document.querySelector("main");
        if(main){
            main.innerHTML = `<section class="lockedScreen"><div class="lockedIcon">🔒</div><h1>Игра заблокирована</h1><p>${gameName} откроется на ${requiredLevel} уровне.</p><a href="index.html">Вернуться в меню</a></section>`;
        }
        return false;
    }

    const style = document.createElement("style");
    style.textContent = `
        .levelSlot{width:min(560px,calc(100% - 32px));margin:12px auto 0;}
        .levelProgress{padding:10px 14px;border:1px solid rgba(255,204,0,.3);border-radius:12px;background:rgba(10,10,10,.58);box-shadow:0 8px 24px rgba(0,0,0,.18);}
        .levelHeader{display:flex;justify-content:space-between;gap:12px;color:#e8e8e8;font-size:12px;line-height:1.3;}
        .levelHeader strong{color:#ffd633;}
        .levelHeader span{color:#aaa;text-align:right;}
        .levelHelp{width:22px;height:22px;min-width:22px;margin:0;padding:0;border:1px solid rgba(255,214,51,.65);border-radius:50%;background:#29200b;color:#ffd633;font-size:13px;font-weight:bold;line-height:20px;cursor:pointer;}
        .levelTrack{height:7px;margin-top:8px;overflow:hidden;border-radius:999px;background:#292929;}
        .levelTrack span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c78300,#ffe36b);transition:width .3s ease;}
        .levelHelpText{margin-top:9px;color:#c7c7c7;font-size:12px;line-height:1.4;text-align:left;}
        .mode.locked{cursor:not-allowed;filter:saturate(.35);opacity:.62;}
        .mode.locked:hover{transform:none;border-color:#6a4b00;box-shadow:0 0 28px rgba(255,180,0,.16);}
        .lockedScreen{width:min(560px,100%);margin:48px auto;padding:36px 20px;border:1px solid #6a4b00;border-radius:18px;background:linear-gradient(145deg,#242424,#0d0d0d);text-align:center;}
        .lockedIcon{font-size:56px;}
        .lockedScreen h1{margin:12px 0;color:#ffd633;font-size:30px;}
        .lockedScreen p{color:#c7c7c7;}
        .lockedScreen a{display:inline-block;margin-top:12px;padding:10px 16px;border-radius:9px;background:#c78300;color:#171000;font-weight:bold;text-decoration:none;}
        @media (max-width:520px){.levelSlot{width:calc(100% - 24px);}.levelHeader{font-size:11px;}}
    `;
    document.head.appendChild(style);

    window.loadProgress = loadProgress;
    window.getProgressState = getProgressState;
    window.recordRouletteWin = recordRouletteWin;
    window.renderProgressUI = renderProgressUI;
    window.applyModeLocks = applyModeLocks;
    window.requireGameLevel = requireGameLevel;
    renderProgressUI();
    applyModeLocks();
})();
