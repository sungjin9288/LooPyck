export interface FitGuideInfo {
    fit: string;
    recommendation: string;
    reason: string;
    icon: string;
}

export const SHOE_SIZES = ['235', '240', '245', '250', '255', '260', '265', '270', '275', '280', '285', '290'];
export const CLOTHING_SIZES = ['44(XS)', '55(S)', '66(M)', '77(L)', '88(XL)', '100(2XL)', '110(3XL)'];

function getShoeFit(nameLower: string): FitGuideInfo {
    if (/조던|jordan/.test(nameLower)) {
        return { fit: '작게 나옴 (Runs Small)', recommendation: '반업(+5mm) 추천', reason: '발볼이 좁게 나오는 모델입니다. 발볼이 넓다면 일업(+10mm)도 고려해보세요.', icon: '📏' };
    }
    if (/덩크|dunk/.test(nameLower)) {
        return { fit: '작게 나옴 (Runs Small)', recommendation: '반업(+5mm) 추천', reason: '발볼이 타이트하게 나옵니다. 반업 착용을 권장합니다.', icon: '📏' };
    }
    if (/포스|force|에어맥스|air max/.test(nameLower)) {
        return { fit: '정사이즈 (True to Size)', recommendation: '정사이즈 추천', reason: '평균적인 발볼에 맞게 제작되었습니다.', icon: '👟' };
    }
    if (/뉴발란스|new balance|990|992|993|574/.test(nameLower)) {
        return { fit: '정사이즈 (True to Size)', recommendation: '정사이즈 추천', reason: '뉴발란스는 발볼이 넉넉하게 제작됩니다.', icon: '👟' };
    }
    if (/아디다스|adidas|스탠스미스|stan smith|슈퍼스타|superstar/.test(nameLower)) {
        return { fit: '크게 나옴 (Runs Large)', recommendation: '반사이즈 다운(-5mm) 추천', reason: '아디다스 오리지널스 라인은 전반적으로 크게 나옵니다.', icon: '📏' };
    }
    if (/살로몬|salomon|xt-6|speedcross/.test(nameLower)) {
        return { fit: '작게 나옴 (Runs Small)', recommendation: '반업(+5mm) 추천', reason: '살로몬 러닝화는 발볼이 좁습니다.', icon: '📏' };
    }
    if (/컨버스|converse|척테일러|chuck taylor/.test(nameLower)) {
        return { fit: '크게 나옴 (Runs Large)', recommendation: '1사이즈 다운 추천', reason: '컨버스 올스타는 발볼이 넓게 나옵니다. 한 사이즈 작게 구매하세요.', icon: '📏' };
    }
    return { fit: '정사이즈 (Standard Fit)', recommendation: '정사이즈 또는 반업 추천', reason: '리뷰 분석 결과 대부분의 구매자가 정사이즈를 착용했습니다.', icon: '✨' };
}

function getClothingFit(nameLower: string): FitGuideInfo {
    if (/무신사 스탠다드|musinsa standard/.test(nameLower)) {
        return { fit: '슬림 핏 (Slim Fit)', recommendation: '평소보다 한 사이즈 업 추천', reason: '무신사 스탠다드는 슬림하게 재단됩니다. 여유 있게 입으려면 한 사이즈 업하세요.', icon: '👔' };
    }
    if (/유니클로|uniqlo/.test(nameLower)) {
        return { fit: '정사이즈 (Regular Fit)', recommendation: '정사이즈 추천', reason: '유니클로는 국내 체형 기준으로 정사이즈가 잘 맞습니다.', icon: '👕' };
    }
    if (/오버핏|overfit|oversized|오버사이즈/.test(nameLower)) {
        return { fit: '오버핏 디자인', recommendation: '정사이즈 또는 한 사이즈 다운', reason: '오버핏 디자인 상품입니다. 더 슬림하게 입고 싶다면 한 사이즈 다운하세요.', icon: '🧥' };
    }
    if (/크롭|crop/.test(nameLower)) {
        return { fit: '크롭 핏', recommendation: '정사이즈 추천', reason: '크롭 상품은 기장이 짧게 디자인되었습니다.', icon: '✂️' };
    }
    if (/슬랙스|trousers|dress pants/.test(nameLower)) {
        return { fit: '슬림 핏 (Slim Fit)', recommendation: '허리 + 기장 치수 확인 필수', reason: '슬랙스는 허리 사이즈가 중요합니다. 상세 치수표를 꼭 확인하세요.', icon: '👖' };
    }
    return { fit: '정사이즈 (Regular Fit)', recommendation: '정사이즈 추천', reason: '리뷰 분석 결과 대부분 정사이즈를 착용했으며 기장이 평균적입니다.', icon: '👕' };
}

export function isShoeCategory(productName: string, category: string = ''): boolean {
    const catLower = category.toLowerCase();
    const nameLower = productName.toLowerCase();
    if (catLower.includes('신발') || catLower.includes('shoes') || catLower.includes('sneaker')) return true;
    if (/스니커|나이키|아디다스|뉴발란스|컨버스|살로몬|조던|덩크|포스|에어맥스|슬리퍼|샌들|부츠|운동화/.test(nameLower)) return true;
    return false;
}

export function getFitGuide(productName: string, category: string = ''): FitGuideInfo {
    const nameLower = productName.toLowerCase();
    return isShoeCategory(productName, category) ? getShoeFit(nameLower) : getClothingFit(nameLower);
}

export function getRecommendedShoeSize(userSize: string, fitInfo: Pick<FitGuideInfo, 'fit'>): string | null {
    const base = Number.parseInt(userSize, 10);
    if (!Number.isFinite(base)) {
        return null;
    }

    if (fitInfo.fit.includes('작게')) return `${base + 5}mm`;
    if (fitInfo.fit.includes('크게')) return `${base - 5}mm`;
    return `${base}mm`;
}
