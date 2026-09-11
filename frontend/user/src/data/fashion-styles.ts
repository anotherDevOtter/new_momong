/**
 * 패션 스타일 사진 세트 (성별별).
 *
 * FIT 컨설팅의 패션 키워드 화면에서 쓰던 것을 공용으로 옮겼다.
 * 사전설문의 패션 문항도 같은 사진을 써야 고객이 본 것과 컨설팅 화면이 일치한다.
 *
 * 사진은 public/fashion/ 에 있다. 예전에는 pinimg.com 핫링크라 원본이 지워지면
 * 고객 화면에서 사진이 사라졌다 — 운영에 나간 뒤라 실제 위험이었다. (2026-09-11)
 *
 * ⚠️ 저작권은 옮겨 담아도 그대로다. 매장 촬영본이나 유료 스톡으로 교체해야 한다.
 */
export const FEMALE_FASHION_STYLES: Record<string, string[]> = {
  '클래식': [
    '/fashion/ecbe1d493234af373a8286443b0cb460.jpg',
    '/fashion/2aa5b962086494b1a51c8044f17cedbd.jpg',
  ],
  '페미닌': [
    '/fashion/23a9b63f0b4a537a533b6716fa6383ef.jpg',
    '/fashion/3c187be75686866fff6ba84e38a1d30d.jpg',
  ],
  '캐주얼': [
    '/fashion/4d3c84df390d1a0894e9a01e2ee836ef.jpg',
    '/fashion/2a88910225a5b5afde9b3d447f57ec87.jpg',
  ],
  '드뮤어': [
    '/fashion/313e36c0a161530d401e30ce632e45fd.jpg',
    '/fashion/73bd245b720262fc6f2f4613d8c9615b.jpg',
  ],
  '미니멀': [
    '/fashion/28f5637d7254c0fffdac8e7a61d52f27.jpg',
    '/fashion/3df5b9c8737a1c43ce645968b9e158fd.jpg',
  ],
  '힙시크': [
    '/fashion/82470234c7b91fd531c3c7862d709362.jpg',
    '/fashion/d83b307e687c94f4268e2989348d0494.jpg',
  ],
  '스트릿': [
    '/fashion/cf835b1612701567683daff3975f9210.jpg',
    '/fashion/521a6858515bbb94d5748231c31e4af0.jpg',
  ],
};

export const MALE_FASHION_STYLES: Record<string, string[]> = {
  '클래식': [
    '/fashion/00e351bb597ad68f93a6ab7fe656d418.jpg',
    '/fashion/8c1b344ddb8a55513d762178357a0a5b.jpg',
  ],
  '드뮤어': [
    '/fashion/a31c5cebf83268bc11bbe1cf00439f89.jpg',
    '/fashion/4b5f3a8309612af3ec9f64ca78b52008.jpg',
  ],
  '캐주얼': [
    '/fashion/68b7ba892a0b9f68368d76fb295dee21.jpg',
    '/fashion/ef3b8cab65d1d58bebffee2fc30d6679.jpg',
  ],
  '미니멀': [
    '/fashion/dd2b0d00ae33d93a0784dab0ee80cd10.jpg',
    '/fashion/f6127d65201f59b56da9cadba7ac5179.jpg',
  ],
  '힙시크': [
    '/fashion/672bc2c0510b4ed5c63d2a7ad6f73528.jpg',
    '/fashion/c31966d1ff0cc8e9c1c6e3c1d3713545.jpg',
  ],
  '스트릿': [
    '/fashion/10932076b827ef508d10b512f6b6ed22.jpg',
    '/fashion/e1ad70755ded968fcaa0a0b46cbbadb3.jpg',
  ],
};

export const FASHION_STYLES = {
  female: FEMALE_FASHION_STYLES,
  male: MALE_FASHION_STYLES,
} as const;

/** 성별에 맞는 세트. 모르면 여성 세트를 기본으로 (현재 고객 대부분이 여성). */
export function fashionStylesFor(gender: 'female' | 'male' | null | undefined) {
  return gender === 'male' ? MALE_FASHION_STYLES : FEMALE_FASHION_STYLES;
}
