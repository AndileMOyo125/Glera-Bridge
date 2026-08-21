import React, { useState } from 'react';
import { ActivityItem } from '../types';
import { History, Shield, Sliders, PauseCircle, PlayCircle, AlertOctagon, CheckCircle2, UserPlus, Server } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  onRefresh: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onRefresh }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SETTINGS':
        return <Sliders className="w-4 h-4 text-blue-400" />;
      case 'PAUSE':
        return <PauseCircle className="w-4 h-4 text-amber-400" />;
      case 'RESUME':
        return <PlayCircle className="w-4 h-4 text-emerald-400" />;
      case 'CLOSE_ALL':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'CONNECT':
        return <Server className="w-4 h-4 text-emerald-400" />;
      case 'REGISTER':
      case 'CONNECTION_CREATED':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter(a => a.eventType === filter);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[#111722] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Audit Log</div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Activity & Event History</h2>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
          >
            Refresh Feed
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Detailed timeline of remote control commands, strategy modifications, and MetaTrader 5 connection states.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['ALL', 'SETTINGS', 'PAUSE', 'RESUME', 'CLOSE_ALL', 'CONNECT'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
              filter === f
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {f === 'ALL' ? 'All Events' : f}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-[#111722] border border-white/10 rounded-2xl p-8 text-center">
          <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-white">No Activity Records</h4>
          <p className="text-xs text-slate-400 mt-1">Actions and connection events will be logged here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map(item => (
            <div
              key={item.id}
              className="bg-[#111722] border border-white/10 rounded-xl p-3.5 flex items-start gap-3 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                {getEventIcon(item.eventType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-white truncate">{item.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                {item.detail && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words font-mono text-[11px]">
                    {item.detail}
                  </p>
                )}
                {item.accountId && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                    Account #{item.accountId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
