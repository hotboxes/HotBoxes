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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {userTermsVersion ? '📋 Updated Terms of Service' : '📋 Terms of Service'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {userTermsVersion 
              ? `Our Terms of Service have been updated (v${currentTermsVersion}). Please review and accept the new terms to continue using HotBoxes.`
              : `Please review and accept our Terms of Service (v${currentTermsVersion}) to continue using HotBoxes.`
            }
          </p>
        </div>

        {/* Terms Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-4">Key Updates in Version {currentTermsVersion}:</h3>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Enhanced user privacy protections</li>
              <li>Updated responsible gambling features</li>
              <li>Clarified withdrawal and payment policies</li>
              <li>Improved dispute resolution process</li>
              <li>Added age verification requirements</li>
            </ul>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔍 Review Full Terms</h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Please read our complete{' '}
                <Link 
                  href="/terms" 
                  target="_blank" 
                  className="underline hover:text-blue-600"
                >
                  Terms of Service
                </Link>
                {' '}before accepting. By clicking "Accept Terms", you agree to be bound by all terms and conditions.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Important Notice</h4>
              <p className="text-red-700 dark:text-red-300 text-sm">
                HotBoxes involves real money transactions. You must be 18+ years old and comply with all applicable laws. 
                Gambling can be addictive - please play responsibly.
              </p>
            </div>

            {userTermsVersion && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📅 Your Terms History</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Previously accepted: Version {userTermsVersion} on{' '}
                  {userTermsDate ? new Date(userTermsDate).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Accepting terms is required to continue using HotBoxes
            </div>
            <div className="flex space-x-3">
              <Link
                href="/terms"
                target="_blank"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                📖 Read Full Terms
              </Link>
              <button
                onClick={handleAcceptTerms}
                disabled={accepting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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