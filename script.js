// 공통: 모바일 메뉴
const menuButton = document.querySelector('#menuButton');
const nav = document.querySelector('.desktop-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => nav.classList.toggle('open'));
}

// 선택 페이지: 질문/선택지는 프론트엔드 시연용 데이터입니다.
// 실제 DB 연결 시 GET /api/choices 응답으로 교체하면 됩니다.
const questions = [
  { title: '우리 팀의 공격 전개 방식은 어떤 스타일인가요?', desc: '가장 가까운 성향을 선택해 주세요.', options: [
    ['🚀','윙어 중심 공격','측면 돌파와 빠른 크로스'], ['♟','중앙 집중 공격','짧은 패스와 중앙 연계'], ['⚡','빠른 역습','공간을 활용한 속공'], ['🎯','밸런스 중시','상황에 맞춘 유연한 전개']
  ]},
  { title: '공격할 때 가장 중요하게 생각하는 것은?', desc: '팀의 공격 우선순위를 골라주세요.', options: [
    ['↗','폭넓은 공격','터치라인까지 넓게 활용'], ['◎','중앙 패스 플레이','삼각 패스로 공간 창출'], ['⚡','속도와 침투','수비 뒷공간을 빠르게 공략'], ['⚖','안정적인 빌드업','공 소유와 점유율 유지']
  ]},
  { title: '우리 팀의 수비 방식은 어떤가요?', desc: '공을 빼앗겼을 때의 움직임을 생각해 보세요.', options: [
    ['🔥','전방 압박','상대 진영에서 빠르게 압박'], ['🧱','중앙 차단','중앙 공간을 단단하게 보호'], ['↩','빠른 수비 복귀','먼저 수비 대형을 정돈'], ['🛡','낮은 수비 블록','공간을 좁히고 실점 억제']
  ]},
  { title: '수비 라인은 어느 정도로 운영하고 싶나요?', desc: '수비 뒷공간 관리와 압박 강도를 고려해 주세요.', options: [
    ['⬆','높은 수비 라인','라인을 올려 주도권 확보'], ['↔','중간 수비 라인','압박과 안정성의 균형'], ['⬇','낮은 수비 라인','뒷공간을 줄이고 수비 집중'], ['⚖','상황에 따라 조절','상대 전술에 맞춰 변경']
  ]},
  { title: '미드필더에게 가장 바라는 역할은?', desc: '중원 구성의 우선순위를 골라주세요.', options: [
    ['🎨','창의적인 패스','공격 기회를 만드는 플레이메이커'], ['🏃','넓은 활동량','공수 전환과 압박 참여'], ['🛡','수비 보호','수비진 앞에서 공간 차단'], ['🔗','연결과 밸런스','공격과 수비를 고르게 지원']
  ]},
  { title: '풀백은 공격에 얼마나 참여하나요?', desc: '측면 수비수의 공격 가담 정도를 골라주세요.', options: [
    ['↗','적극적인 오버래핑','측면에서 수적 우위 만들기'], ['↔','상황에 따라 참여','기회가 있을 때 지원'], ['🛡','수비 우선','수비 위치를 안정적으로 유지'], ['⚖','한쪽만 공격 가담','반대쪽은 후방을 지키기']
  ]},
  { title: '우리 팀 공격수 구성은 어떤 편인가요?', desc: '선수들의 장점을 떠올려 선택해 주세요.', options: [
    ['🏃','빠른 측면 공격수','스피드와 돌파가 강점'], ['🎯','골 결정력 좋은 스트라이커','박스 안 마무리에 강점'], ['🤝','연계형 공격수','동료와 패스를 주고받는 플레이'], ['🔄','다양한 역할 수행','위치 변경과 유기적인 움직임']
  ]},
  { title: '경기에서 가장 우선하고 싶은 목표는?', desc: '우리 팀의 기본 운영 방향을 선택해 주세요.', options: [
    ['⚽','공격적인 경기 운영','많은 기회와 득점 만들기'], ['⚖','공수 균형','안정성과 공격력을 모두 확보'], ['🛡','수비 안정','실점을 줄이고 경기 관리'], ['⚡','역습 효율','상대 실수를 빠르게 득점으로 연결']
  ]}
];
const answers = Array(questions.length).fill(null);
let currentQuestion = 0;
const optionsGrid = document.querySelector('#optionsGrid');

function renderQuestion() {
  if (!optionsGrid) return;
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
  renderQuestion();
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
      // 서버 연결 전 데모용: 선택값을 저장하고 결과 페이지로 이동합니다.
      localStorage.setItem('kickformaAnswers', JSON.stringify(answers));
      window.location.href = 'result.html';
    }
  });
}

// 결과 페이지: 초기 화면은 디자인 확인용 예시 결과입니다.
// 실제 서버 연결 시 POST /api/recommend 응답을 화면에 반영하면 됩니다.
const formationData = {
  '4-3-3': {
    summary: '측면 공격수 활용과 빠른 공격 전개가 강점인 포메이션입니다. 중앙 미드필더의 균형 잡힌 운영이 특징인 공격적인 진형입니다.',
    tips: ['윙어의 드리블과 크로스 타이밍을 활용하세요.', '중앙 미드필더의 수비 가담을 잊지 마세요.', '공격 시 풀백의 오버래핑을 적극적으로 활용하세요.', '전방 압박 후 수비 라인의 뒷공간을 주의하세요.'],
    description: '측면 공격수와 중앙 미드필더를 활용해 공격의 폭과 속도를 살리는 포메이션입니다.'
  },
  '4-2-3-1': {
    summary: '수비형 미드필더 두 명이 수비를 보호하고, 공격형 미드필더가 최전방을 지원하는 균형 잡힌 포메이션입니다.',
    tips: ['두 수비형 미드필더의 역할을 명확하게 나누세요.', '공격형 미드필더가 공을 받을 공간을 만들어 주세요.', '측면 공격수와 풀백의 동선이 겹치지 않게 조절하세요.', '최전방 공격수가 고립되지 않도록 빠르게 지원하세요.'],
    description: '중앙의 안정성을 유지하면서 공격형 미드필더를 중심으로 기회를 만드는 포메이션입니다.'
  },
  '4-4-2': {
    summary: '두 줄 수비를 바탕으로 팀 간격을 유지하고, 두 명의 공격수가 간결한 연계와 침투를 시도하는 포메이션입니다.',
    tips: ['미드필더 네 명 사이의 간격을 좁게 유지하세요.', '두 공격수 중 한 명은 연계, 한 명은 침투 역할을 맡아보세요.', '측면 크로스의 타이밍과 박스 안 숫자를 맞추세요.', '중앙에서 수적 열세가 생기지 않도록 압박 방향을 정하세요.'],
    description: '역할이 직관적이고 조직적인 수비와 빠른 전환에 활용하기 좋은 포메이션입니다.'
  },
  '5-3-2': {
    summary: '수비수 다섯 명으로 후방 안정성을 높이고, 윙백의 전진과 두 공격수의 역습을 활용하는 포메이션입니다.',
    tips: ['윙백이 올라갈 때 반대편 수비 커버를 준비하세요.', '중앙 미드필더가 수비와 역습의 연결 고리가 되어야 합니다.', '공을 따낸 직후 전방 두 공격수의 움직임을 확인하세요.', '수비 라인이 지나치게 내려가 중원과 벌어지지 않게 하세요.'],
    description: '수비 안정성을 우선하면서 윙백과 두 공격수를 활용해 빠르게 역습하는 포메이션입니다.'
  }
};
function showFormation(name) {
  const data = formationData[name] || formationData['4-3-3'];
  const resultName = document.querySelector('#resultName');
  if (!resultName) return;
  resultName.textContent = name;
  document.querySelector('#formationCaption').textContent = name.split('-').join(' - ');
  document.querySelector('#summaryText').textContent = data.summary;
  document.querySelector('#tipsList').innerHTML = data.tips.map(tip => `<li>${tip}</li>`).join('');
  document.querySelector('#modalTitle').textContent = `${name} 상세 정보`;
  document.querySelector('#modalText').textContent = data.description;
  document.querySelector('#votePill').textContent = '예시 결과';
}
const detailsButton = document.querySelector('#detailsButton');
const modal = document.querySelector('#detailsModal');
if (detailsButton && modal) {
  detailsButton.addEventListener('click', () => { modal.hidden = false; });
  document.querySelector('#closeModal').addEventListener('click', () => { modal.hidden = true; });
  document.querySelector('#modalDone').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });
  document.querySelectorAll('.formation-card').forEach(card => {
    card.addEventListener('click', () => showFormation(card.dataset.formation));
  });
}
