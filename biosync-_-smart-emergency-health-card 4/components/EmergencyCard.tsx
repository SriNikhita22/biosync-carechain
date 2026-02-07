
import React, { useEffect, useRef } from 'react';
import { UserHealthData } from '../types';

interface EmergencyCardProps {
  data: UserHealthData;
  theme: 'dark' | 'light';
}

declare const QRCode: any;

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ data, theme }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && typeof QRCode !== 'undefined') {
      qrRef.current.innerHTML = '';

      const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '').replace(/\/$/, '');
      
      const params = new URLSearchParams({
        n: data.fullName || 'Unknown',
        a: (data.age || 'N/A').toString(),
        g: data.gender || 'N/A',
        bg: data.bloodGroup || '--',
        al: data.allergies || 'None',
        cc: data.chronicDiseases || 'None',
        m: data.currentMedications || 'None',
        s: data.pastSurgeries || 'None',
        ec: data.emergencyContact || '',
        ht: (data.height || 'N/A').toString(),
        wt: (data.weight || 'N/A').toString(),
        bmi: (data.bmi || 'N/A').toString(),
        alc: data.alcoholUse || 'No',
        drg: data.drugUse || 'No',
        pnd: data.painkillerDependence || 'No',
        smk: data.smokingTobacco || 'No'
      });

      const cardUrl = `${baseUrl}/rescue.html?${params.toString()}`;

      new QRCode(qrRef.current, {
        text: cardUrl,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, [data]);

  const isDark = theme === 'dark';

  return (
    <div className={`w-full max-w-2xl mx-auto aspect-[1.586/1] ${isDark ? 'bg-[#0a0f1e]' : 'bg-white'} rounded-[1.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative border-2 ${isDark ? 'border-white/10' : 'border-slate-200'} transition-all hover:scale-[1.01]`}>
      
      <div className="absolute top-0 left-0 right-0 h-2 bg-red-600 z-20"></div>
      
      <div className="flex h-full">
        <div className="w-1/4 bg-red-600 flex flex-col items-center justify-between py-8 px-2 text-white relative">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center mb-4 shadow-xl">
              {data.profileImage ? (
                <img src={data.profileImage} alt="User" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 text-center">Identity Verified</span>
          </div>

          <div className="text-center">
            <div className="text-5xl font-black leading-none drop-shadow-md">{data.bloodGroup}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-90">Blood Group</div>
          </div>

          <div className="rotate-[-90deg] origin-center whitespace-nowrap opacity-40 absolute left-[-40px] bottom-24 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">BIOSYNC SECURE ID</span>
          </div>
        </div>

        <div className="flex-1 p-8 flex flex-col justify-between relative">
          <div className="flex justify-between items-start">
            <div className="flex-1">
               <div className="flex items-center space-x-2 mb-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Medical Alert Profile</span>
               </div>
               <h4 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'} leading-none tracking-tighter mb-4 uppercase truncate max-w-[280px]`}>
                 {data.fullName || 'Anonymous'}
               </h4>
               
               <div className="flex items-center space-x-2 text-red-600 font-black text-xl mb-8">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                   <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                 </svg>
                 <span>{data.emergencyContact}</span>
               </div>

               <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                 <div>
                   <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Critical Allergies</span>
                   <span className={`block font-black text-sm ${isDark ? 'text-white/90' : 'text-slate-700'} uppercase break-words line-clamp-1`}>{data.allergies || 'NONE'}</span>
                 </div>
                 <div>
                   <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Chronic Status</span>
                   <span className={`block font-black text-sm ${isDark ? 'text-white/90' : 'text-slate-700'} uppercase break-words line-clamp-1`}>{data.chronicDiseases || 'NONE'}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="border-t border-slate-400/10 pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>Protocol: BioSync 2.4.1</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>Card Issued: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>BMI: {data.bmi || '--'}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>H: {data.height || '--'} W: {data.weight || '--'}</span>
            </div>
          </div>
        </div>

        <div className={`w-[200px] ${isDark ? 'bg-white/5' : 'bg-slate-50'} border-l ${isDark ? 'border-white/5' : 'border-slate-100'} flex flex-col items-center justify-center p-6 text-center`}>
           <div className="relative group">
              <div className="absolute -inset-1 bg-red-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative p-3 bg-white rounded-[1.8rem] shadow-2xl ring-1 ring-slate-200">
                <div ref={qrRef} className="qr-container w-[140px] h-[140px] flex items-center justify-center"></div>
              </div>
           </div>
           
           <div className="mt-6">
             <div className="flex items-center justify-center space-x-2 text-red-600 animate-pulse mb-1">
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scan for Rescue</span>
             </div>
             <p className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Verified Medical ID</p>
           </div>
        </div>
      </div>
    </div>
  );
};
