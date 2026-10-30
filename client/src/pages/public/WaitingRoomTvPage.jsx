import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Volume2, VolumeX, Maximize2, Users, Clock, AlertCircle } from 'lucide-react';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../context/SocketContext';
import './WaitingRoomTv.scss';

export const WaitingRoomTvPage = () => {
  const { clinicId = 'all', departmentId = 'all' } = useParams();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const res = await queueService.getDisplayData(clinicId, departmentId);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('[TV Display Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll fallback every 15s
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [clinicId, departmentId]);

  // Real-time socket listener
  useEffect(() => {
    if (socket) {
      const handleCalled = (payload) => {
        fetchData();
        if (audioEnabled) {
          playChime();
        }
      };
      socket.on('queue:patient-called', handleCalled);
      socket.on('queue:updated', fetchData);

      return () => {
        socket.off('queue:patient-called', handleCalled);
        socket.off('queue:updated', fetchData);
      };
    }
  }, [socket, audioEnabled]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unsupported');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="tv-display">
      {/* Top Header Bar */}
      <header className="tv-display__header">
        <div className="tv-display__brand">
          <div className="tv-display__logo-icon">
            <Activity size={28} color="#0F766E" />
          </div>
          <div>
            <h1>{data?.clinic?.name || 'Drittech Health Polyclinic'}</h1>
            <span>{data?.department?.name || 'Waiting-Room Display System'}</span>
          </div>
        </div>

        <div className="tv-display__controls">
          <button
            className={`tv-control-btn ${audioEnabled ? 'tv-control-btn--active' : ''}`}
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playChime();
            }}
            title={audioEnabled ? 'Audio Chime Enabled' : 'Enable Audio Chime'}
          >
            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{audioEnabled ? 'Chime On' : 'Chime Off'}</span>
          </button>

          <button className="tv-control-btn" onClick={toggleFullScreen} title="Toggle Full Screen">
            <Maximize2 size={20} />
            <span>Full Screen</span>
          </button>

          <div className="tv-clock">{time}</div>
        </div>
      </header>

      {/* Main Screen Layout */}
      <main className="tv-display__body">
        {/* Left: Prominently Featured Current Call */}
        <section className="tv-current-call">
          <span className="tv-current-call__tag">NOW CALLING</span>

          {data?.currentCalled ? (
            <div className="tv-current-call__card">
              <div className="tv-current-call__token">
                {data.currentCalled.tokenNumber}
              </div>

              <div className="tv-current-call__details">
                <div className="tv-detail-item">
                  <label>PLEASE PROCEED TO</label>
                  <h3>{data.currentCalled.roomNumber}</h3>
                </div>

                <div className="tv-detail-item">
                  <label>ATTENDING PHYSICIAN</label>
                  <h4>{data.currentCalled.doctorName}</h4>
                </div>

                <div className="tv-detail-item">
                  <label>DEPARTMENT</label>
                  <h4>{data.currentCalled.departmentName}</h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="tv-current-call__idle">
              <h3>All waiting patients being coordinated</h3>
              <p>Please take a seat. Your token number will appear here when called.</p>
            </div>
          )}
        </section>

        {/* Right: Recently Called Tokens & Queue Stats */}
        <aside className="tv-recent-section">
          <div className="tv-recent-section__header">
            <h3>Recently Called</h3>
            <div className="tv-waiting-count">
              <Users size={18} />
              <span>{data?.waitingCount || 0} in queue</span>
            </div>
          </div>

          <div className="tv-recent-list">
            {data?.recentlyCalled && data.recentlyCalled.length > 0 ? (
              data.recentlyCalled.map((item, idx) => (
                <div key={idx} className="tv-recent-card">
                  <div className="tv-recent-token">{item.tokenNumber}</div>
                  <div className="tv-recent-info">
                    <strong>{item.roomNumber}</strong>
                    <span>{item.departmentName} • {item.doctorName}</span>
                  </div>
                  <span className={`tv-status-badge tv-status-badge--${item.status}`}>
                    {item.status === 'called' ? 'Proceeding' : 'In Consult'}
                  </span>
                </div>
              ))
            ) : (
              <div className="tv-recent-empty">No recent calls recorded today</div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Instructions Ticker */}
      <footer className="tv-display__footer">
        <div className="tv-ticker">
          <AlertCircle size={20} color="#DDF7EE" />
          <span>
            {data?.announcement ||
              'Please watch the display screen. When your token is called, proceed promptly to the indicated room. Scan your token QR code to track live from your phone.'}
          </span>
        </div>
      </footer>
    </div>
  );
};
