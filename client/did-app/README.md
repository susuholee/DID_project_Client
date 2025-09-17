# Sealium

<img src="../did-app/public//icons/sealium_logo.png" width="120px" style="background-color: white;"/>

---

> **DID(Decentralized Identifier)** 기반으로 안전하고 투명한 **VC(Verifiable Credential)** 발급 및 검증을 지원하는 웹 플랫폼  

## 배포 주소  
**[https://sealium.io](https://sealium.io)**

---

## 목차
- [프로젝트 소개](#프로젝트-소개)
- [화면 구성](#화면-구성)
- [메인 페이지](#메인-페이지)
- [주요 기능 (Frontend)](#️주요-기능-frontend)
- [담당 기능](#️담당-기능)
- [개발 기간](#️개발-기간)
- [팀원소개](#️팀원소개)
- [기술 스택](#기술-스택)
- [협업 도구](#협업-도구)
- [이슈 상황](#이슈-상황)
- [개선 방향](#개선-방향)
- [향후 확장 방향](#향후-확장-방향)
- [느낀 점](#느낀-점)

---

## 프로젝트 소개
**Sealium**은 분산 신원 기술(DID)을 기반으로, 사용자가 **안전하게 자격 증명(VC)** 을 발급, 관리, 공유할 수 있도록 하는 플랫폼입니다.  

---

## 화면 구성

### 메인 페이지

#### DID 지갑 등록  
![DID 지갑 등록](./images/demo-wallet.gif)

#### VC 발급 요청  
![VC 발급 요청](./images/demo-vc-issue.gif)

#### VC 검증  
![VC 검증](./images/demo-vc-verify.gif)

- DID 생성 및 관리 화면
- VC 발급 및 저장 UI
- QR 코드 기반 VC 공유
- VC 진위 여부 시각적 피드백

---

## 주요 기능 (Frontend)



---

## 담당 기능 (이수호 - Frontend)

### DID 지갑 관리 UI
- DID 생성/등록 화면 개발
- DID Document 데이터 표시 및 연동
- 반응형 레이아웃 적용

### VC 발급 / 검증 UI
- VC 발급 요청 및 결과 표시 화면 개발
- 발급된 VC 목록 및 상세 보기 UI
- 검증 결과에 따른 시각적 피드백 (성공/실패/에러)

### QR 코드 기반 VC 공유
- VC → QR 코드 생성 화면
- 모바일 환경에서 QR 스캔 UI 구현
- 에러 처리 및 사용자 경험(UX) 개선

### 상태 관리 & API 연동
- React Query 기반 서버 상태 관리
- Redux로 DID/VC 전역 상태 통합
- API 응답에 따른 실시간 UI 업데이트

---

## 개발 기간
* 2025.08.04 ~ 2025.09.17

---

## 팀원소개
| 팀원 | 역할 | GitHub |
|------|------|--------|
| <img src="https://github.com/susuholee.png" width="100"> | <br>이수호 (Client Frontend, Deploy)  | [@susuholee](https://github.com/susuholee) |
| <img src="https://github.com/Mr-Binod.png" width="100"> | <br>비노드 (BackEnd, Admin FrontEnd, Verification Frontend BlockChain, Deploy ) | [@Mr-Binod](https://github.com/Mr-Binod) |
| <img src="https://github.com/kooming.png" width="100"> | <br>구다경| [@kooming](https://github.com/kooming) |

---

## 기술 스택 (Frontend)

- **Frontend**  
  Next.js, Zustand, Tanstack Query, TailwindCSS  

- **협업**  
  GitHub, Notion

---

## 협업 도구
- GitHub (버전 관리 및 코드 리뷰)  
- Notion (기획 및 작업 관리)  

---

## 이슈 상황

| 번호 | 이슈 내용 |
|------|-----------|
| 1 | VC 검증 시 UI 반응 속도가 느려 사용자 경험 저하 |
| 2 | 모바일 환경에서 QR 코드 스캔이 원활하지 않음 |
| 3 | Redux와 React Query 상태 관리 충돌로 인한 데이터 불일치 |

---

## 해결 방안

| 문제 | 해결 방법 |
|------|-----------| 
| UI 반응 속도 저하 | React Query 캐싱 및 suspense 기능 도입 |
| 모바일 QR 스캔 문제 | WebAssembly 기반 QR 디코더 라이브러리 사용 |
| 상태 관리 충돌 | Redux는 글로벌 상태, React Query는 서버 상태 관리로 역할 분리 |

---

## 개선 방향

| 항목 | 개선 방향 | 기대 효과 |
|------|------------|------------|
| VC 검증 UI | 로딩/성공/실패 상태 애니메이션 추가 | 사용자 경험 향상 |
| 모바일 최적화 | PWA 적용 및 성능 개선 | 접근성 향상 |
| 코드 구조 | 컴포넌트 모듈화 및 리팩토링 | 유지보수성 강화 |

---

## 향후 확장 방향

| 항목 | 확장 방향 | 기대 효과 |
|------|-----------|-----------|
| 다국어 지원 | 글로벌 사용자 대상 UI 번역 지원 | 접근성 확대 |
| 생체 인증 연동 | DID 지갑 접근 시 지문/Face ID 적용 | 보안 강화 |
| 실시간 알림 | VC 발급/검증 시 알림 제공 | 사용자 경험 개선 |

---

## 느낀 점

이번 프로젝트에서 **React와 상태 관리 라이브러리**를 적극적으로 활용하며,  
실제 서비스에 가까운 **UI/UX 설계와 최적화 경험**을 쌓을 수 있었습니다.  

특히 **React Query와 Redux를 병행**하면서 서버 상태와 전역 상태를 분리해 관리하는 방법을 배우고,  
QR 코드 UI 구현을 통해 **모바일 최적화와 사용자 경험 개선**의 중요성을 깊이 체감했습니다.  

협업 과정에서도 GitHub, Figma, Notion을 활용해 실무와 유사한 워크플로우를 경험할 수 있었고,  
팀 프로젝트에서 프론트엔드 담당으로 맡은 역할을 성공적으로 수행하며 큰 성장을 느꼈습니다.  
