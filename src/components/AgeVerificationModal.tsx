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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🔞 Age Verification Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You must be 18 years or older to use HotBoxes. Please verify your age to continue.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Birth Date Input */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Birth Date
            </label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={maxDateString}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              You must be born on or before {maxDateString} to be eligible
            </p>
          </div>

          {/* Age Display */}
          {birthDate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {calculateAge(birthDate)} years old
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {calculateAge(birthDate) >= 18 ? '✅ Eligible to use HotBoxes' : '❌ Must be 18+ to continue'}
                </div>
              </div>
            </div>
          )}

          {/* Legal Disclaimers */}
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Legal Requirements</h3>
              <ul className="text-red-700 dark:text-red-300 text-sm space-y-1 list-disc list-inside">
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="confirmAge" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  I confirm that I am 18 years of age or older and have provided my accurate birth date.
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="confirmLegal"
                  type="checkbox"
                  checked={confirmLegal}
                  onChange={(e) => setConfirmLegal(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="confirmLegal" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  I confirm that real money gambling is legal in my jurisdiction and I am legally allowed to participate.
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="confirmResponsible"
                  type="checkbox"
                  checked={confirmResponsible}
                  onChange={(e) => setConfirmResponsible(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="confirmResponsible" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  I understand the risks of gambling and commit to gambling responsibly. I will use the responsible gambling tools available if needed.
                </label>
              </div>
            </div>
          </div>

          {/* Responsible Gambling Resources */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🛡️ Responsible Gambling</h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
              If you or someone you know has a gambling problem, help is available:
            </p>
            <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
              <li>• National Problem Gambling Helpline: 1-800-522-4700</li>
              <li>• Online: <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600">ncpgambling.org</a></li>
              <li>• Text: "HELPLINE" to 233-373</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Age verification is required by law
            </div>
            <button
              onClick={handleVerifyAge}
              disabled={verifying || !birthDate || calculateAge(birthDate) < 18 || !confirmAge || !confirmLegal || !confirmResponsible}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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