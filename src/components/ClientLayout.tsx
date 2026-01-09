'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TermsAcceptanceModal from '@/components/TermsAcceptanceModal';
import AgeVerificationModal from '@/components/AgeVerificationModal';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        // Reset verification states when user changes
        setTermsAccepted(false);
        setAgeVerified(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleTermsAccept = () => {
    setTermsAccepted(true);
  };

  const handleAgeVerify = () => {
    setAgeVerified(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050818] to-[#0A1128] flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-[#39FF14] border-b-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050818] to-[#0A1128] flex flex-col">
      <Navigation user={user} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      
      {/* Age Verification Modal - Show first - TEMPORARILY DISABLED */}
      {/* {user && !ageVerified && (
        <AgeVerificationModal 
          user={user} 
          onVerify={handleAgeVerify}
        />
      )} */}
      
      {/* Terms Acceptance Modal - Show after age verification - TEMPORARILY DISABLED */}
      {/* {user && ageVerified && !termsAccepted && (
        <TermsAcceptanceModal 
          user={user} 
          onAccept={handleTermsAccept}
        />
      )} */}
    </div>
  );
}