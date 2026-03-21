'use client';

import { ConsultationData } from '@/types';

interface PrintableAfterNoteProps {
  data: ConsultationData;
  designerName: string;
  afterNote: string;
}

export const PrintableAfterNote = ({ data, designerName, afterNote }: PrintableAfterNoteProps) => {
  const getDirectionSummary = () => {
    const allDirections: string[] = [];
    if (data.nextDirection.lengthChange.length > 0) {
      allDirections.push(`길이 변화 (${data.nextDirection.lengthChange.join(', ')})`);
    }
    if (data.nextDirection.colorChange.length > 0) {
      allDirections.push(`컬러 변화 (${data.nextDirection.colorChange.join(', ')})`);
    }
    if (data.nextDirection.others.length > 0) {
      allDirections.push(...data.nextDirection.others);
    }
    if (allDirections.length === 0) return '';
    return `다음 방문 시에는 ${allDirections.join(', ')} 방향으로 디자인을 확장할 수 있습니다.`;
  };

  return (
    <div>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          .print-page { page-break-after: always; break-after: page; }
          .print-page:last-child { page-break-after: auto; break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .print-page {
          width: 210mm; height: 297mm; margin: 0; padding: 0;
          background-color: #FFFFFF; box-sizing: border-box;
          overflow: hidden; position: relative;
          page-break-after: always; break-after: page;
        }
        .print-page:last-child { page-break-after: auto; break-after: auto; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* COVER PAGE */}
      <div className="print-page">
        <div style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          height: '65%', backgroundColor: '#F5F5F5',
          textAlign: 'center', padding: '0 80px'
        }}>
          <div style={{ fontSize: '11pt', fontWeight: 500, letterSpacing: '0.08em', color: '#111111', marginBottom: '16px' }}>
            BE YOURSELF.
          </div>
          <div style={{ fontSize: '8pt', fontWeight: 300, letterSpacing: '0.02em', color: '#555555', lineHeight: '1.6' }}>
            모든 사람이 자신의 아름다움을 발견하도록 돕습니다.
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', padding: '60px 80px 40px',
          textAlign: 'center', height: '35%', boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '32pt', fontWeight: 300, letterSpacing: '0.28em', color: '#111111', marginBottom: '24px' }}>
            AFTER NOTE
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 400, letterSpacing: '0.08em', color: '#555555', marginBottom: '40px' }}>
            {data.clientInfo.name}
          </div>
          <div style={{ fontSize: '9pt', fontWeight: 500, letterSpacing: '0.1em', color: '#AAAAAA' }}>
            MERCI MOMONG
          </div>
        </div>
      </div>

      {/* PAGE 1 */}
      <div className="print-page" style={{ padding: '60px 50px', fontFamily: "'Noto Sans KR', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '20pt', fontWeight: 500, letterSpacing: '0.08em', color: '#1C1C1C', marginBottom: '8px' }}>AFTER NOTE</div>
          <div style={{ fontSize: '9pt', color: '#999999', letterSpacing: '0.02em', fontWeight: 300 }}>Today's Design Record</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px', paddingBottom: '16px', borderBottom: '1px solid #EAEAEA' }}>
          <div>
            <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>고객명</div>
            <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{data.clientInfo.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>방문일</div>
            <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{data.visitDate}</div>
          </div>
          <div>
            <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>담당 디자이너</div>
            <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{designerName}</div>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 500, marginBottom: '20px', color: '#1C1C1C', letterSpacing: '0.05em' }}>IMAGE TYPE & HAIR CONDITION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ border: '1px solid #EAEAEA', padding: '16px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 500, marginBottom: '14px', color: '#6E1F2A', letterSpacing: '0.03em' }}>IMAGE TYPE</div>
              {['WARM', 'NEUTRAL', 'COOL'].map((type) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '14px', height: '14px',
                    border: data.faceImageType.type.toUpperCase() === type ? '2px solid #6E1F2A' : '1px solid #CCCCCC',
                    marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: data.faceImageType.type.toUpperCase() === type ? '#6E1F2A' : 'transparent'
                  }}>
                    {data.faceImageType.type.toUpperCase() === type && (
                      <div style={{ width: '5px', height: '5px', backgroundColor: '#FFFFFF' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '10pt', color: data.faceImageType.type.toUpperCase() === type ? '#6E1F2A' : '#AAAAAA', fontWeight: data.faceImageType.type.toUpperCase() === type ? 500 : 400 }}>{type}</div>
                </div>
              ))}
              <div style={{ fontSize: '8pt', color: '#999999', lineHeight: '1.5', fontWeight: 300, paddingTop: '10px', borderTop: '1px solid #F5F5F5' }}>
                현재 인상 기준 최적 이미지 타입
              </div>
            </div>

            <div style={{ border: '1px solid #EAEAEA', padding: '16px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 500, marginBottom: '14px', color: '#6E1F2A', letterSpacing: '0.03em' }}>HAIR CONDITION</div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>손상도</div>
                <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{data.hairCondition.damageLevel}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>모질</div>
                <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{data.hairCondition.hairType.join(', ')}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '8pt', color: '#999999', marginBottom: '4px', fontWeight: 300 }}>숱</div>
                <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400 }}>{data.hairCondition.density}</div>
              </div>
              <div style={{ fontSize: '8pt', color: '#999999', lineHeight: '1.5', fontWeight: 300, paddingTop: '10px', borderTop: '1px solid #F5F5F5' }}>
                모발 컨디션 기준 조율
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10pt', fontWeight: 500, marginBottom: '20px', color: '#1C1C1C', letterSpacing: '0.05em' }}>TODAY DESIGN</div>
          <div style={{ border: '1px solid #EAEAEA' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '20% 30% 50%', borderBottom: '1px solid #EAEAEA', backgroundColor: '#FAFAFA' }}>
              <div style={{ padding: '10px 14px', fontSize: '8pt', color: '#555555', fontWeight: 400, borderRight: '1px solid #EAEAEA' }}>항목</div>
              <div style={{ padding: '10px 14px', fontSize: '8pt', color: '#555555', fontWeight: 400, borderRight: '1px solid #EAEAEA' }}>결과</div>
              <div style={{ padding: '10px 14px', fontSize: '8pt', color: '#555555', fontWeight: 400 }}>메모</div>
            </div>
            {[
              { label: '길이', values: data.todayDesign.length, memo: data.todayDesign.lengthMemo },
              { label: '앞머리', values: data.todayDesign.bangs, memo: data.todayDesign.bangsMemo },
              { label: '컬 / 질감', values: data.todayDesign.curlTexture, memo: data.todayDesign.curlTextureMemo },
              { label: '컬러', values: data.todayDesign.color, memo: data.todayDesign.colorMemo },
            ].filter(row => row.values.length > 0).map((row, idx, arr) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '20% 30% 50%', minHeight: '42px', borderBottom: idx < arr.length - 1 ? '1px solid #EAEAEA' : 'none' }}>
                <div style={{ padding: '12px 14px', fontSize: '9pt', color: '#555555', fontWeight: 400, borderRight: '1px solid #EAEAEA', display: 'flex', alignItems: 'center' }}>{row.label}</div>
                <div style={{ padding: '12px 14px', fontSize: '9pt', color: '#111111', fontWeight: 500, borderRight: '1px solid #EAEAEA', display: 'flex', alignItems: 'center' }}>{row.values.join(', ')}</div>
                <div style={{ padding: '12px 14px', fontSize: '9pt', color: '#555555', fontWeight: 400, lineHeight: '1.6', display: 'flex', alignItems: 'center' }}>{row.memo || '-'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '18px', backgroundColor: '#FFFFFF', border: '1px solid #EAEAEA' }}>
            <div style={{ fontSize: '9pt', color: '#555555', lineHeight: '1.6', fontWeight: 400 }}>
              현재 얼굴 밸런스와 모질 컨디션을 기준으로 안정적인 방향으로 진행된 디자인입니다.<br />
              손상도와 이미지 변화에 따라 다음 방문 시 디자인이 조정될 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="print-page" style={{ padding: '60px 50px', fontFamily: "'Noto Sans KR', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '20pt', fontWeight: 500, letterSpacing: '0.08em', color: '#1C1C1C', marginBottom: '8px' }}>FUTURE DIRECTION</div>
          <div style={{ fontSize: '9pt', color: '#999999', letterSpacing: '0.02em', fontWeight: 300 }}>Next Design Strategy</div>
        </div>

        {(data.nextDirection.lengthChange.length > 0 || data.nextDirection.colorChange.length > 0 || data.nextDirection.others.length > 0) && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 500, marginBottom: '24px', color: '#1C1C1C', letterSpacing: '0.05em' }}>NEXT DIRECTION</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              {data.nextDirection.lengthChange.length > 0 && (
                <div style={{ padding: '10px 20px', border: '1px solid #6E1F2A', fontSize: '9pt', color: '#6E1F2A', fontWeight: 500 }}>
                  길이 변화 ({data.nextDirection.lengthChange.join(', ')})
                </div>
              )}
              {data.nextDirection.colorChange.length > 0 && (
                <div style={{ padding: '10px 20px', border: '1px solid #6E1F2A', fontSize: '9pt', color: '#6E1F2A', fontWeight: 500 }}>
                  컬러 변화 ({data.nextDirection.colorChange.join(', ')})
                </div>
              )}
              {data.nextDirection.others.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 20px', border: '1px solid #6E1F2A', fontSize: '9pt', color: '#6E1F2A', fontWeight: 500 }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 18px', backgroundColor: '#FAFAFA', border: '1px solid #EAEAEA' }}>
              <div style={{ fontSize: '9pt', color: '#666666', lineHeight: '1.6', fontWeight: 300 }}>{getDirectionSummary()}</div>
            </div>
          </div>
        )}

        {data.designCycleGuide.selectedMonths.filter(m => m.services.length > 0).length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 500, marginBottom: '24px', color: '#1C1C1C', letterSpacing: '0.05em' }}>DESIGN ROADMAP</div>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              {data.designCycleGuide.selectedMonths
                .filter(m => m.services.length > 0)
                .sort((a, b) => {
                  const order = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
                  return order.indexOf(a.month) - order.indexOf(b.month);
                })
                .map((monthData) => (
                  <div key={monthData.month} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #EAEAEA' }}>
                    <div style={{ fontSize: '10pt', color: '#1C1C1C', fontWeight: 400, minWidth: '60px', marginRight: '24px' }}>{monthData.month}</div>
                    <div style={{ fontSize: '10pt', color: '#999999', fontWeight: 300, marginRight: '16px' }}>—</div>
                    <div style={{ fontSize: '10pt', color: '#6E1F2A', fontWeight: 500 }}>
                      {monthData.services.join(', ')}
                      {monthData.memo && <span style={{ fontSize: '9pt', color: '#999999', fontWeight: 300, marginLeft: '12px' }}>({monthData.memo})</span>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '10pt', fontWeight: 500, marginBottom: '20px', color: '#1C1C1C', letterSpacing: '0.05em' }}>PROFESSIONAL NOTE</div>
          <div style={{ padding: '16px 18px', border: '1px solid #EAEAEA' }}>
            <div style={{ fontSize: '9pt', color: '#666666', lineHeight: '1.6', fontWeight: 300, whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '40px' }}>
              {afterNote || '현재 설정된 디자인 방향을 유지하기 위해 정기적인 관리가 필요합니다.\n컨디션 변화에 따라 플랜이 조정될 수 있습니다.'}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: '#FFFFFF', textAlign: 'center', padding: '24px 50px' }}>
          <div style={{ paddingTop: '16px', borderTop: '1px solid #EAEAEA' }}>
            <div style={{ fontSize: '9pt', color: '#CCCCCC', lineHeight: '1.6', fontWeight: 300, marginBottom: '10px' }}>
              디자인은 고정되지 않습니다.<br />
              얼굴, 이미지, 컨디션에 따라 매 방문마다 FIT는 달라질 수 있습니다.
            </div>
            <div style={{ fontSize: '10pt', color: '#999999', letterSpacing: '0.05em', fontWeight: 500 }}>MERCI MOMONG</div>
          </div>
        </div>
      </div>
    </div>
  );
};
