# KickForma

축구 전술 성향 기반 포메이션 추천 UI 초안입니다.

## 실행 방법
1. `KickForma` 폴더를 VS Code로 엽니다.
2. `index.html`을 Live Server로 실행합니다.
3. 메인 화면에서 `포메이션 추천 시작하기`를 눌러 선택 페이지로 이동합니다.
4. 8개 질문에 답하면 결과 페이지로 이동합니다.

## 파일 구성
- `index.html`: 메인 화면
- `select.html`: 전술 성향 선택 화면 (8개 질문)
- `result.html`: 추천 결과 화면
- `style.css`: 공통 디자인 및 반응형 스타일
- `script.js`: 메뉴, 질문 이동, 선택 상태, 결과 상세 모달

## 현재 구현 범위
이 버전은 화면 디자인과 프론트엔드 동작을 확인하기 위한 프로토타입입니다. 질문과 추천 결과는 `script.js`의 예시 데이터로 동작하며, 아직 Express API 및 MySQL에 연결되어 있지 않습니다. 실제 DB 연동 시 `GET /api/choices`, `POST /api/recommend`에 맞춰 `script.js`를 수정해야 합니다.

## 참고
메인 히어로 배경 이미지는 Unsplash의 원격 이미지를 사용합니다. 인터넷이 연결되지 않은 환경에서는 배경이 표시되지 않을 수 있습니다.
