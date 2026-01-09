'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AgeVerificationModalProps {
  user: any;
  onVerify: () => void;
}

export default function AgeVerificationModal({ user, onVerify }: AgeVerificationModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [confirmAge, setConfirmAge] = useState(false);
  const [confirmLegal, setConfirmLegal] = useState(false);
  const [confirmResponsible, setConfirmResponsible] = useState(false);

  useEffect(() => {
    if (user) {
      checkAgeVerificationStatus();
    }
  }, [user]);

  const checkAgeVerificationStatus = async () => {
    try {
      // Check if age verification is required
      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'age_verification_required')
        .single();

      const ageVerificationRequired = configData?.value === 'true';

      if (!ageVerificationRequired) {
        setLoading(false);
        return;
      }

      // Check user's verification status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('age_verified, age_verification_date')
        .eq('id', user.id)
        .single();

      if (!profileData?.age_verified) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking age verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleVerifyAge = async () => {
    if (!birthDate) {
      alert('Please enter your birth date');
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 18) {
      alert('You must be 18 years or older to use HotBoxes. Access denied.');
      return;
    }

    if (!confirmAge || !confirmLegal || !confirmResponsible) {
      alert('Please confirm all required statements');
      return;
    }

    setVerifying(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_verified: true,
          age_verification_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setShowModal(false);
      onVerify();
    } catch (error) {
      console.error('Error verifying age:', error);
      alert('Failed to verify age. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !showModal) {
    return null;
  }

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-[#1E3A8A]/95 to-[#0A1128]/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[#FF4500]/30">
        <div className="absolute inset-0 grid-pattern opacity-10"></div>
        {/* Header */}
        <div className="relative z-10 border-b border-[#FF4500]/30 px-6 py-4 bg-gradient-to-r from-[#FF4500]/10 to-transparent">
          <h2 className="text-3xl font-extrabold text-white text-display">
            🔞 AGE VERIFICATION <span className="text-[#FF4500]">REQUIRED</span>
          </h2>
          <p className="text-gray-300 mt-2 font-semibold">
            You must be 18 years or older to use HotBoxes. Please verify your age to continue.
          </p>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 py-4 space-y-6">
          {/* Birth Date Input */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
              Birth Date
            </label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={maxDateString}
              className="w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
              required
            />
            <p className="mt-2 text-sm text-gray-400">
              You must be born on or before {maxDateString} to be eligible
            </p>
          </div>

          {/* Age Display */}
          {birthDate && (
            <div className={`border rounded-xl p-4 ${calculateAge(birthDate) >= 18 ? 'bg-[#39FF14]/10 border-[#39FF14]/50 glow-green' : 'bg-[#FF4500]/10 border-[#FF4500]/50 glow-orange'}`}>
              <div className="text-center">
                <div className={`text-3xl font-extrabold text-display ${calculateAge(birthDate) >= 18 ? 'text-[#39FF14] text-glow-green' : 'text-[#FF4500] text-glow-orange'}`}>
                  {calculateAge(birthDate)} YEARS OLD
                </div>
                <div className={`text-sm font-bold mt-2 ${calculateAge(birthDate) >= 18 ? 'text-[#39FF14]' : 'text-[#FF4500]'}`}>
                  {calculateAge(birthDate) >= 18 ? '✅ Eligible to use HotBoxes' : '❌ Must be 18+ to continue'}
                </div>
              </div>
            </div>
          )}

          {/* Legal Disclaimers */}
          <div className="space-y-4">
            <div className="bg-[#FF4500]/10 border border-[#FF4500]/50 rounded-xl p-4 glow-orange">
              <h3 className="font-bold text-[#FF4500] mb-2 uppercase tracking-wider">⚠️ Legal Requirements</h3>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>You must be at least 18 years old</li>
                <li>Real money gambling must be legal in your jurisdiction</li>
                <li>You are responsible for any taxes on winnings</li>
                <li>You understand gambling can be addictive</li>
              </ul>
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  id="confirmAge"
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="h-4 w-4 rounded border-[#39FF14]/30 bg-[#0A1128]/50 text-[#39FF14] focus:ring-[#39FF14] mt-1"
                />
                <label htmlFor="confirmAge" className="ml-3 block text-sm text-gray-300">
                  I confirm that I am 18 years of age or older and have provided my accurate birth date.
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="confirmLegal"
                  type="checkbox"
                  checked={confirmLegal}
                  onChange={(e) => setConfirmLegal(e.target.checked)}
                  className="h-4 w-4 rounded border-[#39FF14]/30 bg-[#0A1128]/50 text-[#39FF14] focus:ring-[#39FF14] mt-1"
                />
                <label htmlFor="confirmLegal" className="ml-3 block text-sm text-gray-300">
                  I confirm that real money gambling is legal in my jurisdiction and I am legally allowed to participate.
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="confirmResponsible"
                  type="checkbox"
                  checked={confirmResponsible}
                  onChange={(e) => setConfirmResponsible(e.target.checked)}
                  className="h-4 w-4 rounded border-[#39FF14]/30 bg-[#0A1128]/50 text-[#39FF14] focus:ring-[#39FF14] mt-1"
                />
                <label htmlFor="confirmResponsible" className="ml-3 block text-sm text-gray-300">
                  I understand the risks of gambling and commit to gambling responsibly. I will use the responsible gambling tools available if needed.
                </label>
              </div>
            </div>
          </div>

          {/* Responsible Gambling Resources */}
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/50 rounded-xl p-4 glow-gold">
            <h4 className="font-bold text-[#FFD700] mb-2 uppercase tracking-wider">🛡️ Responsible Gambling</h4>
            <p className="text-gray-300 text-sm mb-2">
              If you or someone you know has a gambling problem, help is available:
            </p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• National Problem Gambling Helpline: 1-800-522-4700</li>
              <li>• Online: <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FFD700]">ncpgambling.org</a></li>
              <li>• Text: "HELPLINE" to 233-373</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-[#FF4500]/30 px-6 py-4 bg-gradient-to-r from-[#0A1128]/90 to-[#1E3A8A]/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400 font-semibold">
              Age verification is required by law
            </div>
            <button
              onClick={handleVerifyAge}
              disabled={verifying || !birthDate || calculateAge(birthDate) < 18 || !confirmAge || !confirmLegal || !confirmResponsible}
              className="bg-gradient-to-r from-[#39FF14] to-[#00FF41] hover:from-[#00FF41] hover:to-[#39FF14] disabled:opacity-50 text-[#0A1128] px-6 py-3 rounded-lg font-bold flex items-center transition-all transform hover:scale-105 glow-green"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A1128] border-t-transparent mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  ✅ Verify Age & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}