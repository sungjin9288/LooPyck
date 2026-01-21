'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { addPriceAlert, PriceAlert } from '@/lib/favorites';
import { parsePrice } from '@/lib/api';

interface PriceAlertButtonProps {
  product: Product;
}

export default function PriceAlertButton({ product }: PriceAlertButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [success, setSuccess] = useState(false);

  const currentPrice = parsePrice(product.lprice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const target = parseInt(targetPrice);
    if (target >= currentPrice) {
      alert('목표 가격은 현재 가격보다 낮아야 합니다');
      return;
    }

    const alert: PriceAlert = {
      productId: product.productId,
      productTitle: product.title,
      productImage: product.image,
      targetPrice: target,
      currentPrice: currentPrice,
      createdAt: new Date().toISOString(),
    };

    addPriceAlert(alert);
    setSuccess(true);
    setTimeout(() => {
      setShowModal(false);
      setSuccess(false);
      setTargetPrice('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        className="absolute top-16 right-3 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center z-10"
        aria-label="가격 알림 설정"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  알림이 설정되었습니다!
                </h3>
                <p className="text-gray-600 text-sm">
                  가격이 목표가 이하로 떨어지면 브라우저에서 확인할 수 있습니다
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  가격 하락 알림 설정
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  현재 가격: <span className="font-bold text-blue-600">{currentPrice.toLocaleString()}원</span>
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      목표 가격 (원)
                    </label>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="예: 20000"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      이 가격 이하로 떨어지면 알림을 받습니다
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      알림 설정
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
