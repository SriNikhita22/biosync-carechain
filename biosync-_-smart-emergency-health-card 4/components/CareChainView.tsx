
import React, { useState, useEffect } from 'react';
import { UserHealthData, TimelineEvent, TimelineCategory } from '../types';
import { getCareChainSummary } from '../services/geminiService';

interface CareChainViewProps {
  data: UserHealthData;
  theme: 'dark' | 'light';
  onBack: () => void;
}

export const CareChainView: React.FC<CareChainViewProps> = ({ data, theme, onBack }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<'All' | TimelineCategory>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastTimelineUpdate, setLastTimelineUpdate] = useState<string | null>(null);
  
  // Viewer State for Attachments
  const [viewingFile, setViewingFile] = useState<{url: string, name: string} | null>(null);

  // Form State
  const [newEntry, setNewEntry] = useState<Partial<TimelineEvent>>({
    category: 'Labs',
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    notes: '',
    fileUrl: undefined,
    fileName: undefined
  });

  const formatMedicalTimestamp = (isoString?: string) => {
    if (!isoString) return 'Never';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString; // Fallback if already formatted
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} - ${timePart}`;
  };

  const getNowTimestamp = () => {
    return formatMedicalTimestamp(new Date().toISOString());
  };

  useEffect(() => {
    const saved = localStorage.getItem('biosync_timeline');
    const ts = localStorage.getItem('biosync_timeline_last_updated');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) { console.error("History parse error", e); }
    }
    if (ts) setLastTimelineUpdate(ts);
  }, []);

  useEffect(() => {
    async function fetchSummary() {
      if (events.length === 0) {
        setSummary("• No records logged\n• Timeline empty\n• Log a new event");
        return;
      }
      setLoadingSummary(true);
      const res = await getCareChainSummary(events);
      setSummary(res);
      setLoadingSummary(false);
    }
    fetchSummary();
  }, [events]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Please limit attachments to 2MB for local storage performance.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewEntry(prev => ({ 
          ...prev, 
          fileUrl: event.target?.result as string, 
          fileName: file.name 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = getNowTimestamp();
    
    let updatedEvents;
    if (editingId) {
      updatedEvents = events.map(ev => ev.id === editingId ? {
        ...ev,
        ...newEntry,
        lastModified: timestamp
      } as TimelineEvent : ev);
    } else {
      const entry: TimelineEvent = {
        id: Date.now().toString(),
        title: newEntry.title || 'Untitled Record',
        category: newEntry.category as TimelineCategory,
        date: newEntry.date || new Date().toISOString().split('T')[0],
        summary: newEntry.summary || '',
        notes: newEntry.notes || '',
        fileUrl: newEntry.fileUrl,
        fileName: newEntry.fileName,
        lastModified: timestamp
      };
      updatedEvents = [entry, ...events];
    }

    updatedEvents = updatedEvents.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    setEvents(updatedEvents);
    setLastTimelineUpdate(timestamp);
    localStorage.setItem('biosync_timeline', JSON.stringify(updatedEvents));
    localStorage.setItem('biosync_timeline_last_updated', timestamp);
    
    setNewEntry({ 
      category: 'Labs', 
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      summary: '', 
      notes: '',
      fileUrl: undefined,
      fileName: undefined
    });
    setShowModal(false);
    setEditingId(null);
  };

  const handleEdit = (event: TimelineEvent) => {
    setNewEntry(event);
    setEditingId(event.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Permanent Wipe: Delete this record? This cannot be undone.")) return;
    const updated = events.filter(e => e.id !== id);
    const ts = getNowTimestamp();
    setEvents(updated);
    setLastTimelineUpdate(ts);
    localStorage.setItem('biosync_timeline', JSON.stringify(updated));
    localStorage.setItem('biosync_timeline_last_updated', ts);
  };

  const filteredEvents = events.filter(e => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = e.title.toLowerCase().includes(search) || 
                          (e.notes?.toLowerCase().includes(search)) || 
                          (e.summary?.toLowerCase().includes(search));
    const matchesFilter = filter === 'All' || e.category === filter;
    return matchesSearch && matchesFilter;
  });

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-white/80' : 'text-black/80';
  const cardBg = isDark ? 'glass bg-white/5' : 'glass bg-white';
  const inputClass = isDark 
    ? "w-full p-4 rounded-2xl border-2 border-white/10 bg-black/40 text-white outline-none focus:border-red-500 transition-all font-bold text-[14px]"
    : "w-full p-4 rounded-2xl border-2 border-slate-300 bg-white text-black outline-none focus:border-red-500 transition-all font-bold text-[14px]";

  return (
    <div className="animate-in slide-in-from-right duration-500 relative pb-40 px-2 print:p-0">
      {/* Breadcrumb / Back Navigation */}
      <button 
        onClick={onBack}
        className={`flex items-center space-x-2 mb-6 ${isDark ? 'text-white/40 hover:text-red-500' : 'text-slate-400 hover:text-red-600'} transition-colors group print:hidden`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-[12px] font-black uppercase tracking-widest">Back to Dashboard</span>
      </button>

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8 print:hidden">
        <div>
          <h2 className={`text-[32px] font-black ${textColor} tracking-tight uppercase leading-none`}>CARECHAIN</h2>
          <div className={`text-[12px] ${subTextColor} font-medium mt-2 uppercase tracking-wide flex flex-wrap items-center gap-x-4`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
              <span className="opacity-60">Profile Updated:</span>
              <span className="font-black">{formatMedicalTimestamp(data.lastUpdated)}</span>
            </div>
            {lastTimelineUpdate && (
              <div className={`border-l pl-4 ${isDark ? 'border-white/20' : 'border-slate-300'} flex items-center gap-2`}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="opacity-60">Timeline Sync:</span>
                <span className="font-black">{lastTimelineUpdate}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-3 w-full lg:w-auto">
          <button onClick={() => window.print()} className={`flex-1 lg:flex-none px-6 py-2.5 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'} font-black rounded-xl hover:opacity-80 transition-all flex items-center justify-center space-x-2`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Print Report</span>
          </button>
          <button onClick={onBack} className="flex-1 lg:flex-none px-6 py-2.5 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-xl flex items-center justify-center space-x-2">
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8 relative">
          
          <div className="absolute left-6 md:left-8 top-10 bottom-0 w-[3px] bg-gradient-to-b from-red-600 via-slate-400/20 to-transparent z-0 hidden md:block"></div>

          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
            <div className="flex flex-wrap gap-2">
              {['All', 'Labs', 'Surgeries', 'Prescriptions'].map((cat) => (
                <button key={cat} onClick={() => setFilter(cat as any)} className={`px-4 py-1.5 rounded-xl font-bold text-[14px] uppercase transition-all border-2 ${filter === cat ? 'bg-red-600 text-white border-red-600' : `${cardBg} ${textColor} border-slate-400/10`}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
               <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className={`p-2.5 rounded-xl border-2 ${isDark ? 'border-white/10' : 'border-slate-300'} ${textColor} hover:bg-red-500/10 transition-colors`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
               </button>
               <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} max-w-[150px] h-10`} />
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-12 relative z-10">
            {filteredEvents.length === 0 ? (
              <div className="glass p-20 rounded-[3rem] text-center border-dashed border-2 border-slate-400/20">
                <p className={`text-xl font-black ${subTextColor} uppercase tracking-tight`}>No records found</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="relative pl-12 md:pl-20">
                  <div className={`absolute left-1 md:left-4 top-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl z-10 glass border-2 ${
                    event.category === 'Labs' ? 'border-blue-500/50' : event.category === 'Surgeries' ? 'border-purple-500/50' : 'border-green-500/50'
                  }`}>
                    {event.category === 'Labs' ? '📈' : event.category === 'Surgeries' ? '🏥' : '💊'}
                  </div>
                  
                  <div className={`${cardBg} p-8 rounded-[2.5rem] shadow-xl relative border border-slate-400/10 group`}>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border border-slate-400/30 ${subTextColor}`}>{event.category}</span>
                          <span className={`text-red-600 text-[12px] font-black`}>{event.date}</span>
                        </div>
                        <h4 className={`text-[22px] font-black ${textColor} mt-3 uppercase leading-none`}>{event.title}</h4>
                      </div>
                      <div className="flex space-x-2 print:hidden">
                        <button onClick={() => handleEdit(event)} className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    <p className={`text-[14px] ${textColor} font-bold uppercase mb-4`}>{event.summary}</p>
                    {event.notes && <p className={`text-[13px] ${subTextColor} italic mb-4 opacity-60`}>"{event.notes}"</p>}

                    <div className="flex items-center justify-between mt-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                         Record Sync: {event.lastModified || 'Initial Log'}
                      </div>
                      
                      {event.fileUrl && (
                        <div className="flex space-x-3 print:hidden">
                          <button 
                            onClick={() => setViewingFile({ url: event.fileUrl!, name: event.fileName || 'document' })} 
                            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-blue-700 transition-all flex items-center space-x-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span>View</span>
                          </button>
                          <a 
                            href={event.fileUrl} 
                            download={event.fileName || `BioSync_Record_${event.id}.png`}
                            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all flex items-center space-x-2 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span>Get</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Health Snapshot */}
        <div className="space-y-10 print:hidden">
          <div className={`glass p-10 rounded-[3rem] border-2 border-red-600/30 sticky top-24 shadow-xl`}>
            <div className="flex items-center space-x-3 mb-8">
              <span className="flex h-4 w-4 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
              </span>
              <h3 className="text-red-600 font-black text-sm uppercase tracking-widest">Health Snapshot</h3>
            </div>
            
            {/* Last Updated Widget */}
            <div className={`mb-8 p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} border border-slate-400/10`}>
              <span className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Vault Integrity Status</span>
              <div className="flex items-center justify-between">
                <span className={`text-[13px] font-black ${textColor}`}>LAST SYNC</span>
                <span className="text-[11px] font-black text-red-600 uppercase">{lastTimelineUpdate ? lastTimelineUpdate.split('-')[0].trim() : 'Never'}</span>
              </div>
            </div>

            <div className={`${textColor} text-[14px] font-bold uppercase space-y-3`}>
              {loadingSummary ? (
                <div className="space-y-4">
                  <div className="h-4 bg-slate-400/10 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-400/10 rounded animate-pulse w-5/6"></div>
                </div>
              ) : summary?.split('\n').map((line, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-red-600 mt-1">▶</span>
                  <p className="leading-tight">{line.replace('•', '').trim()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => { setEditingId(null); setNewEntry({ category: 'Labs', title: '', date: new Date().toISOString().split('T')[0], summary: '', notes: '', fileUrl: undefined, fileName: undefined }); setShowModal(true); }} 
        className="fixed bottom-12 right-12 bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center space-x-4 hover:scale-105 active:scale-95 transition-all z-[100] print:hidden pulse-fab"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" /></svg>
        <span className="font-black uppercase tracking-widest text-lg">Add Record</span>
      </button>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowModal(false)}></div>
          <div className={`${cardBg} w-full max-w-2xl p-10 md:p-14 rounded-[3.5rem] relative border-2 border-white/10 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className={`text-3xl font-black ${textColor} uppercase tracking-tight`}>{editingId ? 'Edit Record' : 'New Log'}</h3>
              <button onClick={() => setShowModal(false)} className="text-red-600 hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveEntry} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">Category</label>
                  <select value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value as TimelineCategory})} className={inputClass}>
                    <option value="Labs">Lab Result</option>
                    <option value="Surgeries">Surgery</option>
                    <option value="Prescriptions">Prescription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">Date</label>
                  <input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">Title</label>
                <input type="text" placeholder="e.g. CBC Panel, Cardiac Surgery" value={newEntry.title} onChange={e => setNewEntry({...newEntry, title: e.target.value})} className={inputClass} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">Summary</label>
                <textarea placeholder="Brief findings..." value={newEntry.summary} onChange={e => setNewEntry({...newEntry, summary: e.target.value})} className={`${inputClass} h-24 resize-none`} />
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">Attachment (Secure Local Only)</label>
                <div className="p-8 bg-black/10 rounded-2xl border-2 border-dashed border-slate-400/20 text-center hover:border-red-500/50 transition-colors group cursor-pointer relative">
                  {newEntry.fileUrl ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <span className={`block text-[14px] font-black uppercase tracking-widest ${textColor} truncate max-w-full mb-3`}>{newEntry.fileName}</span>
                      <button type="button" onClick={() => setNewEntry({...newEntry, fileUrl: undefined, fileName: undefined})} className="text-red-500 text-[10px] font-black uppercase hover:underline">Remove Attachment</button>
                    </div>
                  ) : (
                    <>
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-4 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                         <span className={`block text-[14px] font-black uppercase tracking-widest ${textColor} opacity-70`}>Attach Document / Image</span>
                         <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Max 2MB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-red-600 text-white font-black rounded-[2rem] text-2xl uppercase shadow-2xl hover:bg-red-700 transition-all active:scale-95">
                {editingId ? 'Update Record' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Internal File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setViewingFile(null)}></div>
          
          <div className="relative z-10 w-full max-w-5xl flex justify-between items-center mb-6 px-4">
            <div className="flex flex-col">
              <span className="text-white font-black uppercase tracking-widest text-sm">{viewingFile.name}</span>
              <span className="text-white/40 text-[10px] font-bold uppercase">BioSync Private Vault</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href={viewingFile.url} download={viewingFile.name} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-[12px] font-black uppercase transition-all">Download</a>
              <button onClick={() => setViewingFile(null)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl flex items-center space-x-2 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="text-[12px] font-black uppercase tracking-widest">Close</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-5xl h-[80vh] bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
            {viewingFile.url.startsWith('data:application/pdf') ? (
              <embed src={viewingFile.url} type="application/pdf" className="w-full h-full" />
            ) : (
              <img src={viewingFile.url} alt={viewingFile.name} className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fab-pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .pulse-fab {
          animation: fab-pulse 2s infinite;
        }
        @media print {
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};
