'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Redirect to sign in page with success message
      router.push('/auth/signin?registered=true');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #E9EDF2, #ffffff)' }}>
      <div className="relative bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border" style={{ borderColor: '#D2D7E1' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#000032' }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#000032' }}>
            Room Reserve
          </h1>
          <p className="text-sm" style={{ color: '#141E32' }}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#141E32' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                borderColor: '#D2D7E1'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000032';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 50, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D2D7E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#141E32' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                borderColor: '#D2D7E1'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000032';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 50, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D2D7E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#141E32' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                borderColor: '#D2D7E1'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000032';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 50, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D2D7E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="????????"
              required
              disabled={loading}
            />
            <p className="text-xs mt-1" style={{ color: '#141E32', opacity: 0.7 }}>
              Must be at least 6 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#141E32' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                borderColor: '#D2D7E1'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000032';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 50, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D2D7E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="????????"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFD7B9', borderLeft: '4px solid #FF6900' }}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" style={{ color: '#D24B00' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="font-medium text-sm" style={{ color: '#D24B00' }}>{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 px-4 rounded-xl font-semibold focus:outline-none focus:ring-4 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            style={{ backgroundColor: '#000032' }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#141E32')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#000032')}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#141E32' }}>
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-semibold hover:underline" style={{ color: '#000032' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
