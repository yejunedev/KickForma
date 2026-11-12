// ==========================================
// 1. 공통: 모바일 메뉴 
// ==========================================
const menuButton = document.querySelector('#menuButton');
const nav = document.querySelector('.desktop-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => nav.classList.toggle('open'));
}

// ==========================================
// 2. 선택 페이지 로직 (DB 질문 연동)
// ==========================================
let questions = []; 
let answers = []; 
let currentQuestion = 0;
const optionsGrid = document.querySelector('#optionsGrid');

async function loadQuestionsFromDB() {
  try {
    const res = await fetch("/api/questions");
    if (!res.ok) throw new Error("서버 응답 오류");
    
    const rows = await res.json();
    
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.question_id)) {
        map.set(r.question_id, {
          title: r.title,
          desc: r.description,
          options: [],     
          choiceIds: []    
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

function renderQuestion() {
  if (!optionsGrid || questions.length === 0) return;
  const q = questions[currentQuestion];
  
  document.querySelector('#questionTitle').textContent = q.title;
  document.querySelector('#questionDesc').textContent = q.desc;
  document.querySelector('#questionNumber').textContent = String(currentQuestion + 1).padStart(2, '0');
  document.querySelector('#questionCount').textContent = `${currentQuestion + 1} / ${questions.length}`;
  
  document.querySelector('#progressPercent').textContent = `진행률 ${Math.round((currentQuestion + 1) / questions.length * 100)}%`;
  document.querySelector('#progressBar').style.width = `${(currentQuestion + 1) / questions.length * 100}%`;
  
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    step.classList.toggle('current', index === currentQuestion);
    step.classList.toggle('done', index < currentQuestion);
  });
  
  optionsGrid.innerHTML = '';
  q.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `option-card${answers[currentQuestion] === index ? ' selected' : ''}`;
    button.innerHTML = `<span class="option-check">✓</span><span class="option-icon">${option[0]}</span><strong>${option[1]}</strong><small>${option[2]}</small>`;
    
    button.addEventListener('click', () => {
      answers[currentQuestion] = index;
      renderQuestion();
    });
    optionsGrid.appendChild(button);
  });
  
  document.querySelector('#prevButton').disabled = currentQuestion === 0;
  document.querySelector('#nextButton').innerHTML = currentQuestion === questions.length - 1 ? '결과 보기 <span>→</span>' : '다음 <span>→</span>';
}

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
      const selectedChoiceIds = answers.map((selectedIndex, qIndex) => {
        return questions[qIndex].choiceIds[selectedIndex];
      });
      
      localStorage.setItem('kickformaAnswers', JSON.stringify(selectedChoiceIds));
      window.location.href = 'result.html';
    }
  });
}

// ==========================================
// 3. 결과 페이지 로직 (DB 연동 및 결과 처리)
// ==========================================
const resultName = document.querySelector('#resultName');

async function loadRecommendation() {
  if (!resultName) return; 

  const storedAnswers = localStorage.getItem('kickformaAnswers');
  
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
    const recommendedFormation = result.recommendations[0]; 

    displayFormationData(recommendedFormation);

  } catch (error) {
    console.error('추천 데이터 로드 에러:', error);
    document.querySelector('#summaryText').textContent = '결과를 불러오는 중 오류가 발생했습니다.';
  }
}

function displayFormationData(data) {
  if (!data) return;

  resultName.textContent = data.name;
  document.querySelector('#formationCaption').textContent = data.name.split('-').join(' - ');
  document.querySelector('#summaryText').textContent = data.summary;
  
  const tipsList = document.querySelector('#tipsList');
  if (data.tip) {
    tipsList.innerHTML = data.tip.split('. ').filter(t => t.trim() !== '').map(tip => `<li>${tip}</li>`).join('');
  } else {
    tipsList.innerHTML = '<li>등록된 코칭 팁이 없습니다.</li>';
  }

  document.querySelector('#modalTitle').textContent = `${data.name} 상세 정보`;
  document.querySelector('#modalText').textContent = data.summary;
  
  // 여기가 핵심! DB 점수를 화면에 띄워줍니다.
  document.querySelector('#votePill').textContent = `DB 추천 점수: ${data.score}점`; 
}

if (resultName) {
  loadRecommendation();
}

// 모달 처리 
const detailsButton = document.querySelector('#detailsButton');
const modal = document.querySelector('#detailsModal');
if (detailsButton && modal) {
  detailsButton.addEventListener('click', () => { modal.hidden = false; });
  document.querySelector('#closeModal').addEventListener('click', () => { modal.hidden = true; });
  document.querySelector('#modalDone').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });
}