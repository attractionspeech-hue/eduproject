# 🎤 스피치유형 진단 툴킷

GPT API를 활용한 AI 기반 스피치 유형 진단 애플리케이션입니다. 사용자가 체크리스트를 작성하면 자신의 스피치 스타일을 진단하고 개선 방안을 제시합니다.

## 프로젝트 구조

```
├── api/
│   └── chat.ts                 # Vercel 서버리스 함수 (GPT API 호출)
├── src/
│   ├── components/
│   │   └── Chatbot.tsx        # 메인 챗봇 UI 컴포넌트
│   ├── api/
│   │   └── chat.ts            # 프론트엔드 API 호출 모듈
│   ├── constants/
│   │   └── speechTypes.ts     # 스피치 유형 상수 및 프롬프트
│   ├── styles/
│   │   └── Chatbot.css        # 스타일시트
│   ├── App.tsx
│   └── main.tsx
├── .env.local.example         # 환경변수 예시
└── package.json
```

## 기능

- **4가지 스피치 유형 진단**
  - 주도형 (Leadership): 자신감 있고 주도적인 커뮤니케이션
  - 사교형 (Social): 친화력 있고 감정 표현이 풍부한 커뮤니케이션
  - 안정형 (Stable): 차분하고 경청 위주의 안정감 있는 커뮤니케이션
  - 신중형 (Analytical): 논리적이고 분석적인 데이터 기반 커뮤니케이션

- **체크리스트 기반 진단**
  - 각 유형별 10개 항목 (총 40개)
  - 6개 이상 체크한 유형이 주된 스피치 유형

- **AI 기반 상세 분석**
  - GPT를 활용한 개인화된 진단
  - 선호하는 스피치 방식 / 불편해하는 스피치 방식 설명
  - 실질적인 개선 팁 제시

- **사용자 이름 입력**
  - 개인화된 결과 표시

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local.example`을 참고하여 `.env.local` 파일을 생성하세요:

```bash
cp .env.local.example .env.local
```

그리고 OpenAI API Key를 추가하세요:

```
OPENAI_API_KEY=your_api_key_here
```

> OpenAI API Key는 https://platform.openai.com/api-keys에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어 애플리케이션을 확인하세요.

## Vercel 배포

### 1. 프로젝트 준비

```bash
npm run build
```

### 2. Vercel CLI 설치 (선택사항)

```bash
npm install -g vercel
vercel
```

### 3. 환경변수 설정 (Vercel 대시보드)

Vercel 대시보드에서 프로젝트 설정 → Environment Variables로 이동하여 다음을 추가하세요:

- **OPENAI_API_KEY**: 여기에 OpenAI API Key 입력

### 4. 배포

```bash
git push origin main
```

Vercel은 자동으로 배포됩니다. 또는 Vercel 대시보드에서 수동으로 배포할 수 있습니다.

## 보안 사항

✅ **API Key 보안**
- OpenAI API Key는 서버 측(`api/chat.ts`)에서만 사용됩니다
- 클라이언트(`src/api/chat.ts`)는 `/api/chat` 엔드포인트만 호출합니다
- `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 업로드되지 않습니다

## 기술 스택

- **프론트엔드**: React 19 + TypeScript + Vite
- **백엔드**: Vercel 서버리스 함수
- **AI**: OpenAI GPT-4o API
- **스타일**: CSS3

## 라이선스

MIT License
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
