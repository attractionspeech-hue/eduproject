import React, { useState, useRef } from 'react';
import axios from 'axios';
import { checklistItems, SPEECH_TYPES, SYSTEM_PROMPT } from '../constants/speechTypes';
import { chatAPI } from '../api/chat';
import '../styles/Chatbot.css';

interface ResultData {
  displayNames: string[];
  details: Record<string, string>;
}

export const Chatbot: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<ResultData | null>(null);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerTypes, setPartnerTypes] = useState<string[]>([]);
  const [compatibilityResult, setCompatibilityResult] = useState('');
  const [showSpeakingEvaluation, setShowSpeakingEvaluation] = useState(false);
  const [contentScore, setContentScore] = useState('');
  const [expressionScore, setExpressionScore] = useState('');
  const [interactionScore, setInteractionScore] = useState('');
  const [evaluationResult, setEvaluationResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const typeNames = ['leadership', 'social', 'stable', 'analytical'];
  const typeOrder = ['leadership', 'social', 'stable', 'analytical'];

  const groupedItems = typeNames.map((type) => ({
    type,
    displayName: SPEECH_TYPES[type].displayName,
    items: checklistItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.type === type),
  }));

  const handleCheckChange = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const countChecked = (type: string): number => {
    return checklistItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.type === type && checkedItems[item.index])
      .length;
  };

  const handleResultsClick = async () => {
    const checkedCounts = typeNames.reduce(
      (acc, type) => {
        acc[type] = countChecked(type);
        return acc;
      },
      {} as Record<string, number>
    );

    const mainTypes = typeNames.filter((type) => checkedCounts[type] >= 6);

    if (mainTypes.length === 0) {
      setError('6개 이상 체크한 유형이 없습니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const displayNames = mainTypes.map((type) => SPEECH_TYPES[type].displayName);
      const message = `사용자의 이름: ${userName || '사용자'}
      
체크된 항목 수:
- 주도형: ${checkedCounts['leadership']}개
- 사교형: ${checkedCounts['social']}개
- 안정형: ${checkedCounts['stable']}개
- 신중형: ${checkedCounts['analytical']}개

주된 스피치 유형 (6개 이상): ${displayNames.join(', ')}

다음 조건을 반드시 지켜 상세 분석 결과를 작성해주세요:
- 상세분석에는 6개 이상 체크된 유형들만 포함해주세요.
- 6개 미만인 다른 유형은 상세분석에 포함하지 마세요.
- 선택된 유형들만 각각의 특징, 선호 방식, 불편한 방식, 개선 팁을 설명해주세요.
- 출력은 구조화되고 읽기 쉬운 형식으로 작성해주세요.`;

      const response = await chatAPI.sendMessage({
        message,
        systemPrompt: SYSTEM_PROMPT,
      });

      setResults({
        displayNames,
        details: {
          main: response.content,
        },
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data ?? err.message);
      } else {
        console.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllTypes = async () => {
    if (!results) return;

    setLoading(true);
    setError('');

    try {
      const otherTypes = typeOrder
        .filter((type) => !results.displayNames.includes(SPEECH_TYPES[type].displayName))
        .map((type) => SPEECH_TYPES[type].displayName);

      if (otherTypes.length === 0) {
        setLoading(false);
        return;
      }

      const message = `다음의 유형들만 별도 섹션에 자세히 설명해주세요: ${otherTypes.join(', ')}

- 내 유형 소개나 사용자 이름 문장을 포함하지 마세요.
- '[사용자 이름]님의 스피치유형은 ○○형입니다' 문장은 절대 출력하지 마세요.
- 나머지 유형별로 각각 다음 항목을 설명해주세요:
  1. 강점
  2. 주의점
  3. 선호하는 스피치 방식
  4. 불편해하는 스피치 방식
- 각 유형 설명은 다른 유형만 포함하고, 사용자의 대표 유형 설명은 포함하지 마세요.
- 응답은 구조화되고 읽기 쉬운 형식으로 작성해주세요.`;

      const response = await chatAPI.sendMessage({
        message,
        systemPrompt: SYSTEM_PROMPT,
      });

      setResults((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          details: {
            ...prev.details,
            other: response.content,
          },
        };
      });

      setShowAllTypes(true);
    } catch (err) {
      setError('추가 정보 조회 중 오류가 발생했습니다. 다시 시도해주세요.');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data ?? err.message);
      } else {
        console.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompatibilitySubmit = async () => {
    if (!results) return;
    if (partnerTypes.length === 0) {
      setError('주변 사람의 스피치 유형을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userTypes = results.displayNames.join(', ');
      const partnerDisplayNames = partnerTypes.map((type) => SPEECH_TYPES[type]?.displayName || '').filter(Boolean).join(', ');
      const displayUserName = userName || '이용자';
      const displayPartnerName = partnerName || '주변 사람';

      const message = `나의 스피치 유형: ${userTypes}
나의 이름: ${displayUserName}
주변 사람 이름: ${displayPartnerName}
주변 사람 스피치 유형: ${partnerDisplayNames}

다음 항목을 포함하여 두 사람의 스피치 궁합을 한국어로 자연스럽게 설명해주세요:
1. 두 사람의 소통 방식 차이 (이름을 주어로 사용)
2. 예상 갈등 포인트 (구체적이고 실질적인 상황 중심)
3. 갈등을 줄이는 방법
4. 서로 보완할 수 있는 방법

중요사항:
- 유형명이 아닌 ${displayUserName}님과 ${displayPartnerName}님의 이름을 주어로 사용해주세요.
- 출력은 구조화된 문단 형태로 작성하고, 제목과 본문을 구분하여 왼쪽 정렬로 보이도록 해주세요.`;

      const response = await chatAPI.sendMessage({
        message,
        systemPrompt: SYSTEM_PROMPT,
      });

      setCompatibilityResult(response.content);
      setShowCompatibilityForm(false);
    } catch (err) {
      setError('스피치 궁합 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data ?? err.message);
      } else {
        console.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationSubmit = async () => {
    const content = contentScore ? parseInt(contentScore) : 0;
    const expression = expressionScore ? parseInt(expressionScore) : 0;
    const interaction = interactionScore ? parseInt(interactionScore) : 0;
    const totalScore = content + expression + interaction;

    if (content < 0 || content > 5 || expression < 0 || expression > 10 || interaction < 0 || interaction > 5) {
      setError('입력된 점수를 확인해주세요. (내용 구성: 0-5, 표현 및 전달: 0-10, 청중과 상호작용: 0-5)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const message = `사용자의 말하기능력 평가 점수입니다:
- 내용 구성: ${content}점 (만점: 5점)
- 표현 및 전달: ${expression}점 (만점: 10점)
- 청중과 상호작용: ${interaction}점 (만점: 5점)
- 총점: ${totalScore}점 (만점: 20점)

다음 형식을 반드시 지켜 한국어로 평가 피드백을 작성해주세요.

## 1. 강점 분석
현재 점수에서 잘한 부분을 1~2문단으로 설명해주세요.

## 2. 보완점 분석
개선이 필요한 부분을 1~2문단으로 설명해주세요.

## 3. 실질적인 연습 조언

### 1. 연습 제목
구체적인 연습 방법을 설명해주세요.

### 2. 연습 제목
구체적인 연습 방법을 설명해주세요.

### 3. 연습 제목
구체적인 연습 방법을 설명해주세요.

### 4. 연습 제목
구체적인 연습 방법을 설명해주세요.

금지:
- 제목과 본문을 한 줄에 붙이지 마세요.
- "1. 강점 분석 현재 사용자는..." 형식으로 쓰지 마세요.
- 번호 목록을 한 문단으로 이어 쓰지 마세요.

예시:
  1. 호흡 조절 연습
     문장을 말하기 전 짧게 숨을 고르고, 핵심 문장 앞에서 속도를 늦추는 연습을 하세요.

  2. 핵심 메시지 정리 연습
     말하기 전에 가장 중요한 메시지를 한 문장으로 정리한 뒤 말하는 연습을 하세요.

출력은 구조화된 문단 형태로 작성하고, 제목과 본문을 구분하여 왼쪽 정렬로 보이도록 해주세요.`;

      const response = await chatAPI.sendMessage({
        message,
        systemPrompt: SYSTEM_PROMPT,
      });

      setEvaluationResult(response.content);
    } catch (err) {
      setError('평가 결과 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data ?? err.message);
      } else {
        console.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      nodes.push(
        <strong className="analysis-strong" key={`strong-${match.index}`}>
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  const renderMarkdownResponse = (content: string, headingColor = '#5b21b6') => {
    const lines = content.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let paragraphLines: string[] = [];
    let listItems: string[] = [];

    const flushParagraph = (key: string) => {
      if (paragraphLines.length === 0) return;
      elements.push(
        <p className="analysis-paragraph" key={`p-${key}`}>
          {parseInlineMarkdown(paragraphLines.join(' '))}
        </p>
      );
      paragraphLines = [];
    };

    const flushList = (key: string) => {
      if (listItems.length === 0) return;
      elements.push(
        <ul className="analysis-list" key={`ul-${key}`}>
          {listItems.map((item, idx) => (
            <li className="analysis-list-item" key={`li-${key}-${idx}`}>
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph(index.toString());
        flushList(index.toString());
        return;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph(index.toString());
        flushList(index.toString());
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        elements.push(
          <div 
          key={`h-${index}`}
    className={`analysis-md-heading level-${level}`}
    style={{
      fontSize: level === 2 ? '1.55rem' : '1.25rem',
      fontWeight: 900,
      color: headingColor,
      marginTop: '18px',
      marginBottom: '10px',
    }}
          >
            {parseInlineMarkdown(text)}
          </div>
        );
        return;
      }

      const listMatch = line.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        flushParagraph(index.toString());
        listItems.push(listMatch[1]);
        return;
      }

      paragraphLines.push(line);
    });

    flushParagraph('end');
    flushList('end');
    return elements;
  };

  if (showSpeakingEvaluation) {
    return (
      <div 
      className="chatbot-container"
        style={{
          maxWidth: '1100px',
          width: '95%',
          margin: '0 auto',
        }}
        >
        <div 
        className="results-container"
        ref={resultsRef}
        style={{
          textAlign: 'left',
          maxWidth: '1000px',
          width: '100%',
        }}
        >
          <h2 
          className="results-title"
          style={{
            textAlign: 'left',
            fontSize: '2.2rem',
            fontWeight: 900,
            marginBottom: '24px',
            color: '#16a34a',
            background: 'none',
    WebkitBackgroundClip: 'initial',
    WebkitTextFillColor: '#166534',
          }}
          > 말하기능력 평가표
          </h2>

          {!evaluationResult ? (
            <>
            <div 
  style={{
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    color: '#166534',
    fontSize: '15px',
    lineHeight: 1.7,
    textAlign: 'left',
  }}
>
  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '6px' }}>
    평가 전 안내
  </strong>
  말하기 연습 후 화면 녹화를 진행해주세요. 녹화된 영상을 다시 보면서 아래 3개 영역의 점수를 직접 입력해 주세요.
</div>

   <div 
            className="evaluation-card"
            style={{
              textAlign: 'left',
    fontSize: '1.15rem',
    lineHeight: 1.8,
    border: '1px solid #bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    padding: '24px',
            }}
            >
              <div 
              className="evaluation-row"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '100%',
              }}
              >
                <div 
                className="evaluation-field"
                style={{
                  width: '100%',
                }}
                >
                  <label htmlFor="content"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: 'block',
                  }}
                  >
                  내용 구성 (0~5점)</label>
                  <p
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.7,
                      marginTop: '0px',
                      marginBottom: '2px',
                      color: '#374151',
                    }}
                    >
                    내용을 적절하게 선정하고, 논리적으로 조직하는 능력
                    </p>
<div
  className="evaluation-criteria-list"
  style={{
    borderLeft: '4px solid #22c55e',
    backgroundColor: '#ffffff',
    color: '#14532d',
fontWeight: 500,
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px',
  }}
>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 주제에 맞는 내용을 적절하게 골랐는가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 말의 순서가 자연스럽고 논리적인가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 핵심 메시지가 분명한가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 처음부터 끝까지 내용이 일관되었는가</p>
                  </div>
                  <input
  id="content"
  type="number"
  min="0"
  max="5"
  value={contentScore}
  onChange={(e) => {
    const val = Math.min(5, Math.max(0, parseInt(e.target.value) || 0));
    setContentScore(val.toString());
  }}
  className="score-input"
  placeholder="0"
  style={{
    fontSize: '24px',
    fontWeight: 700,
    padding: '4px 8px',
    height: '48px',
     color: '#166534',
  border: '1px solid #86efac',
  }}
  />
                </div>
                <div 
                className="evaluation-field"
                style={{
                  width: '100%',
                }}
                >
                  <label htmlFor="expression"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: 'block',
                  }}
                  >
                  표현 및 전달 (0~10점)</label>
                  <p
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.7,
                      marginTop: '0px',
                      marginBottom: '2px',
                      color: '#374151',
                    }}
                    >발음, 어휘와 문장, 준언어적 요소, 비언어적 요소, 말하는 속도, 태도
                      </p>
<div
  className="evaluation-criteria-list"
  style={{
    borderLeft: '4px solid #22c55e',
    backgroundColor: '#ffffff',
    color: '#14532d',
fontWeight: 500,
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px',
  }}
>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 말소리가 명확하고 알아듣기 쉬운가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 적절한 단어와 문장을 사용하는가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 목소리 크기, 억양, 강세, 속도가 적절한가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 표정, 시선, 자세, 몸짓이 적절한가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 너무 빠르거나 느리지 않은가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>• 자신감 있고 안정적인 태도로 말하는가</p>
                  </div>
                  <input
                    id="expression"
                    type="number"
                    min="0"
                    max="10"
                    value={expressionScore}
                    onChange={(e) => {
    const val = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
    setExpressionScore(val.toString());
  }}
  className="score-input"
  placeholder="0"
  style={{
    fontSize: '24px',
    fontWeight: 700,
    padding: '4px 8px',
    height: '48px',
     color: '#166534',
  border: '1px solid #86efac',
  }}
/>
                </div>
                <div 
                className="evaluation-field" 
                style={{ 
                  width: '100%' 
                }}
                >
                  <label htmlFor="interaction" 
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: 'block',
                  }}>
                    청중과 상호작용 (0~5점)
                  </label>
                   <p
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.7,
                      marginTop: '0px',
                      marginBottom: '2px',
                      color: '#374151',
                    }}
                    >청중의 주의를 끌고, 청중의 반응을 수용하며 소통하는 능력
                      </p>
                      <div
  className="evaluation-criteria-list"
  style={{
    borderLeft: '4px solid #22c55e',
    backgroundColor: '#ffffff',
    color: '#14532d',
fontWeight: 500,
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '16px',
  }}
>

                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 청중이 말에 집중하도록 이끄는가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 청중의 표정, 반응, 분위기를 살피는가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>
                      • 일방적으로 말하지 않고 청중과 연결되는가</p>
                    <p className="evaluation-criterion"
                    style={{fontSize: '15px',lineHeight: 1.8,marginBottom: '10px',}}>• 청중 반응에 따라 말의 방식이나 태도를 조절하는가</p>
                  </div>
             <input
  id="interaction"
  type="number"
  min="0"
  max="5"
  value={interactionScore}
  onChange={(e) => {
    const val = Math.min(5, Math.max(0, parseInt(e.target.value) || 0));
    setInteractionScore(val.toString());
  }}
  className="score-input"
  placeholder="0"
  style={{
    fontSize: '24px',
    fontWeight: 700,
    padding: '4px 8px',
    height: '48px',
     color: '#166534',
  border: '1px solid #86efac',
  }}
/>
                </div>
              </div>
<div
              className="total-score"
                style={{
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    color: '#166534',
    padding: '16px',
    borderRadius: '12px',
    fontWeight: 900,
    marginTop: '20px',
    marginBottom: '20px',
  }}
  >
                총점: {(contentScore ? parseInt(contentScore) : 0) + (expressionScore ? parseInt(expressionScore) : 0) + (interactionScore ? parseInt(interactionScore) : 0)} / 20점
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
              style={{
  background: '#16a34a',
  backgroundImage: 'none',
  color: '#ffffff',
}}
                className="btn btn-primary"
                onClick={handleEvaluationSubmit}
                disabled={loading}
              >
                {loading ? '평가중...' : '평가 결과 보기'}
              </button>
              
            </div>
            </>
          ) : (
            <div 
            className="analysis-result evaluation-result"
            style={{
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '16px',
    padding: '24px',
  }}
            >
              <h3>📊 평가 결과</h3>
              <div className="evaluation-scores">
                <div className="score-item"
                  style={{ display: 'block', textAlign: 'left' }}>
                   <div>   
                  <strong>내용 구성:</strong> {contentScore}점 / 5점
                    </div>
                     <div style={{display: 'block',fontSize: '15px',lineHeight: 1.7,
                     marginTop: '8px',marginBottom: '16px',color: '#374151',}}>
                  말할 내용을 적절히 선정하고 논리적으로 조직하는 능력
                  </div>
                </div>
                <div className="score-item"
                  style={{ display: 'block', textAlign: 'left' }}>
                    <div>  
                  <strong>표현 및 전달:</strong> {expressionScore}점 / 10점
                  </div>
                  <div style={{display: 'block',fontSize: '15px',lineHeight: 1.7,
                  marginTop: '8px',marginBottom: '16px',color: '#374151',}}>
                  발음, 어휘와 문장, 준언어적 요소, 비언어적 요소, 말하는 속도, 태도 
                  </div>
                </div>
                <div className="score-item"
                  style={{ display: 'block', textAlign: 'left' }}>
                    <div>  
                  <strong>청중과 상호작용:</strong> {interactionScore}점 / 5점
                  </div>
                  <div style={{display: 'block',fontSize: '15px',lineHeight: 1.7,
                     marginTop: '8px',marginBottom: '16px',color: '#374151',}}>
                  청중의 주의를 끌고, 청중의 반응을 수용하며 소통하는 능력
                 </div>
                </div>
                <div className="score-item total"
                style={{
    color: '#166534',
    fontSize: '1.2rem',
    fontWeight: 900,
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '16px',
  }}
                >
                  <strong>총점:</strong> {(parseInt(contentScore) || 0) + (parseInt(expressionScore) || 0) + (parseInt(interactionScore) || 0)}점 / 20점
                </div>
              </div>

              <div className="analysis-text">
                {renderMarkdownResponse(evaluationResult, '#166534')}
              </div>

              <button
              style={{
  background: '#16a34a',
  backgroundImage: 'none',
  color: '#ffffff',
  border: '1px solid #81e6a8',
}}
                className="btn btn-secondary"
                onClick={() => {
                  setEvaluationResult('');
                  setContentScore('');
                  setExpressionScore('');
                  setInteractionScore('');
                }}
              >
                다시 평가하기
              </button>

            </div>
     )}
          <button
          style={{
  background: '#16a34a',
  backgroundImage: 'none',
  color: '#ffffff',
}}
            className="btn btn-primary"
            onClick={() => {
              setShowSpeakingEvaluation(false);
              setEvaluationResult('');
              setContentScore('');
              setExpressionScore('');
              setInteractionScore('');
            }}
          >
            스피치 유형 진단으로 돌아가기
          </button>
        </div>
      </div>
    );
  }


  if (results) {
    return (
      <div className="chatbot-container">
        <div className="results-container" ref={resultsRef}>
          <h2 className="results-title">
            {userName ? `${userName}님의 스피치 유형은 ${results.displayNames.join(', ')} 입니다.` : `당신의 스피치 유형은 ${results.displayNames.join(', ')} 입니다.`}
          </h2>

          <div className="type-details">
            {results.displayNames.map((displayName) => {
              const typeKey = Object.keys(SPEECH_TYPES).find(
                (key) => SPEECH_TYPES[key].displayName === displayName
              );
              if (!typeKey) return null;

              const typeInfo = SPEECH_TYPES[typeKey];
              return (
                <div key={typeKey} className="type-card">
                  <h3>{typeInfo.displayName}</h3>
                  <p className="description">{typeInfo.description}</p>
                  <div className="style-section">
                    <h4>✓ 선호하는 스피치 방식</h4>
                    <p>{typeInfo.preferredStyle}</p>
                  </div>
                  <div className="style-section">
                    <h4>✗ 불편해하는 스피치 방식</h4>
                    <p>{typeInfo.difficultStyle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="analysis-result">
            <h3>🔍 상세 분석</h3>
            <div className="analysis-text">
              {renderMarkdownResponse(results.details.main)}
            </div>
          </div>

          {!showAllTypes && (
            <button
              className="btn btn-secondary"
              onClick={handleShowAllTypes}
              disabled={loading}
            >
              {loading ? '로딩중...' : '나머지 유형 보기'}
            </button>
          )}

          {showAllTypes && results.details.other && (
            <div className="analysis-result">
              <h3>📊 나머지 유형 상세 설명</h3>
              <div className="analysis-text">
                {renderMarkdownResponse(results.details.other)}
              </div>
            </div>
          )}

          {showAllTypes && !compatibilityResult && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowCompatibilityForm((prev) => !prev)}
              disabled={loading}
            >
              주변 사람과의 스피치궁합 보기
            </button>
          )}

          {showCompatibilityForm && (
            <div className="compatibility-card">
              <div className="compatibility-row">
                <label htmlFor="partnerName">주변 사람 이름</label>
                <input
                  id="partnerName"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="small-input"
                />
              </div>
              <div className="compatibility-row">
                <label>주변 사람 유형 (복수 선택 가능)</label>
                <div className="type-checkbox-group">
                  {typeNames.map((type) => (
                    <label key={type} className="type-checkbox-label">
                      <input
                        type="checkbox"
                        checked={partnerTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPartnerTypes((prev) => [...prev, type]);
                          } else {
                            setPartnerTypes((prev) => prev.filter((t) => t !== type));
                          }
                        }}
                        className="checkbox-input"
                      />
                      <span>{SPEECH_TYPES[type].displayName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCompatibilitySubmit}
                disabled={loading}
              >
                {loading ? '분석중...' : '궁합 분석하기'}
              </button>
            </div>
          )}

          {compatibilityResult && (
            <div className="analysis-result compatibility-result">
              <h3>🤝 주변 사람과의 스피치 궁합</h3>
              <div className="analysis-text">
                {renderMarkdownResponse(compatibilityResult)}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setCompatibilityResult('');
                  setShowCompatibilityForm(true);
                  setPartnerName('');
                  setPartnerTypes([]);
                }}
              >
                다시 보기
              </button>
            </div>
          )}

          {compatibilityResult && (
            <button
              className="btn btn-primary"
              style={{
                background: '#16a34a',
                backgroundImage: 'none',
                color: '#ffffff',
              }}
              onClick={() => setShowSpeakingEvaluation(true)}
            >
              다음 진단: 말하기능력 평가하기
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => {
              setResults(null);
              setShowAllTypes(false);
              setShowCompatibilityForm(false);
              setCompatibilityResult('');
              setPartnerName('');
              setPartnerTypes([]);
              setCheckedItems({});
              setUserName('');
            }}
          >
            다시 진단하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="header"  style={{
    textAlign: 'center',
  }}>
        <h1>🎤스피치 유형 진단</h1>
        <p style={{ marginTop: '16px' , textAlign: 'center',}}>  당신의 스피치 스타일을 발견하세요</p>
      </div>

      <div className="name-input-section">
        <label htmlFor="userName">이름 입력 (선택사항)</label>
        <input
          id="userName"
          type="text"
          placeholder="이름을 입력하세요"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="name-input"
        />
      </div>

      <div className="instructions">
        <p>아래 항목들 중 자신에게 해당하는 것들을 체크해주세요.</p>
        <p>각 유형별로 6개 이상 체크하면 그 유형이 당신의 스피치 유형입니다.</p>
      </div>

      <div className="checklist-grid">
        {groupedItems.map((group) => (
          <div key={group.type} className="type-section"
          style={{
    backgroundColor: '#f5f3ff',
    border: '1px solid #efecfd',
    borderRadius: '18px',
    padding: '24px',
  }}
          >
            <h2 className="type-title"style={{
    fontSize: '1.7rem',
    fontWeight: 900,
  }}>{group.displayName}</h2>
            <div className="checkbox-group">
              {group.items.map((item) => (
                <label key={item.index} className="checkbox-item"
                style={{
backgroundColor: '#f4f2fd',
border: 'none',
  }}
                >
                  <input
                    type="checkbox"
                    checked={checkedItems[item.index] || false}
                    onChange={() => handleCheckChange(item.index)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label"
                    style={{
    color: '#111827',
    fontWeight: 500,
    lineHeight: 1.6,
  }}
                  >{item.text}

                  </span>
                </label>
              ))}
            </div>
            <div className="count-badge"style={{
    fontSize: '16px',
    fontWeight: 700,
  }}>
              {countChecked(group.type)}/10 항목 선택됨
            </div>
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        className="btn btn-primary"
        onClick={handleResultsClick}
        disabled={loading}
      >
        {loading ? '분석중...' : '결과보기'}
      </button>
    </div>
  );
};
