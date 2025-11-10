import React from 'react';
import type { RevenueBreakdown as RevenueBreakdownType } from '../services/api';

interface RevenueBreakdownProps {
  data: RevenueBreakdownType | null;
  loading?: boolean;
}

export default function RevenueBreakdown({ data, loading }: RevenueBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Allocation</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Allocation</h3>
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  const { gross_total, breakdown } = data;

  const items = [
    {
      label: 'Investor ROI',
      amount: breakdown.investor_roi.amount,
      pct: breakdown.investor_roi.pct,
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      label: 'Rider Wages',
      amount: breakdown.rider_wages.amount,
      pct: breakdown.rider_wages.pct,
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      label: 'Management Reserve',
      amount: breakdown.management_reserve.amount,
      pct: breakdown.management_reserve.pct,
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    },
    {
      label: 'Maintenance Reserve',
      amount: breakdown.maintenance_reserve.amount,
      pct: breakdown.maintenance_reserve.pct,
      color: 'bg-orange-500',
      textColor: 'text-orange-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Allocation</h3>
      <div className="mb-6">
        <p className="text-sm text-gray-500">Total Gross Revenue</p>
        <p className="text-3xl font-bold text-gray-900">
          ${gross_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className={`text-sm font-semibold ${item.textColor}`}>
                {item.pct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${item.color} h-2.5 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, item.pct)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
