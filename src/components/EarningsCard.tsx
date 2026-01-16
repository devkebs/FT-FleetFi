import React from 'react';
import { DriverEarning } from '../services/api';

interface EarningsCardProps {
  earning: DriverEarning;
  onViewTrip?: (tripId: number) => void;
  compact?: boolean;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  earning,
  onViewTrip,
  compact = false
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'trip': return 'bi-geo-alt-fill';
      case 'swap': return 'bi-lightning-charge-fill';
      case 'bonus': return 'bi-gift-fill';
      case 'penalty': return 'bi-exclamation-triangle-fill';
      case 'adjustment': return 'bi-sliders';
      default: return 'bi-cash';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'trip': return 'text-primary';
      case 'swap': return 'text-warning';
      case 'bonus': return 'text-success';
      case 'penalty': return 'text-danger';
      case 'adjustment': return 'text-info';
      default: return 'text-secondary';
    }
  };

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'trip': return 'bg-primary';
      case 'swap': return 'bg-warning';
      case 'bonus': return 'bg-success';
      case 'penalty': return 'bg-danger';
      case 'adjustment': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'trip': return 'Trip Earning';
      case 'swap': return 'Swap Bonus';
      case 'bonus': return 'Bonus';
      case 'penalty': return 'Penalty';
      case 'adjustment': return 'Adjustment';
      default: return source;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return { class: 'bg-success', icon: 'bi-check-circle', label: 'Paid' };
      case 'pending': return { class: 'bg-warning text-dark', icon: 'bi-clock', label: 'Pending' };
      case 'processed': return { class: 'bg-info', icon: 'bi-hourglass-split', label: 'Processing' };
      case 'failed': return { class: 'bg-danger', icon: 'bi-x-circle', label: 'Failed' };
      default: return { class: 'bg-secondary', icon: 'bi-question-circle', label: status };
    }
  };

  const paymentStatus = getPaymentStatusBadge(earning.payment_status);
  const isNegative = earning.source_type === 'penalty' || earning.net_amount < 0;

  if (compact) {
    return (
      <div className="list-group-item px-0 py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className={`bi ${getSourceIcon(earning.source_type)} ${getSourceColor(earning.source_type)} me-2`}></i>
            <div>
              <span className="fw-semibold">{getSourceLabel(earning.source_type)}</span>
              <small className="text-muted d-block">{formatDate(earning.earned_at)}</small>
            </div>
          </div>
          <div className="text-end">
            <span className={`fw-bold ${isNegative ? 'text-danger' : 'text-success'}`}>
              {isNegative ? '-' : '+'}₦{Math.abs(earning.net_amount).toLocaleString()}
            </span>
            <br />
            <span className={`badge ${paymentStatus.class}`} style={{ fontSize: '0.7rem' }}>
              {paymentStatus.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div className={`rounded-circle p-2 ${getSourceBadgeClass(earning.source_type)} bg-opacity-10 me-2`}>
            <i className={`bi ${getSourceIcon(earning.source_type)} ${getSourceColor(earning.source_type)}`}></i>
          </div>
          <div>
            <h6 className="mb-0 fw-bold">{getSourceLabel(earning.source_type)}</h6>
            <small className="text-muted">#{earning.earning_id}</small>
          </div>
        </div>
        <span className={`badge ${paymentStatus.class}`}>
          <i className={`bi ${paymentStatus.icon} me-1`}></i>
          {paymentStatus.label}
        </span>
      </div>
      <div className="card-body">
        {/* Description */}
        {earning.description && (
          <p className="text-muted mb-3">{earning.description}</p>
        )}

        {/* Amount Breakdown */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Gross Amount</span>
            <span>₦{earning.gross_amount.toLocaleString()}</span>
          </div>
          {earning.commission > 0 && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Commission (15%)</span>
              <span className="text-danger">-₦{earning.commission.toLocaleString()}</span>
            </div>
          )}
          {earning.deductions > 0 && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Deductions</span>
              <span className="text-danger">-₦{earning.deductions.toLocaleString()}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Net Amount</span>
            <span className={`fs-5 ${isNegative ? 'text-danger' : 'text-success'}`}>
              {isNegative ? '-' : ''}₦{Math.abs(earning.net_amount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="row g-2 mb-3">
          <div className="col-6">
            <div className="bg-light rounded p-2">
              <small className="text-muted d-block">Earned At</small>
              <span className="fw-semibold">{formatDate(earning.earned_at)}</span>
            </div>
          </div>
          <div className="col-6">
            <div className="bg-light rounded p-2">
              <small className="text-muted d-block">
                {earning.payment_status === 'paid' ? 'Paid At' : 'Payment Status'}
              </small>
              <span className="fw-semibold">
                {earning.payment_status === 'paid' && earning.paid_at
                  ? formatDate(earning.paid_at)
                  : paymentStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Trip */}
        {earning.trip && (
          <div className="border-top pt-3">
            <small className="text-muted d-block mb-2">Associated Trip</small>
            <div className="d-flex justify-content-between align-items-center bg-light rounded p-2">
              <div>
                <i className="bi bi-geo-alt me-2 text-primary"></i>
                <span className="fw-semibold">#{earning.trip.trip_id.split('-')[1] || earning.trip.trip_id}</span>
                <small className="text-muted ms-2">
                  {earning.trip.distance_km.toFixed(1)} km
                </small>
              </div>
              {onViewTrip && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => onViewTrip(earning.trip!.id)}
                >
                  <i className="bi bi-eye"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Currency Footer */}
      <div className="card-footer bg-light text-center">
        <small className="text-muted">
          <i className="bi bi-currency-exchange me-1"></i>
          Currency: {earning.currency}
        </small>
      </div>
    </div>
  );
};

// Summary Card for Earnings Overview
interface EarningsSummaryCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  bgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  iconColor = 'text-white',
  bgColor = 'bg-success',
  trend
}) => {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className={`card-body ${bgColor} text-white`}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="text-white-50 mb-0">{title}</h6>
          <i className={`bi ${icon} fs-4 ${iconColor}`}></i>
        </div>
        <h3 className="fw-bold mb-1">₦{amount.toLocaleString()}</h3>
        {subtitle && <small className="text-white-50">{subtitle}</small>}
        {trend && (
          <div className="mt-2">
            <span className={`badge ${trend.isPositive ? 'bg-light text-success' : 'bg-light text-danger'}`}>
              <i className={`bi ${trend.isPositive ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
              {trend.value}%
            </span>
            <small className="text-white-50 ms-2">vs last period</small>
          </div>
        )}
      </div>
    </div>
  );
};

// Daily Earnings Chart Placeholder
interface DailyEarningsChartProps {
  data: Array<{ date: string; day: string; earnings: number; trips: number }>;
}

export const DailyEarningsChart: React.FC<DailyEarningsChartProps> = ({ data }) => {
  const maxEarnings = Math.max(...data.map(d => d.earnings), 1);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white">
        <h6 className="mb-0">
          <i className="bi bi-bar-chart me-2 text-primary"></i>
          Daily Earnings (Last 7 Days)
        </h6>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-end" style={{ height: '150px' }}>
          {data.map((day, index) => (
            <div key={index} className="text-center flex-fill px-1">
              <div
                className="bg-primary rounded-top mx-auto"
                style={{
                  width: '30px',
                  height: `${(day.earnings / maxEarnings) * 120}px`,
                  minHeight: '4px',
                  transition: 'height 0.3s ease'
                }}
                title={`₦${day.earnings.toLocaleString()}`}
              ></div>
              <small className="d-block text-muted mt-1">{day.day}</small>
              <small className="d-block fw-semibold">₦{(day.earnings / 1000).toFixed(1)}k</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsCard;
