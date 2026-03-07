import type { Metadata } from 'next';
import AlertDetailView from '@/components/favorites/AlertDetailView';

type Props = {
    params: { id: string };
};

export const metadata: Metadata = {
    title: 'Alert Detail | LooPyck',
    description: '도착한 가격 알림의 상세 내용과 비교 링크를 확인하세요.',
};

export default function FavoriteAlertDetailRoutePage({ params }: Props) {
    return <AlertDetailView alertId={params.id} />;
}
