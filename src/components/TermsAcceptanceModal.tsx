'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface TermsAcceptanceModalProps {
  user: any;
  onAccept: () => void;
}

export default function TermsAcceptanceModal({ user, onAccept }: TermsAcceptanceModalProps) {
  const [currentTermsVersion, setCurrentTermsVersion] = useState('1.0');
  const [userTermsVersion, setUserTermsVersion] = useState<string | null>(null);
  const [userTermsDate, setUserTermsDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkTermsStatus();
    }
  }, [user]);

  const checkTermsStatus = async () => {
    try {
      // Get current terms version from system config
      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'terms_current_version')
        .single();

      const currentVersion = configData?.value || '1.0';
      setCurrentTermsVersion(currentVersion);

      // Get user's profile with terms acceptance info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('terms_version, terms_accepted_at')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setUserTermsVersion(profileData.terms_version);
        setUserTermsDate(profileData.terms_accepted_at);

        // Show modal if user hasn't accepted current terms
        if (!profileData.terms_version || profileData.terms_version !== currentVersion) {
          setShowModal(true);
        }
      } else {
        // New user, show terms
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking terms status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    setAccepting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          terms_version: currentTermsVersion,
          terms_accepted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setShowModal(false);
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Failed to accept terms. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-[#1E3A8A]/95 to-[#0A1128]/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[#FFD700]/30">
        <div className="absolute inset-0 grid-pattern opacity-10"></div>
        {/* Header */}
        <div className="relative z-10 border-b border-[#FFD700]/30 px-6 py-4 bg-gradient-to-r from-[#FFD700]/10 to-transparent">
          <h2 className="text-3xl font-extrabold text-white text-display">
            {userTermsVersion ? '📋 UPDATED TERMS OF SERVICE' : '📋 TERMS OF SERVICE'}
          </h2>
          <p className="text-gray-300 mt-2 font-semibold">
            {userTermsVersion
              ? `Our Terms of Service have been updated (v${currentTermsVersion}). Please review and accept the new terms to continue using HotBoxes.`
              : `Please review and accept our Terms of Service (v${currentTermsVersion}) to continue using HotBoxes.`
            }
          </p>
        </div>

        {/* Terms Content */}
        <div className="relative z-10 px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Key Updates in Version {currentTermsVersion}:</h3>
            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-300">
              <li>Enhanced user privacy protections</li>
              <li>Updated responsible gambling features</li>
              <li>Clarified withdrawal and payment policies</li>
              <li>Improved dispute resolution process</li>
              <li>Added age verification requirements</li>
            </ul>

            <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 rounded-xl p-4 mb-6 glow-green">
              <h4 className="font-bold text-[#39FF14] mb-2 uppercase tracking-wider">🔍 Review Full Terms</h4>
              <p className="text-gray-300 text-sm">
                Please read our complete{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="underline hover:text-[#39FF14] text-[#39FF14]"
                >
                  Terms of Service
                </Link>
                {' '}before accepting. By clicking "Accept Terms", you agree to be bound by all terms and conditions.
              </p>
            </div>

            <div className="bg-[#FF4500]/10 border border-[#FF4500]/50 rounded-xl p-4 mb-6 glow-orange">
              <h4 className="font-bold text-[#FF4500] mb-2 uppercase tracking-wider">⚠️ Important Notice</h4>
              <p className="text-gray-300 text-sm">
                HotBoxes involves real money transactions. You must be 18+ years old and comply with all applicable laws.
                Gambling can be addictive - please play responsibly.
              </p>
            </div>

            {userTermsVersion && (
              <div className="bg-[#0A1128]/70 border border-[#FFD700]/30 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-[#FFD700] mb-2 uppercase tracking-wider">📅 Your Terms History</h4>
                <p className="text-gray-300 text-sm">
                  Previously accepted: Version {userTermsVersion} on{' '}
                  {userTermsDate ? new Date(userTermsDate).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-[#FFD700]/30 px-6 py-4 bg-gradient-to-r from-[#0A1128]/90 to-[#1E3A8A]/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 font-semibold">
              Accepting terms is required to continue using HotBoxes
            </div>
            <div className="flex space-x-3">
              <Link
                href="/terms"
                target="_blank"
                className="bg-gradient-to-r from-[#1E3A8A]/50 to-[#0A1128]/70 hover:from-[#1E3A8A]/70 hover:to-[#0A1128]/90 border border-[#FFD700]/30 text-white px-4 py-2 rounded-lg font-bold transition-all"
              >
                📖 Read Full Terms
              </Link>
              <button
                onClick={handleAcceptTerms}
                disabled={accepting}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] disabled:opacity-50 text-[#0A1128] px-6 py-3 rounded-lg font-bold flex items-center transition-all transform hover:scale-105 glow-gold"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A1128] border-t-transparent mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    ✅ Accept Terms v{currentTermsVersion}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}