// ==========================================
// 0. 공통 로그인 상태 관리 & 상단 네비게이션 UI 연동
// ==========================================
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('kickforma_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem('kickforma_user');
  alert('로그아웃 되었습니다.');
  window.location.href = 'index.html';
}

function updateHeaderAuthUI() {
  const nav = document.querySelector('.desktop-nav');
  if (!nav) return;

  // 중복 추가 방지
  const existingAuth = nav.querySelector('.auth-nav-group');
  if (existingAuth) existingAuth.remove();

  const user = getCurrentUser();
  const authSpan = document.createElement('span');
  authSpan.className = 'auth-nav-group';
  authSpan.style.display = 'inline-flex';
  authSpan.style.alignItems = 'center';
  authSpan.style.gap = '14px';
  authSpan.style.marginLeft = '12px';

  if (user) {
    const isMyPage = window.location.pathname.endsWith('mypage.html');
    authSpan.innerHTML = `
      <a href="mypage.html" class="${isMyPage ? 'active' : ''}" style="color: #16A34A; font-weight: 700;">📋 내 전술함</a>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">${user.nickname}님</span>
      <button type="button" id="logoutBtn" style="background: #F1F5F9; border: 1px solid #CBD5E1; color: #334155; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">로그아웃</button>
    `;
    nav.appendChild(authSpan);
    document.querySelector('#logoutBtn').addEventListener('click', logoutUser);
  } else {
    authSpan.innerHTML = `
      <a href="login.html" style="background: #16A34A; color: #FFFFFF; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;">로그인</a>
    `;
    nav.appendChild(authSpan);
  }
}

// 페이지 로드 시 상단 메뉴바 로그인 상태 즉시 반영
updateHeaderAuthUI();

// 모바일 메뉴 토글 (index, select, result 공통)
const menuButton = document.querySelector('#menuButton');
const nav = document.querySelector('.desktop-nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => nav.classList.toggle('open'));
}

// ==========================================
// 1. 전술 성향 질문 페이지(select.html) 상태 관리
// ==========================================
let questions = [];
let answers = [];         // 질문별 선택한 보기 인덱스 (미선택은 null)
let currentQuestion = 0;

// select.html에만 있는 요소라서 페이지 구분용으로도 사용
const optionsGrid = document.querySelector('#optionsGrid');

// DB에서 질문이랑 선택지 불러오기
async function loadQuestionsFromDB() {
  try {
    const res = await fetch("/api/questions");
    if (!res.ok) throw new Error("서버 응답 오류");

    const rows = await res.json();

    // JOIN해서 내려온 데이터라 같은 질문이 여러 줄로 쪼개져 있음 -> question_id별로 묶어줌
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.question_id)) {
        map.set(r.question_id, {
          title: r.title,
          desc: r.description,
          options: [],
          choiceIds: [] // 나중에 /api/recommend로 보낼 실제 choice_id 따로 보관
        });
      }

      const q = map.get(r.question_id);
      q.options.push([r.option_icon || '⚽', r.question_text, r.option_description || '']);
      q.choiceIds.push(r.choice_id);
    });

    questions = Array.from(map.values());
    answers = Array(questions.length).fill(null);

    if (optionsGrid) {
      renderQuestion();
    }
  } catch (error) {
    console.error("질문 데이터 로드 실패:", error);
    if (optionsGrid) {
      optionsGrid.innerHTML = "<p style='text-align:center; padding:20px;'>질문을 불러오지 못했습니다. 서버(server.js) 실행을 확인해주세요.</p>";
    }
  }
}

// 현재 질문과 진행률, 선택지 카드 그리기
function renderQuestion() {
  if (!optionsGrid || questions.length === 0) return;

  const q = questions[currentQuestion];

  document.querySelector('#questionTitle').textContent = q.title;
  document.querySelector('#questionDesc').textContent = q.desc;
  document.querySelector('#questionNumber').textContent = String(currentQuestion + 1).padStart(2, '0');
  document.querySelector('#questionCount').textContent = `${currentQuestion + 1} / ${questions.length}`;

  document.querySelector('#progressPercent').textContent = `진행률 ${Math.round((currentQuestion + 1) / questions.length * 100)}%`;
  document.querySelector('#progressBar').style.width = `${(currentQuestion + 1) / questions.length * 100}%`;

  // 상단 단계 원에 현재 위치(current)랑 지나온 단계(done) 표시
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    step.classList.toggle('current', index === currentQuestion);
    step.classList.toggle('done', index < currentQuestion);
  });

  optionsGrid.innerHTML = '';
  q.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    // 이전에 골랐던 보기면 selected 유지
    button.className = `option-card${answers[currentQuestion] === index ? ' selected' : ''}`;
    button.innerHTML = `<span class="option-check">✓</span><span class="option-icon">${option[0]}</span><strong>${option[1]}</strong><small>${option[2]}</small>`;

    // 클릭하면 선택값 저장하고 다시 그려서 선택 상태 바로 반영
    button.addEventListener('click', () => {
      answers[currentQuestion] = index;
      renderQuestion();
    });
    optionsGrid.appendChild(button);
  });

  document.querySelector('#prevButton').disabled = currentQuestion === 0;
  document.querySelector('#nextButton').innerHTML = currentQuestion === questions.length - 1 ? '결과 보기 <span>→</span>' : '다음 <span>→</span>';
}

// 질문 페이지 초기 로드 및 이전/다음 버튼 처리
if (optionsGrid) {
  loadQuestionsFromDB();

  document.querySelector('#prevButton').addEventListener('click', () => {
    if (currentQuestion > 0) { currentQuestion--; renderQuestion(); }
  });

  document.querySelector('#nextButton').addEventListener('click', () => {
    if (answers[currentQuestion] === null) {
      alert('계속하려면 항목 하나를 선택해 주세요.');
      return;
    }

    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion();
    } else {
      // 마지막 질문까지 다 고르면 인덱스 대신 실제 DB choice_id 배열로 바꿔서 저장
      const selectedChoiceIds = answers.map((selectedIndex, qIndex) => {
        return questions[qIndex].choiceIds[selectedIndex];
      });

      // 페이지 넘어가도 선택 내역 유지하려고 localStorage 사용
      localStorage.setItem('kickformaAnswers', JSON.stringify(selectedChoiceIds));
      // 새 테스트 완료 플래그 (결과 페이지에서 중복 저장 방지용)
      localStorage.setItem('kickformaNeedSave', 'true');
      window.location.href = 'result.html';
    }
  });
}

// ==========================================
// 2. 추천 결과 페이지(result.html) 처리 + DB 자동 저장
// ==========================================
const resultName = document.querySelector('#resultName');

async function saveResultToDB(formationData) {
  const user = getCurrentUser();
  const needSave = localStorage.getItem('kickformaNeedSave');

  // 로그인 상태이고, 새로 테스트해서 넘어온 결과일 때만 DB에 저장
  if (!user || needSave !== 'true') return;

  try {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        formationId: formationData.id,
        score: formationData.score
      })
    });

    if (res.ok) {
      // 저장 완료 후 플래그 제거 (새로고침 시 중복 저장 방지)
      localStorage.removeItem('kickformaNeedSave');
      const votePill = document.querySelector('#votePill');
      if (votePill) {
        votePill.textContent = `DB 추천 점수: ${formationData.score}점 (내 전술함 저장 완료 ✓)`;
      }
    }
  } catch (err) {
    console.error('추천 결과 DB 저장 실패:', err);
  }
}

async function loadRecommendation() {
  if (!resultName) return;

  const storedAnswers = localStorage.getItem('kickformaAnswers');

  // 선택 기록 없이 result.html로 바로 들어온 경우
  if (!storedAnswers) {
    alert("선택된 전술 데이터가 없습니다. 추천 화면으로 돌아갑니다.");
    window.location.href = 'select.html';
    return;
  }

  const choiceIds = JSON.parse(storedAnswers);

  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceIds: choiceIds })
    });

    if (!response.ok) throw new Error('추천 계산 실패');

    const result = await response.json();
    // 서버가 점수 높은 순으로 주니까 첫 번째가 최종 추천 포메이션
    const recommendedFormation = result.recommendations[0];

    displayFormationData(recommendedFormation);
    await saveResultToDB(recommendedFormation);

  } catch (error) {
    console.error('추천 데이터 로드 에러:', error);
    document.querySelector('#summaryText').textContent = '결과를 불러오는 중 오류가 발생했습니다.';
  }
}

// 추천받은 포메이션 정보 화면에 채워 넣기
function displayFormationData(data) {
  if (!data) return;

  resultName.textContent = data.name;
  document.querySelector('#formationCaption').textContent = data.name.split('-').join(' - '); // "4-3-3" -> "4 - 3 - 3"
  document.querySelector('#summaryText').textContent = data.summary;

  const tipsList = document.querySelector('#tipsList');
  if (data.tip) {
    // DB에 마침표 기준으로 이어져 있는 팁 문장을 <li> 여러 개로 쪼개서 출력
    tipsList.innerHTML = data.tip.split('. ').filter(t => t.trim() !== '').map(tip => `<li>${tip}</li>`).join('');
  } else {
    tipsList.innerHTML = '<li>등록된 코칭 팁이 없습니다.</li>';
  }

  document.querySelector('#modalTitle').textContent = `${data.name} 상세 정보`;
  document.querySelector('#modalText').textContent = data.summary;
  document.querySelector('#votePill').textContent = `DB 추천 점수: ${data.score}점`;
}

if (resultName) {
  loadRecommendation();
}

// 상세 정보 모달 열기/닫기
const detailsButton = document.querySelector('#detailsButton');
const modal = document.querySelector('#detailsModal');
if (detailsButton && modal) {
  detailsButton.addEventListener('click', () => { modal.hidden = false; });
  document.querySelector('#closeModal').addEventListener('click', () => { modal.hidden = true; });
  document.querySelector('#modalDone').addEventListener('click', () => { modal.hidden = true; });
  // 모달 바깥 어두운 영역 클릭하거나 ESC 누르면 닫힘
  modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });
}