
import React, { useState, useEffect, useRef } from 'react';
import { UserHealthData, BloodGroups, UsageStatus } from '../types';

interface RegistrationFormProps {
  initialData?: UserHealthData;
  onSave: (data: UserHealthData) => void;
  onCancel?: () => void;
  theme: 'dark' | 'light';
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ initialData, onSave, onCancel, theme }) => {
  const [formData, setFormData] = useState<Partial<UserHealthData>>(
    initialData || {
      fullName: '',
      bloodGroup: '',
      allergies: '',
      chronicDiseases: '',
      currentMedications: '',
      pastSurgeries: '',
      emergencyContact: '',
      gender: '',
      height: undefined,
      weight: undefined,
      bmi: undefined,
      age: undefined,
      profileImage: undefined,
      alcoholUse: 'No',
      drugUse: 'No',
      painkillerDependence: 'No',
      smokingTobacco: 'No'
    }
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateBMI = (h?: number, w?: number) => {
    if (h && w && h > 0) {
      const heightInMeters = h / 100;
      const bmi = w / (heightInMeters * heightInMeters);
      return parseFloat(bmi.toFixed(1));
    }
    return undefined;
  };

  useEffect(() => {
    const newBmi = calculateBMI(formData.height, formData.weight);
    if (newBmi !== formData.bmi) {
      setFormData(prev => ({ ...prev, bmi: newBmi }));
    }
  }, [formData.height, formData.weight]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Please select a blood group";
    const phoneDigits = (formData.emergencyContact || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) newErrors.emergencyContact = "Enter a valid 10-digit phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, profileImage: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...formData as UserHealthData, lastUpdated: new Date().toISOString() });
    }
  };

  const isDark = theme === 'dark';
  const labelText = isDark ? 'text-white/90' : 'text-slate-800';
  const inputBg = isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900';
  const iconBg = isDark ? 'bg-white/10 border-white/20' : 'bg-slate-200 border-slate-300';

  const inputClasses = (fieldName: string) => 
    `w-full px-4 py-4 rounded-xl border text-lg transition-all outline-none placeholder-gray-400 ${errors[fieldName] ? 'border-red-500 bg-red-500/10' : inputBg} focus:border-red-500 focus:ring-4 focus:ring-red-500/20`;
  
  const labelClasses = `flex items-center text-lg font-bold ${labelText} mb-3 px-1`;
  const iconContainerClasses = `w-10 h-10 ${iconBg} rounded-full flex items-center justify-center mr-3 flex-shrink-0 border`;

  const ToggleGroup = ({ label, value, options, onChange, criticalIf }: any) => {
    const isCritical = criticalIf === value;
    return (
      <div className="space-y-3">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>
        <div className="flex bg-black/10 rounded-xl p-1 border border-white/5">
          {options.map((opt: string) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 py-3 rounded-lg text-sm font-black transition-all ${
                value === opt 
                  ? (opt === criticalIf ? 'bg-red-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg') 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const hasAnyAddiction = formData.alcoholUse === 'Yes' || formData.drugUse === 'Yes' || formData.painkillerDependence === 'Yes' || formData.smokingTobacco === 'Yes';

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-500', text: 'text-blue-500' };
    if (bmi < 25) return { label: 'Normal', color: 'bg-green-500', text: 'text-green-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'bg-yellow-500', text: 'text-yellow-600' };
    return { label: 'Obese', color: 'bg-red-500', text: 'text-red-500' };
  };

  const bmiCat = getBMICategory(formData.bmi);

  return (
    <form onSubmit={handleSubmit} className="glass p-10 rounded-[2.5rem] shadow-2xl">
      <div className="flex flex-col items-center mb-12">
        <div className="relative group">
          <div 
            className={`relative w-40 h-40 rounded-full ${isDark ? 'bg-white/5 border-2 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-slate-100 border-2 border-slate-200 shadow-lg'} overflow-hidden flex items-center justify-center transition-all duration-300`}
          >
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-20 w-20 ${isDark ? 'text-white/20' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="flex space-x-2 mt-4">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${isDark ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              {formData.profileImage ? 'Edit Photo' : 'Add Photo'}
            </button>
            {formData.profileImage && (
              <button 
                type="button" 
                onClick={handleRemoveImage}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-md"
              >
                Remove
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}><div className={iconContainerClasses}>👤</div>Full Name *</label>
          <input type="text" className={inputClasses('fullName')} placeholder="John Doe" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
        </div>

        <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
           <div>
             <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Blood Group *</label>
             <select className={inputClasses('bloodGroup')} value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
               <option value="">Select</option>
               {Object.values(BloodGroups).map(g => <option key={g} value={g}>{g}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Age</label>
             <input type="number" className={inputClasses('age')} value={formData.age || ''} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })} />
           </div>
           <div>
             <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Height (cm)</label>
             <input type="number" className={inputClasses('height')} value={formData.height || ''} onChange={e => setFormData({ ...formData, height: parseFloat(e.target.value) || undefined })} />
           </div>
           <div>
             <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2">Weight (kg)</label>
             <input type="number" className={inputClasses('weight')} value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })} />
           </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}><div className={iconContainerClasses}>📊</div>BMI Calculation</label>
          <div className={`w-full p-6 rounded-xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Body Mass Index</span>
              <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.bmi || '--'}</span>
            </div>
            {bmiCat && (
              <div className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest text-white shadow-xl ${bmiCat.color}`}>
                {bmiCat.label}
              </div>
            )}
          </div>
          <p className="mt-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">Automatically calculated based on height and weight.</p>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}><div className={iconContainerClasses}>📞</div>Emergency Contact *</label>
          <input type="tel" className={inputClasses('emergencyContact')} placeholder="10-digit number" value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} />
        </div>

        <div className={`col-span-1 md:col-span-2 p-10 rounded-[3rem] border-2 transition-all ${hasAnyAddiction ? 'bg-red-600/5 border-red-600/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${hasAnyAddiction ? 'bg-red-600/20 text-red-500' : 'bg-slate-500/10 text-slate-500'}`}>🚬</div>
               <h3 className={`text-2xl font-black ${labelText} uppercase tracking-tight`}>Addiction History</h3>
            </div>
            {hasAnyAddiction && (
              <span className="bg-red-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-900/40">Critical Warning Active</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ToggleGroup 
              label="Alcohol Use" 
              value={formData.alcoholUse} 
              options={['Yes', 'No', 'Former']} 
              onChange={(v: UsageStatus) => setFormData({...formData, alcoholUse: v})} 
              criticalIf="Yes"
            />
            <ToggleGroup 
              label="Drug Use" 
              value={formData.drugUse} 
              options={['Yes', 'No', 'Former']} 
              onChange={(v: UsageStatus) => setFormData({...formData, drugUse: v})} 
              criticalIf="Yes"
            />
            <ToggleGroup 
              label="Tobacco / Smoking" 
              value={formData.smokingTobacco} 
              options={['Yes', 'No', 'Former']} 
              onChange={(v: UsageStatus) => setFormData({...formData, smokingTobacco: v})} 
              criticalIf="Yes"
            />
            <ToggleGroup 
              label="Painkiller Dependence" 
              value={formData.painkillerDependence} 
              options={['Yes', 'No']} 
              onChange={(v: 'Yes' | 'No') => setFormData({...formData, painkillerDependence: v})} 
              criticalIf="Yes"
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}><div className={iconContainerClasses}>⚠️</div>Allergies</label>
          <textarea className={inputClasses('allergies')} rows={2} placeholder="e.g. Peanuts, Penicillin" value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}><div className={iconContainerClasses}>🩸</div>Chronic Conditions</label>
          <textarea className={inputClasses('chronicDiseases')} rows={2} placeholder="e.g. Diabetes Type 2" value={formData.chronicDiseases} onChange={e => setFormData({ ...formData, chronicDiseases: e.target.value })} />
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button type="submit" className="flex-1 bg-red-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center space-x-3 text-xl">
          <span>Save & Generate Card</span>
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`px-10 py-5 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'} font-bold rounded-2xl hover:opacity-80 transition-all text-lg`}>Cancel</button>
        )}
      </div>
    </form>
  );
};
