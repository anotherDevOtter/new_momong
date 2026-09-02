/**
 * 패션 스타일 사진 세트 (성별별).
 *
 * FIT 컨설팅의 패션 키워드 화면에서 쓰던 것을 공용으로 옮겼다.
 * 사전설문의 패션 문항도 같은 사진을 써야 고객이 본 것과 컨설팅 화면이 일치한다.
 *
 * ⚠️ 이미지가 pinimg.com 핫링크다. 외부가 막히면 사진이 안 뜬다.
 *    로컬(public/)로 옮기는 건 별개 작업으로 남겨둔다.
 */
export const FEMALE_FASHION_STYLES: Record<string, string[]> = {
  '클래식': [
    'https://i.pinimg.com/736x/ec/be/1d/ecbe1d493234af373a8286443b0cb460.jpg',
    'https://i.pinimg.com/474x/2a/a5/b9/2aa5b962086494b1a51c8044f17cedbd.jpg',
  ],
  '페미닌': [
    'https://i.pinimg.com/1200x/23/a9/b6/23a9b63f0b4a537a533b6716fa6383ef.jpg',
    'https://i.pinimg.com/1200x/3c/18/7b/3c187be75686866fff6ba84e38a1d30d.jpg',
  ],
  '캐주얼': [
    'https://i.pinimg.com/736x/4d/3c/84/4d3c84df390d1a0894e9a01e2ee836ef.jpg',
    'https://i.pinimg.com/736x/2a/88/91/2a88910225a5b5afde9b3d447f57ec87.jpg',
  ],
  '드뮤어': [
    'https://i.pinimg.com/736x/31/3e/36/313e36c0a161530d401e30ce632e45fd.jpg',
    'https://i.pinimg.com/736x/73/bd/24/73bd245b720262fc6f2f4613d8c9615b.jpg',
  ],
  '미니멀': [
    'https://i.pinimg.com/1200x/28/f5/63/28f5637d7254c0fffdac8e7a61d52f27.jpg',
    'https://i.pinimg.com/736x/3d/f5/b9/3df5b9c8737a1c43ce645968b9e158fd.jpg',
  ],
  '힙시크': [
    'https://i.pinimg.com/736x/82/47/02/82470234c7b91fd531c3c7862d709362.jpg',
    'https://i.pinimg.com/1200x/d8/3b/30/d83b307e687c94f4268e2989348d0494.jpg',
  ],
  '스트릿': [
    'https://i.pinimg.com/736x/cf/83/5b/cf835b1612701567683daff3975f9210.jpg',
    'https://i.pinimg.com/736x/52/1a/68/521a6858515bbb94d5748231c31e4af0.jpg',
  ],
};

export const MALE_FASHION_STYLES: Record<string, string[]> = {
  '클래식': [
    'https://i.pinimg.com/736x/00/e3/51/00e351bb597ad68f93a6ab7fe656d418.jpg',
    'https://i.pinimg.com/736x/8c/1b/34/8c1b344ddb8a55513d762178357a0a5b.jpg',
  ],
  '드뮤어': [
    'https://i.pinimg.com/736x/a3/1c/5c/a31c5cebf83268bc11bbe1cf00439f89.jpg',
    'https://i.pinimg.com/736x/4b/5f/3a/4b5f3a8309612af3ec9f64ca78b52008.jpg',
  ],
  '캐주얼': [
    'https://i.pinimg.com/736x/68/b7/ba/68b7ba892a0b9f68368d76fb295dee21.jpg',
    'https://i.pinimg.com/736x/ef/3b/8c/ef3b8cab65d1d58bebffee2fc30d6679.jpg',
  ],
  '미니멀': [
    'https://i.pinimg.com/736x/dd/2b/0d/dd2b0d00ae33d93a0784dab0ee80cd10.jpg',
    'https://i.pinimg.com/736x/f6/12/7d/f6127d65201f59b56da9cadba7ac5179.jpg',
  ],
  '힙시크': [
    'https://i.pinimg.com/736x/67/2b/c2/672bc2c0510b4ed5c63d2a7ad6f73528.jpg',
    'https://i.pinimg.com/736x/c3/19/66/c31966d1ff0cc8e9c1c6e3c1d3713545.jpg',
  ],
  '스트릿': [
    'https://i.pinimg.com/736x/10/93/20/10932076b827ef508d10b512f6b6ed22.jpg',
    'https://i.pinimg.com/736x/e1/ad/70/e1ad70755ded968fcaa0a0b46cbbadb3.jpg',
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
