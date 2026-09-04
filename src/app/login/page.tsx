'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const { login, signUp } = useApp();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (activeTab === 'signup') {
        const res = await signUp(email, password, fullName);
        if (!res.success) {
          setError(res.error || 'Failed to create account');
          return;
        }
        if (res.message) {
          setInfoMessage(res.message);
          setActiveTab('signin');
          return;
        }
        router.push('/');
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid corporate credentials');
          return;
        }
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@apex.corp');
    setPassword('admin123');
    setActiveTab('signin');
    setError(null);
    setInfoMessage('Loaded Demo Admin credentials. Click "Sign In" to explore.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow aesthetics */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-lg shadow-blue-500/30 mb-2">
            CF
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">CashFlow Manager</h1>
          <p className="text-xs text-slate-400">Enterprise Cash & Bank Double-Entry Treasury</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'signin'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'signup'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              Register New Account
            </button>
          </div>

          <CardHeader className="border-slate-800 pb-3 pt-4">
            <CardTitle className="text-white text-base">
              {activeTab === 'signin' ? 'Sign In to Treasury' : 'Create Treasury Account'}
            </CardTitle>
            <p className="text-xs text-slate-400">
              {activeTab === 'signin'
                ? 'Enter your registered credentials or launch demo'
                : 'Enter your details to create an isolated financial workspace'}
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="p-3 bg-blue-950/50 border border-blue-800 text-blue-300 rounded-lg text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {activeTab === 'signup' && (
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priyanshu Rajput"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              )}

              <Input
                label="Corporate Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-slate-950 border-slate-800 text-white"
              />

              <Input
                label={activeTab === 'signin' ? "Master Password" : "Create Password (min 6 chars)"}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-950 border-slate-800 text-white"
              />

              {activeTab === 'signin' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-blue-600" />
                    <span>Remember session</span>
                  </label>
                  <Link href="#" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-slate-800 pt-3 flex flex-col space-y-3">
              <Button type="submit" isLoading={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-2.5">
                <span>{activeTab === 'signin' ? 'Authorize & Sign In' : 'Create & Register Account'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <div className="relative flex py-1 items-center w-full">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">or</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full py-2 px-3 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <span>⚡ Fill Demo Admin (admin@apex.corp)</span>
              </button>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with Supabase Auth & RLS Isolation</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppProvider>
      <LoginForm />
    </AppProvider>
  );
}
