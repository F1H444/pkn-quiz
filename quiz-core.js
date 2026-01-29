/**
 * quiz-core.js
 * Shared logic for timer, user data, profile, and navigation control.
 */

const QuizCore = {
  TIMER_DURATION: 120, // 2 minutes

  init() {
    this.checkUser();
    this.handleNavigation();
    this.injectGlobalStyles();
    this.injectProfile();
    this.injectQuestionNumber();
    this.startTimer();
  },

  checkUser() {
    const userData = localStorage.getItem("quiz_user");
    if (!userData && !window.location.pathname.includes("index.html")) {
      window.location.href = "index.html";
    }
  },

  getUser() {
    return (
      JSON.parse(localStorage.getItem("quiz_user")) || {
        name: "Student",
        absen: "-",
        kelas: "-",
      }
    );
  },

  saveUser(name, absen, kelas) {
    localStorage.setItem("quiz_user", JSON.stringify({ name, absen, kelas }));
    localStorage.setItem("totalScore", "0");
    localStorage.setItem("quiz_max_index", "1");
    const endTime = Date.now() + this.TIMER_DURATION * 1000;
    localStorage.setItem("quiz_endTime", endTime);
  },

  handleNavigation() {
    const path = window.location.pathname;
    if (path.includes("index.html") || path.includes("selesai.html")) return;

    const match = path.match(/soal(\d+)\.html/);
    if (match) {
      const currentIdx = parseInt(match[1]);
      let maxIdx = parseInt(localStorage.getItem("quiz_max_index")) || 1;
      let lastIdx = parseInt(localStorage.getItem("quiz_last_index")) || 0;

      // Reset timer if this is a new question page load
      if (currentIdx !== lastIdx) {
        const endTime = Date.now() + this.TIMER_DURATION * 1000;
        localStorage.setItem("quiz_endTime", endTime.toString());
        localStorage.setItem("quiz_last_index", currentIdx.toString());
      }

      // Block back navigation
      if (currentIdx < maxIdx) {
        window.location.href = `soal${maxIdx}.html`;
        return;
      }

      // Update max progress
      if (currentIdx > maxIdx) {
        localStorage.setItem("quiz_max_index", currentIdx.toString());
      }
    }
  },

  injectGlobalStyles() {
    if (document.getElementById("quiz-global-styles")) return;
    const style = document.createElement("style");
    style.id = "quiz-global-styles";
    style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Inter:wght@400;700;900&display=swap');
            
            :root {
                --brutalist-border: 4px solid #000;
                --brutalist-shadow: 6px 6px 0px #000;
                --accent-blue: #00f2ff;
                --accent-yellow: #ffee00;
            }

            .brutalist-card {
                background: #fff;
                border: var(--brutalist-border);
                box-shadow: var(--brutalist-shadow);
                padding: 20px;
                transition: 0.2s;
            }

            .brutalist-card:hover {
                transform: translate(-2px, -2px);
                box-shadow: 10px 10px 0px #000;
            }
        `;
    document.head.appendChild(style);
  },

  injectProfile() {
    if (window.location.pathname.includes("index.html")) return;

    const user = this.getUser();
    const profileHTML = `
            <div id="quiz-profile-badge" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff;
                border: 4px solid #000;
                box-shadow: 6px 6px 0px #000;
                padding: 10px 20px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 15px;
                font-family: 'Inter', sans-serif;
                animation: slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            ">
                <style>
                    @keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
                </style>
                <div style="
                    width: 35px;
                    height: 35px;
                    background: var(--accent-blue, #00f2ff);
                    border: 3px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 1rem;
                ">${user.name.charAt(0).toUpperCase()}</div>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 900; line-height: 1.1; color: #000;">${
                      user.name
                    }</div>
                    <div style="font-size: 0.65rem; font-weight: 700; opacity: 0.7; color: #000;">${
                      user.kelas
                    } | Ab: ${user.absen}</div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML("afterbegin", profileHTML);
  },

  injectQuestionNumber() {
    const path = window.location.pathname;
    const match = path.match(/soal(\d+)\.html/);
    if (!match) return;

    const num = match[1];
    const badgeHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                background: #000;
                color: #fff;
                border: 4px solid #000;
                padding: 8px 25px;
                font-weight: 900;
                font-size: 1.1rem;
                z-index: 1000;
                box-shadow: 6px 6px 0px var(--accent-yellow, #ffee00);
                font-family: 'Outfit', sans-serif;
            ">
                SOAL ${num} / 10
            </div>
        `;
    document.body.insertAdjacentHTML("afterbegin", badgeHTML);
  },

  startTimer() {
    if (
      window.location.pathname.includes("index.html") ||
      window.location.pathname.includes("selesai.html")
    )
      return;

    const timerDisplay = document.getElementById("timer");
    if (!timerDisplay) return;

    // Apply Neo-Brutalist timer style
    timerDisplay.style.background = "#ff0055";
    timerDisplay.style.color = "#fff";
    timerDisplay.style.border = "3px solid #000";
    timerDisplay.style.boxShadow = "4px 4px 0px #000";

    const update = () => {
      const endTime = parseInt(localStorage.getItem("quiz_endTime")) || 0;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));

      const m = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      timerDisplay.innerText = `${m}:${s}`;

      if (diff <= 0) {
        this.goToNextQuestion();
      } else {
        requestAnimationFrame(update);
      }
    };
    update();
  },

  goToNextQuestion() {
    const path = window.location.pathname;
    const match = path.match(/soal(\d+)\.html/);
    if (match) {
      const currentIdx = parseInt(match[1]);
      if (currentIdx < 10) {
        window.location.href = `soal${currentIdx + 1}.html`;
      } else {
        window.location.href = "selesai.html";
      }
    } else {
      // Default to finished if we can't determine current question
      window.location.href = "selesai.html";
    }
  },

  updateScore(points) {
    let current = parseInt(localStorage.getItem("totalScore")) || 0;
    localStorage.setItem("totalScore", (current + points).toString());
  },
};

window.addEventListener("DOMContentLoaded", () => QuizCore.init());
