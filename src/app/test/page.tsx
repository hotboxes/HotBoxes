'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [result, setResult] = useState('');

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(`Success! Connected to database. Found ${data?.length || 0} profiles.`);
      }
    } catch (err: any) {
      setResult(`Exception: ${err.message}`);
    }
  };

  const testSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      if (error) {
        setResult(`Signup Error: ${error.message}`);
      } else {
        setResult(`Signup Success! User created: ${data.user?.email}`);
      }
    } catch (err: any) {
      setResult(`Signup Exception: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Database Connection
        </button>
        <button 
          onClick={testSignup}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Signup
        </button>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>Result:</strong> {result || 'Click a button to test'}
        </div>
      </div>
    </div>
  );
}