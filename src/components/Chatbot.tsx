import { useMemo, useState } from 'react';
import { SPEECH_TYPES, checklistItems } from '../constants/speechTypes';
import '../styles/Chatbot.css';

type ScreenMode = 'home' | 'speechType' | 'speechAbility';

type SpeechTypeKey = 'leadership' | 'social' | 'stable' | 'analytical';

type AbilityCategory = 'content' | 'expression' | 'interaction';

type AbilityScores = Record<AbilityCategory, number[]>;

type AbilitySection = {
  key: AbilityCategory;
  title: string;
  maxScore: number;
  description: string;
  items: string[];
  averageLabel: string;
};

type ChecklistItemWithIndex = {
  type: string;
  text: string;
  originalIndex: number;
};

const SPEECH_TYPE_KEYS: SpeechTypeKey[] = [
  'leadership',
  'social',
  'stable',
  'analytical',
];

const ABILITY_SECTIONS: AbilitySection[] = [
  {
    key: 'content',
    title: '내용 구성 점수',
    maxScore: 5,
    description: '말할 내용을 적절하게 선정하고, 논리적으로 조직하는 능력',
    averageLabel: '내용 구성 총점',
    items: [
      '주제에 맞는 내용을 적절하게 골랐는가',
      '말의 순서가 자연스럽고 논리적인가',
      '핵심 메시지가 분명한가',
      '처음부터 끝까지 내용이 흐트러지지 않고 일관되었는가',
    ],
  },
  {
    key: 'expression',
    title: '표현 및 전달 점수',
    maxScore: 10,
    description:
      '발음, 어휘와 문장, 억양과 속도, 표정과 자세를 사용해 내용을 표현하고 전달하는 능력',
    averageLabel: '표현 및 전달 총점',
    items: [
      '말소리가 명확하고 알아듣기 쉬운가',
      '적절한 단어와 문장을 사용하는가',
      '목소리 크기, 억양, 강세, 속도 등이 적절한가',
      '표정, 시선, 자세, 몸짓이 적절한가',
      '너무 빠르거나 느리지 않은가',
      '자신감 있고 안정적인 태도로 말하는가',
    ],
  },
  {
    key: 'interaction',
    title: '청중과 상호작용 점수',
    maxScore: 5,
    description: '청중의 주의를 끌고, 청중의 반응을 수용하며 소통하는 능력',
    averageLabel: '청중과 상호작용 총점',
    items: [
      '청중이 말에 집중하도록 이끄는가',
      '청중의 표정, 반응, 분위기를 살피는가',
      '일방적으로 말하지 않고 청중과 연결되는가',
      '청중 반응에 따라 말의 방식이나 태도를 조절하는가',
    ],
  },
];

const INITIAL_ABILITY_SCORES: AbilityScores = {
  content: [0, 0, 0, 0],
  expression: [0, 0, 0, 0, 0, 0],
  interaction: [0, 0, 0, 0],
};

const calculateConvertedScore = (scores: number[], maxScore: number): number => {
  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  const average = total / scores.length;
  const convertedScore = (average / 10) * maxScore;

  if (Number.isNaN(convertedScore)) {
    return 0;
  }

  return Number(convertedScore.toFixed(1));
};

export function Chatbot() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('home');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showTypeResult, setShowTypeResult] = useState(false);
  const [abilityScores, setAbilityScores] = useState<AbilityScores>(
    INITIAL_ABILITY_SCORES,
  );

  const handleGoHome = () => {
    setScreenMode('home');
    setShowTypeResult(false);
  };

  const handleStartSpeechTypeTest = () => {
    setScreenMode('speechType');
    setShowTypeResult(false);
  };

  const handleStartSpeechAbilityTest = () => {
    setScreenMode('speechAbility');
  };

  const handleToggleChecklist = (index: number) => {
    setSelectedItems((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }

      return [...prev, index];
    });

    setShowTypeResult(false);
  };

  const handleAbilityScoreChange = (
    category: AbilityCategory,
    itemIndex: number,
    value: string | number,
  ) => {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return;
    }

    const safeValue = Math.max(0, Math.min(10, Math.round(numberValue)));

    setAbilityScores((prev) => {
      const nextCategoryScores = [...prev[category]];

      if (itemIndex < 0 || itemIndex >= nextCategoryScores.length) {
        return prev;
      }

      nextCategoryScores[itemIndex] = safeValue;

      return {
        ...prev,
        [category]: nextCategoryScores,
      };
    });
  };

  const groupedChecklist = useMemo(() => {
    return SPEECH_TYPE_KEYS.map((typeKey) => {
      const typeInfo = SPEECH_TYPES[typeKey];

      const items: ChecklistItemWithIndex[] = checklistItems
        .map((item, index) => ({
          type: item.type,
          text: item.text,
          originalIndex: index,
        }))
        .filter((item) => item.type === typeKey);

      return {
        typeKey,
        typeInfo,
        items,
      };
    });
  }, []);

  const typeCounts = useMemo(() => {
    const initialCounts: Record<SpeechTypeKey, number> = {
      leadership: 0,
      social: 0,
      stable: 0,
      analytical: 0,
    };

    selectedItems.forEach((selectedIndex) => {
      const selectedType = checklistItems[selectedIndex]?.type;

      if (
        selectedType === 'leadership' ||
        selectedType === 'social' ||
        selectedType === 'stable' ||
        selectedType === 'analytical'
      ) {
        initialCounts[selectedType] += 1;
      }
    });

    return initialCounts;
  }, [selectedItems]);

  const sortedTypeKeysByCount = useMemo(() => {
    return [...SPEECH_TYPE_KEYS].sort((firstTypeKey, secondTypeKey) => {
      const countDifference = typeCounts[secondTypeKey] - typeCounts[firstTypeKey];

      if (countDifference !== 0) {
        return countDifference;
      }

      return (
        SPEECH_TYPE_KEYS.indexOf(firstTypeKey) -
        SPEECH_TYPE_KEYS.indexOf(secondTypeKey)
      );
    });
  }, [typeCounts]);

  const resultTypeKeys = useMemo(() => {
    const sixOrMoreTypeKeys = SPEECH_TYPE_KEYS.filter((typeKey) => {
      return typeCounts[typeKey] >= 6;
    });

    if (sixOrMoreTypeKeys.length > 0) {
      return sixOrMoreTypeKeys;
    }

    const maxCount = Math.max(
      ...SPEECH_TYPE_KEYS.map((typeKey) => typeCounts[typeKey]),
    );

    if (maxCount >= 5) {
      return SPEECH_TYPE_KEYS.filter((typeKey) => {
        return typeCounts[typeKey] === maxCount;
      });
    }

    return [];
  }, [typeCounts]);

  const hasDevelopedSpeechType = resultTypeKeys.length > 0;

  const otherTypeKeys = useMemo(() => {
    if (!hasDevelopedSpeechType) {
      return sortedTypeKeysByCount;
    }

    return sortedTypeKeysByCount.filter((typeKey) => {
      return !resultTypeKeys.includes(typeKey);
    });
  }, [hasDevelopedSpeechType, resultTypeKeys, sortedTypeKeysByCount]);

  const resultTypeNames = useMemo(() => {
    return resultTypeKeys
      .map((typeKey) => SPEECH_TYPES[typeKey].displayName)
      .join(', ');
  }, [resultTypeKeys]);

  const convertedAbilityScores = useMemo(() => {
    return ABILITY_SECTIONS.reduce<Record<AbilityCategory, number>>(
      (acc, section) => {
        acc[section.key] = calculateConvertedScore(
          abilityScores[section.key],
          section.maxScore,
        );

        return acc;
      },
      {
        content: 0,
        expression: 0,
        interaction: 0,
      },
    );
  }, [abilityScores]);

  const roundedAbilityScores = useMemo(() => {
    return ABILITY_SECTIONS.reduce<Record<AbilityCategory, number>>(
      (acc, section) => {
        acc[section.key] = Math.round(convertedAbilityScores[section.key]);

        return acc;
      },
      {
        content: 0,
        expression: 0,
        interaction: 0,
      },
    );
  }, [convertedAbilityScores]);

  const totalAbilityScore =
    roundedAbilityScores.content +
    roundedAbilityScores.expression +
    roundedAbilityScores.interaction;

  return (
    <div className="chatbot-container">
      {screenMode === 'home' && (
        <main className="home-screen">
          <section className="home-card">
            <div className="home-floating-deco deco-one">🌸</div>
            <div className="home-floating-deco deco-two">✨</div>
            <div className="home-floating-deco deco-three">🌱</div>

            <div className="home-emoji">🎤</div>
            <h1 className="home-title">스피치 성장 테스트</h1>
            <p className="home-message">
              오늘의 나를 알아가는 작은 시작이에요 🌱
              <br />
              부담 갖지 말고, 지금의 나에게 가까운 모습을 골라보세요.
            </p>

            <div className="home-button-group">
              <button
                type="button"
                className="home-test-button speech-type-button"
                onClick={handleStartSpeechTypeTest}
              >
                <span>💜</span>
                스피치 유형 테스트
              </button>

              <button
                type="button"
                className="home-test-button speech-ability-button"
                onClick={handleStartSpeechAbilityTest}
              >
                <span>💚</span>
                스피치 능력 테스트
              </button>
            </div>
          </section>
        </main>
      )}

      {screenMode === 'speechType' && (
        <main className="test-screen">
          <div className="test-top-bar">
            <button type="button" className="home-return-button" onClick={handleGoHome}>
              처음으로
            </button>
          </div>

          <header className="test-header purple-header">
            <div className="header-icon">💜</div>
            <h1>스피치 유형 테스트</h1>
            <p>정답은 없어요. 나와 가장 가까운 모습을 편하게 골라주세요 💜</p>
            <div className="speech-type-rule-text">
              6개 이상 나온 게 나의 스피치 유형이에요!
            </div>
          </header>

          <section className="speech-type-method-card">
            <strong>&lt;테스트 하는 방법&gt;</strong>
            <ol>
              <li>각 체크리스트 항목을 입력한다.</li>
              <li>결과보기 버튼을 누른다.</li>
              <li>스피치 진단으로 돌아가 내 유형을 입력한다.</li>
            </ol>
          </section>

          <section className="encourage-card purple-encourage">
            <strong>괜찮아요. 지금의 내 모습을 알아보는 시간이에요.</strong>
            <span>비슷하다고 느껴지는 문장을 편하게 선택해주세요.</span>
          </section>

          <section className="checklist-grid">
            {groupedChecklist.map(({ typeKey, typeInfo, items }) => (
              <article className="type-section" key={typeKey}>
                <h2 className="type-title">{typeInfo.displayName}</h2>

                <div className="checkbox-group">
                  {items.map((item) => (
                    <label className="checkbox-item" key={item.originalIndex}>
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={selectedItems.includes(item.originalIndex)}
                        onChange={() => handleToggleChecklist(item.originalIndex)}
                      />
                      <span className="checkbox-label">{item.text}</span>
                    </label>
                  ))}
                </div>

                <div className="count-badge">
                  선택 개수: {typeCounts[typeKey]}개
                </div>
              </article>
            ))}
          </section>

          <button
            type="button"
            className="btn btn-primary result-button"
            onClick={() => setShowTypeResult(true)}
            disabled={selectedItems.length === 0}
          >
            ✨ 결과 보기
          </button>

          {showTypeResult && (
            <section className="fixed-result-section">
              <h2 className="fixed-result-title">
                {hasDevelopedSpeechType
                  ? `당신의 스피치 유형은 ${resultTypeNames}입니다.`
                  : '아직 스피치 유형이 개발되지 않았습니다.'}
              </h2>

              {!hasDevelopedSpeechType && (
                <p className="speech-type-encourage-message">
                  아직 특정 유형으로 단정하기보다 여러 스피치 특성을 함께 키워가는
                  단계예요. 지금부터 조금씩 연습하면 충분히 나만의 스피치 유형이
                  만들어질 수 있어요 🌱
                </p>
              )}

              <p className="speech-type-result-guide">
                6개 이상 나온 게 내 스피치 유형입니다.
                <br />
                6개 이상 나온 게 없다면, 5개 이상인 것 중 가장 높게 나온 점수가
                내 스피치 유형입니다.
              </p>

              <div className="type-count-summary">
                {SPEECH_TYPE_KEYS.map((typeKey) => (
                  <div className="type-count-item" key={typeKey}>
                    <span>{SPEECH_TYPES[typeKey].displayName}</span>
                    <strong>{typeCounts[typeKey]}개</strong>
                  </div>
                ))}
              </div>

              <div className="speech-type-description-heading">
                <h3>스피치 유형 설명</h3>
              </div>

              <div className="fixed-result-grid">
                {hasDevelopedSpeechType &&
                  resultTypeKeys.map((typeKey) => {
                    const typeInfo = SPEECH_TYPES[typeKey];

                    return (
                      <article
                        className="fixed-result-card primary-result-card"
                        key={typeKey}
                      >
                        <div className="result-card-label">나의 주요 유형</div>
                        <h3>{typeInfo.displayName}</h3>

                        <div className="result-block">
                          <h4>유형 설명</h4>
                          <p>{typeInfo.description}</p>
                        </div>

                        <div className="result-block">
                          <h4>선호하는 스피치 방식</h4>
                          <p>{typeInfo.preferredStyle}</p>
                        </div>

                        <div className="result-block">
                          <h4>불편하게 느끼는 스피치 방식</h4>
                          <p>{typeInfo.difficultStyle}</p>
                        </div>

                        <div className="result-block">
                          <h4>주요 특징</h4>
                          <ul className="result-characteristic-list">
                            {typeInfo.characteristics.map((characteristic) => (
                              <li key={characteristic}>{characteristic}</li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    );
                  })}

                {hasDevelopedSpeechType && otherTypeKeys.length > 0 && (
                  <div className="other-type-heading">나머지 유형 설명</div>
                )}

                {!hasDevelopedSpeechType && (
                  <div className="other-type-heading">
                    체크가 많은 순서로 보는 유형 설명
                  </div>
                )}

                {otherTypeKeys.map((typeKey) => {
                  const typeInfo = SPEECH_TYPES[typeKey];

                  return (
                    <article
                      className="fixed-result-card secondary-result-card"
                      key={typeKey}
                    >
                      <div className="result-card-label muted-label">
                        선택 {typeCounts[typeKey]}개
                      </div>

                      <h3>{typeInfo.displayName}</h3>

                      <div className="result-block">
                        <h4>유형 설명</h4>
                        <p>{typeInfo.description}</p>
                      </div>

                      <div className="result-block">
                        <h4>선호하는 스피치 방식</h4>
                        <p>{typeInfo.preferredStyle}</p>
                      </div>

                      <div className="result-block">
                        <h4>불편하게 느끼는 스피치 방식</h4>
                        <p>{typeInfo.difficultStyle}</p>
                      </div>

                      <div className="result-block">
                        <h4>주요 특징</h4>
                        <ul className="result-characteristic-list">
                          {typeInfo.characteristics.map((characteristic) => (
                            <li key={characteristic}>{characteristic}</li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>

              <p className="speech-type-final-guide">
                스피치 진단으로 돌아가 내 유형을 입력해주세요.
              </p>
            </section>
          )}
        </main>
      )}

      {screenMode === 'speechAbility' && (
        <main className="test-screen">
          <div className="test-top-bar">
            <button type="button" className="home-return-button" onClick={handleGoHome}>
              처음으로
            </button>
          </div>

          <header className="test-header green-header">
            <div className="header-icon">🎥</div>
            <h1>스피치 능력 테스트</h1>
            <p>영상 속 나를 차분히 바라보는 것만으로도 이미 성장 중이에요 🎥</p>
            <div className="ability-guide-text">주관적으로 표시해주세요!</div>
          </header>

          <section className="video-notice-card test-method-card">
            <strong>&lt;테스트 하는 법&gt;</strong>
            <ol>
              <li>1분 이상의 발표 영상을 찍는다.&#40;최소 30초 이상&#41;</li>
              <li>영상을 보며 점수를 입력한다.</li>
              <li>3항목의 총점을 스피치 진단으로 돌아가 입력한다.</li>
            </ol>
            <p className="small-guide">각 항목의 총점은 자동 반올림됩니다.</p>
          </section>

          <section className="ability-section-list">
            {ABILITY_SECTIONS.map((section) => (
              <article className="ability-section-card" key={section.key}>
                <div className="ability-section-header">
                  <div>
                    <h2 className="ability-section-title">{section.title}</h2>
                    <p className="ability-section-description">{section.description}</p>
                  </div>

                  <span className="ability-max-score">최대 {section.maxScore}점</span>
                </div>

                <div className="ability-slider-list">
                  {section.items.map((item, itemIndex) => (
                    <div className="ability-slider-item" key={`${section.key}-${item}`}>
                      <label
                        className="ability-slider-label"
                        htmlFor={`${section.key}-${itemIndex}`}
                      >
                        {item}
                      </label>

                      <div className="ability-slider-control">
                        <input
                          id={`${section.key}-${itemIndex}`}
                          className="ability-range"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={abilityScores[section.key][itemIndex]}
                          onChange={(event) =>
                            handleAbilityScoreChange(
                              section.key,
                              itemIndex,
                              event.target.value,
                            )
                          }
                        />

                        <span className="ability-score-badge">
                          {abilityScores[section.key][itemIndex]}점
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ability-average-score">
                  {section.averageLabel}: {roundedAbilityScores[section.key]}점 /{' '}
                  {section.maxScore}점
                </div>
              </article>
            ))}

            <section className="ability-score-summary-card">
              <h2>항목별 총점 정리</h2>

              <div className="ability-score-summary-grid">
                {ABILITY_SECTIONS.map((section) => (
                  <div className="ability-score-summary-item" key={section.key}>
                    <span>{section.title}</span>
                    <strong>
                      <span className="summary-score-number">
                        {roundedAbilityScores[section.key]}
                      </span>
                      점 / {section.maxScore}점
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <div className="ability-total-card">
              최종 총점: {totalAbilityScore}점 / 20점
            </div>

            <p className="ability-final-guide">
              이제 스피치 진단으로 돌아가 점수를 입력해주세요!
            </p>
          </section>
        </main>
      )}
    </div>
  );
}