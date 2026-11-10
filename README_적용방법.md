# 뽀송별 v9 중복 실행 정리본

업로드된 index.html에는 내장 v8 게임(script id=pposong-game-build), v8 자동 실행(script id=pposong-live-auto-start), 외부 v9 로딩이 함께 있었습니다.
이번 파일은 v8 게임과 자동실행 스크립트만 제거하고 v9 스크립트를 유지했습니다. 40종 미션 데이터, 기존 앱 스크립트와 Firebase 로직은 변경하지 않았습니다.

업로드 전:
1. GitHub 현재 main에서 `pposong-test` 브랜치를 생성하세요.
2. ZIP 압축을 풀고 같은 디렉터리에 `index.html`과 `pposong_v9.js`를 업로드하세요. ZIP 자체를 업로드하지 마세요.
3. 브랜치의 Vercel 미리보기(별도 preview 배포)를 열어 로그인, AI 인증, 게임 마우스 동작을 확인하세요.
4. 검증 후에만 운영 main으로 반영하세요.

알림: 파일 자체의 문법/연결 중복만 정리했습니다. 운영 Firebase의 권한·인증 완료 저장·다른 JS와의 충돌은 테스트 배포 검증이 필요합니다. 기존 사용자 데이터 수정/초기화는 수행하지 않았습니다.
