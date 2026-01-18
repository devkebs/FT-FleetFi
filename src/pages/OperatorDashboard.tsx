import React, { useState, useEffect } from 'react';
import { Asset, Rider, OperationSchedule } from '../types';
import { fetchRiders, assignRider, scheduleSwap, scheduleCharge, exportAssetsCsv, fetchSchedules, updateScheduleStatus, unassignRider, fetchRides, Ride } from '../services/api';
import { initiatePayout, getMyTokens } from '../services/trovotech';
import { LiveTelemetryPanel } from '../components/LiveTelemetryPanel';
import { RoleCapabilities } from '../components/RoleCapabilities';

interface OperatorDashboardProps {
  assets: Asset[];
  onSimulateSwap?: (assetId: string) => void;
  onSimulateCharge?: (assetId: string) => void;
  onUpdateStatus?: (assetId: string, status: string) => void;
  page?: number;
  totalPages?: number;
  onChangePage?: (page: number) => void;
  kycStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  onOpenKyc?: () => void;
  demoMode?: boolean;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ assets = [], onSimulateSwap, onSimulateCharge, onUpdateStatus, page = 1, totalPages = 1, onChangePage, kycStatus = 'pending', onOpenKyc, demoMode = false }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<number | undefined>();
  const [scheduleType, setScheduleType] = useState<'swap'|'charge'>('swap');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [scheduleNote, setScheduleNote] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [schedules, setSchedules] = useState<OperationSchedule[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [payoutPeriod, setPayoutPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [totalRevenue, setTotalRevenue] = useState(50000);
  const [payoutDescription, setPayoutDescription] = useState('Monthly revenue distribution');
  const [initiatingPayout, setInitiatingPayout] = useState(false);
  const kycDisabled = kycStatus !== 'verified';
  const [tokenCount, setTokenCount] = useState(0);
  void kycDisabled; // Used for UI disabled state

  useEffect(()=>{
    (async()=>{
      try { const data = await fetchRiders(); setRiders(data as any); } catch(e){ console.warn('Failed to load riders', e); }
      try { const s = await fetchSchedules(); setSchedules(s); } catch(e){ console.warn('Failed to load schedules', e); }
      try { const tokens = await getMyTokens(); setTokenCount(tokens?.length || 0); } catch(e){ console.warn('Failed to load tokens', e); }
      try { 
        setLoadingRides(true);
        const ridesData = await fetchRides(10); 
        setRides(ridesData?.rides || []); 
      } catch(e){ 
        console.warn('Failed to load rides', e); 
      } finally {
        setLoadingRides(false);
      }
    })();
  },[]);

  const handleInitiatePayout = async () => {
    try {
      setInitiatingPayout(true);
      // Get all tokens to distribute to - in production, backend would fetch all tokens
      const allTokens = await getMyTokens();
      if (!allTokens || allTokens.length === 0) {
        window.dispatchEvent(new CustomEvent('app:toast', { 
          detail: { type: 'warning', title: 'No Tokens', message: 'No tokenized assets to distribute revenue to' } 
        }));
        return;
      }
      
      const tokenIds = allTokens.map(t => t.tokenId);
      await initiatePayout({
        tokenIds,
        totalRevenue,
        period: payoutPeriod,
        description: payoutDescription,
      });

      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { type: 'success', title: 'Payout Initiated', message: `₦${totalRevenue.toLocaleString()} distributed to ${tokenIds.length} token holders` } 
      }));
      setShowPayoutModal(false);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { type: 'danger', title: 'Payout Failed', message: (err as any).message } 
      }));
    } finally {
      setInitiatingPayout(false);
    }
  };

  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'In Use' || a.status === 'Available').length;
  const totalSwaps = assets.reduce((sum, a) => sum + a.swaps, 0);
  const avgSOH = totalAssets ? (assets.reduce((sum, a) => sum + a.soh, 0) / totalAssets).toFixed(1) : '0';
  const dailySwaps = assets.reduce((sum, a) => sum + a.dailySwaps, 0);

  const assetsByType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maintenanceAssets = assets.filter(a => a.status === 'Maintenance');
  const lowSOHAssets = assets.filter(a => a.soh < 75);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(filter.toLowerCase()) || a.model.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h2 fw-bold mb-1">Fleet Operations</h1>
            {demoMode && <span className="badge bg-warning text-dark" title="Demo Mode active">DEMO</span>}
          </div>
          <p className="text-muted mb-0">Real-time operational overview & controls</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilter(''); setStatusFilter(''); }}>Clear Filters</button>
        </div>
      </div>

      <RoleCapabilities />

      <div className="row g-3 mb-4">
        <MetricCard title="Total Assets" value={totalAssets.toString()} icon="bi-box-seam" color="primary" />
        <MetricCard title="Active Assets" value={activeAssets.toString()} icon="bi-play-circle" color="success" />
        <MetricCard title="Total Swaps" value={totalSwaps.toLocaleString()} icon="bi-shuffle" color="indigo" />
        <MetricCard title="Avg SOH" value={`${avgSOH}%`} icon="bi-battery-half" color="warning" />
        <MetricCard title="Daily Swaps" value={dailySwaps.toString()} icon="bi-lightning" color="info" />
      </div>

      {/* Revenue Distribution Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h5 className="mb-0"><i className="bi bi-cash-stack me-2"></i>Revenue Distribution</h5>
        </div>
        <div className="card-body">
          {kycDisabled && (
            <div className="alert alert-warning d-flex align-items-start">
              <i className="bi bi-shield-exclamation fs-4 me-3"/>
              <div>
                <div className="fw-semibold">KYC verification required to initiate payouts</div>
                <div className="small">{kycStatus === 'pending' && 'Complete KYC to proceed.'}
                {kycStatus === 'submitted' && 'Your KYC is under review.'}
                {kycStatus === 'rejected' && 'KYC rejected. Please resubmit.'}</div>
                <div className="mt-2">
                  <button className="btn btn-sm btn-primary" onClick={onOpenKyc}>Open KYC</button>
                </div>
              </div>
            </div>
          )}
          <div className="row align-items-center">
            <div className="col-md-8">
              <p className="mb-2">Distribute revenue to all token holders based on their ownership percentage.</p>
              <div className="d-flex gap-3 flex-wrap">
                <div>
                  <small className="text-muted d-block">Total Tokenized Assets</small>
                  <strong className="fs-5">{tokenCount}</strong>
                </div>
                <div>
                  <small className="text-muted d-block">Monthly Revenue</small>
                  <strong className="fs-5 text-success">₦{totalRevenue.toLocaleString()}</strong>
                </div>
                <div>
                  <small className="text-muted d-block">Distribution Period</small>
                  <strong className="fs-5">{payoutPeriod}</strong>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button 
                className="btn btn-success btn-lg" 
                onClick={() => setShowPayoutModal(true)}
                disabled={tokenCount === 0 || kycDisabled}
                title={kycDisabled ? 'KYC verification required' : (tokenCount === 0 ? 'No tokens minted yet' : '')}
              >
                <i className="bi bi-send me-2"></i>
                {kycDisabled ? 'KYC Needed' : 'Initiate Payout'}
              </button>
              {tokenCount === 0 && (
                <small className="d-block text-muted mt-2">No tokens minted yet</small>
              )}
              {kycDisabled && (
                <small className="d-block text-muted mt-2">Complete KYC to enable payout initiation.</small>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Panel */}
      <div className="mb-4">
        <LiveTelemetryPanel />
      </div>

      {/* Recent Rides Section */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0"><i className="bi bi-speedometer2 me-2 text-info"></i>Recent Rides</h5>
        </div>
        <div className="card-body">
          {loadingRides ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0 small">Loading rides...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-3 text-muted">
              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
              <p className="mb-0">No ride data available</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ride ID</th>
                    <th>Vehicle</th>
                    <th>Distance</th>
                    <th>Battery</th>
                    <th>Swaps</th>
                    <th>Revenue</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map(ride => (
                    <tr key={ride.id}>
                      <td className="fw-bold text-primary">#{ride.id}</td>
                      <td>V-{ride.vehicle_id}</td>
                      <td>{ride.distance_km.toFixed(2)} km</td>
                      <td>
                        <span className={`badge ${ride.battery_end < 20 ? 'bg-danger' : ride.battery_end < 50 ? 'bg-warning' : 'bg-success'}`}>
                          {ride.battery_start}% → {ride.battery_end}%
                        </span>
                      </td>
                      <td>
                        {ride.swaps_after > ride.swaps_before ? (
                          <span className="badge bg-info">+{ride.swaps_after - ride.swaps_before}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {ride.revenue ? (
                          <div>
                            <div className="fw-bold text-success">${ride.revenue.gross.toFixed(2)}</div>
                            <small className="text-muted">I: ${ride.revenue.investor_roi.toFixed(2)} | D: ${ride.revenue.rider_wages.toFixed(2)}</small>
                          </div>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">{new Date(ride.ended_at).toLocaleString()}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3"><i className="bi bi-diagram-3 me-2"></i>Fleet Composition</h5>
              {Object.entries(assetsByType).length === 0 ? <p className="text-muted small mb-0">No assets</p> : (
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(assetsByType).map(([type, count]) => (
                    <span key={type} className="badge rounded-pill text-bg-light border">
                      <span className="fw-semibold me-1">{count}</span>{type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3"><i className="bi bi-funnel me-2"></i>Filters</h5>
              <div className="row g-2">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                    <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search by ID or model" className="form-control" />
                  </div>
                </div>
                <div className="col-md-6">
                  <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="form-select">
                    <option value="">Filter by status</option>
                    <option>Available</option>
                    <option>In Use</option>
                    <option>Charging</option>
                    <option>Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="small text-muted mt-2">Showing {filteredAssets.length} of {assets.length} assets</div>
            </div>
          </div>
        </div>
      </div>

      {(maintenanceAssets.length > 0 || lowSOHAssets.length > 0) && (
        <div className="alert alert-warning border shadow-sm mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-4 me-3"></i>
            <div className="flex-grow-1">
              <h5 className="mb-2">Attention Required</h5>
              {maintenanceAssets.length > 0 && (
                <p className="mb-2 small">Maintenance: {maintenanceAssets.map(a=>a.id).join(', ')}</p>
              )}
              {lowSOHAssets.length > 0 && (
                <p className="mb-0 small">Low SOH (&lt;75%): {lowSOHAssets.map(a=>`${a.id} (${a.soh}%)`).join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0"><i className="bi bi-grid me-2"></i>Fleet Inventory</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={()=>{ setFilter(''); setStatusFilter(''); }}><i className="bi bi-x-circle me-1"></i>Reset</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>SOH</th>
                  <th>Swaps</th>
                  <th>Daily</th>
                  <th>Value (₦)</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className={asset.status === 'Maintenance' ? 'table-danger' : asset.soh < 75 ? 'table-warning' : ''}>
                    <td className="fw-semibold">{asset.id}<div className="small text-muted">{asset.model}</div></td>
                    <td><span className="badge text-bg-secondary">{asset.type}</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <StatusBadge status={asset.status} />
                        {riders.find(r=> (r as any).assigned_asset_id === asset.id) && (
                          <span className="badge text-bg-light border">
                            <i className="bi bi-person-badge me-1"/>
                            {riders.find(r=> (r as any).assigned_asset_id === asset.id)?.name}
                            <button className="btn btn-sm btn-link text-danger ms-2 p-0" onClick={async()=>{ try{ const rr = riders.find(r=> (r as any).assigned_asset_id === asset.id)!; await unassignRider(Number((rr as any).id)); const refreshed = await fetchRiders(); setRiders(refreshed as any); window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Rider', message: 'Unassigned successfully' } })); }catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Unassign failed', message: (e as any).message || 'Error' } })); }}} title="Unassign">
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{minWidth:'120px'}}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{height:'8px'}}>
                          <div className={`progress-bar ${asset.soh < 50 ? 'bg-danger' : asset.soh < 75 ? 'bg-warning' : 'bg-success'}`} style={{width:`${asset.soh}%`}} />
                        </div>
                        <span className="small fw-semibold">{asset.soh}%</span>
                      </div>
                    </td>
                    <td>{asset.swaps.toLocaleString()}</td>
                    <td>{asset.dailySwaps}</td>
                    <td>₦{asset.originalValue.toLocaleString()}</td>
                    <td className="text-center" style={{minWidth:'220px'}}>
                      <div className="btn-group btn-group-sm" role="group">
                        <button className="btn btn-outline-success" disabled={!onSimulateSwap} onClick={()=>onSimulateSwap?.(asset.id)} title="Simulate Swap"><i className="bi bi-shuffle"></i></button>
                        <button className="btn btn-outline-warning" disabled={!onSimulateCharge} onClick={()=>onSimulateCharge?.(asset.id)} title="Simulate Charge"><i className="bi bi-battery-charging"></i></button>
                        <button className="btn btn-outline-secondary" onClick={()=>onUpdateStatus?.(asset.id, asset.status === 'Maintenance' ? 'Available' : 'Maintenance')} title="Toggle Maintenance"><i className="bi bi-tools"></i></button>
                        <button className="btn btn-outline-primary" onClick={()=>{ setSelectedAsset(asset); setShowAssignModal(true); }} title="Assign Rider"><i className="bi bi-person-plus"></i></button>
                        <button className="btn btn-outline-info" onClick={()=>{ setSelectedAsset(asset); setShowScheduleModal(true); setScheduleType('swap'); }} title="Schedule"><i className="bi bi-calendar-event"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-5">
                      <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                      No assets match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-muted">Page {page} of {Math.max(1, totalPages)}</div>
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-secondary" disabled={page<=1} onClick={()=>onChangePage?.(page-1)}>Prev</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={page>=totalPages} onClick={()=>onChangePage?.(page+1)}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Listing */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0"><i className="bi bi-calendar3 me-2"></i>Upcoming Schedules</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={async()=>{ const s = await fetchSchedules(); setSchedules(s); }}>
              <i className="bi bi-arrow-clockwise me-1"/>Refresh
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>When (UTC)</th>
                  <th>Status</th>
                  <th>Rider</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted">No upcoming schedules</td></tr>
                )}
                {schedules.map(s => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.assetId}</td>
                    <td><span className={`badge text-bg-${s.type==='swap'?'info':'warning'}`}>{s.type}</span></td>
                    <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                    <td><span className={`badge text-bg-${s.status==='pending'?'secondary': s.status==='completed'?'success':'danger'}`}>{s.status}</span></td>
                    <td>{s.riderId ?? '-'}</td>
                    <td className="small text-muted">{s.note ?? '-'}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-success" disabled={s.status!=='pending'} onClick={async()=>{ const upd = await updateScheduleStatus(s.id, 'completed'); setSchedules(prev=>prev.map(x=> x.id===s.id? upd: x)); }} title="Mark Complete"><i className="bi bi-check2-circle"/></button>
                        <button className="btn btn-outline-danger" disabled={s.status!=='pending'} onClick={async()=>{ const upd = await updateScheduleStatus(s.id, 'cancelled'); setSchedules(prev=>prev.map(x=> x.id===s.id? upd: x)); }} title="Cancel"><i className="bi bi-x-circle"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mb-4 d-flex gap-2">
        <button disabled={downloading} className="btn btn-sm btn-outline-success" onClick={async()=>{
          try { setDownloading(true); const blob = await exportAssetsCsv(); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='assets.csv'; a.click(); URL.revokeObjectURL(url); window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Export', message: 'Assets CSV downloaded' } })); } catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Export failed', message: (e as any).message || 'Error' } })); } finally { setDownloading(false); }
        }}><i className="bi bi-download me-1"></i>{downloading? 'Exporting...' : 'Export CSV'}</button>
      </div>

      {showAssignModal && selectedAsset && (
        <div className="modal d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-plus me-2"/>Assign Rider to {selectedAsset.id}</h5>
                <button type="button" className="btn-close" onClick={()=>setShowAssignModal(false)}></button>
              </div>
              <div className="modal-body">
                <select className="form-select" value={selectedRiderId} onChange={e=>setSelectedRiderId(Number(e.target.value))}>
                  <option value="">Select Rider</option>
                  {riders.map(r=> <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>setShowAssignModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={!selectedRiderId} onClick={async()=>{
                  try { await assignRider(selectedRiderId!, selectedAsset.id); window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Rider', message: 'Assigned successfully' } })); } catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Assign failed', message: (e as any).message || 'Error' } })); } finally { setShowAssignModal(false); }
                }}>Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && selectedAsset && (
        <div className="modal d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-calendar-event me-2"/>Schedule {scheduleType==='swap' ? 'Swap' : 'Charge'} for {selectedAsset.id}</h5>
                <button type="button" className="btn-close" onClick={()=>setShowScheduleModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={scheduleType} onChange={e=>setScheduleType(e.target.value as any)}>
                    <option value="swap">Swap</option>
                    <option value="charge">Charge</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">When (UTC)</label>
                  <input type="datetime-local" className="form-control" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Optional Rider</label>
                  <select className="form-select" value={selectedRiderId} onChange={e=>setSelectedRiderId(e.target.value? Number(e.target.value): undefined)}>
                    <option value="">None</option>
                    {riders.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Note</label>
                  <textarea className="form-control" value={scheduleNote} onChange={e=>setScheduleNote(e.target.value)} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>setShowScheduleModal(false)}>Cancel</button>
                <button className="btn btn-info" disabled={!scheduleTime} onClick={async()=>{
                  try { scheduleType==='swap' ? await scheduleSwap(selectedAsset.id, scheduleTime, selectedRiderId, scheduleNote) : await scheduleCharge(selectedAsset.id, scheduleTime, selectedRiderId, scheduleNote); window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Schedule', message: 'Operation scheduled' } })); } catch(e){ window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Schedule failed', message: (e as any).message || 'Error' } })); } finally { setShowScheduleModal(false); }
                }}>Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Distribution Modal */}
      {showPayoutModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h5 className="modal-title">
                  <i className="bi bi-cash-stack me-2"></i>Distribute Revenue to Token Holders
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayoutModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Revenue Distribution:</strong> Funds will be distributed proportionally to all token holders based on their ownership percentage.
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Distribution Period</label>
                  <input 
                    type="month" 
                    className="form-control form-control-lg" 
                    value={payoutPeriod} 
                    onChange={e => setPayoutPeriod(e.target.value)}
                  />
                  <small className="text-muted">Select the month for this revenue distribution</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Total Revenue Amount (₦)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-lg" 
                    value={totalRevenue} 
                    onChange={e => setTotalRevenue(parseInt(e.target.value))}
                    min="1000"
                    step="1000"
                  />
                  <small className="text-muted">Total revenue generated from fleet operations</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <textarea 
                    className="form-control" 
                    value={payoutDescription} 
                    onChange={e => setPayoutDescription(e.target.value)}
                    rows={2}
                    placeholder="E.g., Monthly revenue from battery swaps and EV rides"
                  />
                </div>

                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="mb-3">Distribution Summary</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted d-block">Total Revenue</small>
                        <strong className="fs-5 text-success">₦{totalRevenue.toLocaleString()}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Token Holders</small>
                        <strong className="fs-5 text-primary">{tokenCount}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Distribution Method</small>
                        <strong>Proportional to ownership %</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning mt-3 mb-0">
                  <small><i className="bi bi-exclamation-triangle me-2"></i>
                    This action will distribute ₦{totalRevenue.toLocaleString()} to all investors. Transactions are recorded on the blockchain via TrovoTech.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPayoutModal(false)}>Cancel</button>
                <button 
                  className="btn btn-success btn-lg" 
                  onClick={handleInitiatePayout} 
                  disabled={initiatingPayout || totalRevenue <= 0}
                >
                  <i className="bi bi-send-check me-2"></i>
                  {initiatingPayout ? 'Processing...' : `Distribute ₦${totalRevenue.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="col">
    <div className={`card border-0 shadow-sm h-100 bg-${color} text-white`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-uppercase small mb-2 opacity-75">{title}</h6>
            <div className="display-6 fw-bold">{value}</div>
          </div>
          <div className="bg-white bg-opacity-25 p-3 rounded-circle">
            <i className={`bi ${icon} fs-3`}></i>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string,string> = {
    'Available':'success',
    'In Use':'primary',
    'Charging':'warning',
    'Maintenance':'danger'
  };
  const variant = map[status] || 'secondary';
  return <span className={`badge text-bg-${variant}`}>{status}</span>;
};

