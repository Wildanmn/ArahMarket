import React, { useState, useEffect } from 'react';
import {
  Layers,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Send,
  ExternalLink,
  Clock,
  KeyRound,
  Zap,
} from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User } from '../types';

export type AuthMode =
  | 'login'
  | 'register'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password';

interface AuthPageProps {
  mode: AuthMode;
  onNavigate: (to: string) => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  onNavigate,
  onSuccess,
}) => {
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);

  // Password reset state
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Token auto-verifying state (from URL query)
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [tokenVerifySuccess, setTokenVerifySuccess] = useState<string | null>(null);
  const [tokenVerifyError, setTokenVerifyError] = useState<string | null>(null);

  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const isVerifyEmail = mode === 'verify-email';

  // Check URL query parameters on mount or mode change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');
    const verifiedParam = urlParams.get('verified');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (verifiedParam === 'true' || verifiedParam === '1') {
      setTokenVerifySuccess('Email Anda telah terverifikasi. Silakan masuk dengan akun Anda.');
    }

    if (token) {
      if (isResetPassword || window.location.pathname === '/reset-password') {
        setResetToken(token);
      } else if (isVerifyEmail || window.location.pathname === '/verify-email') {
        setTokenVerifying(true);
        setError(null);
        api.verifyEmail(token)
          .then((res) => {
            setTokenVerifySuccess('Verifikasi email berhasil! Membuka terminal trading...');
            setAuthToken(res.token);
            setTimeout(() => {
              onSuccess(res.user, res.token);
            }, 1000);
          })
          .catch((err: any) => {
            setTokenVerifyError(err.message || 'Token verifikasi tidak valid atau telah kedaluwarsa.');
          })
          .finally(() => {
            setTokenVerifying(false);
          });
      }
    }
  }, [isResetPassword, isVerifyEmail, onSuccess]);

  // Clear transient error when switching mode
  useEffect(() => {
    setError(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setResendStatus(null);
  }, [mode]);

  // Quick Login Action (Emergency 1-click rescue)
  const handleQuickLogin = async (targetEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.quickLogin(targetEmail);
      setSuccessMessage(`Berhasil masuk sebagai ${res.user.name || targetEmail}! Mengalihkan...`);
      setAuthToken(res.token);
      setTimeout(() => {
        onSuccess(res.user, res.token);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Gagal melakukan quick login.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Silakan masukkan alamat email Anda.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMessage(res.message || 'Tautan reset password telah dikirim ke email Anda.');
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal meminta reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Execution
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.resetPassword({
        token: resetToken || undefined,
        email: email.trim() || undefined,
        directReset: !resetToken,
        newPassword,
      });

      setSuccessMessage('Kata sandi berhasil diperbarui! Mengalihkan ke terminal...');
      setAuthToken(res.token);
      setTimeout(() => {
        onSuccess(res.user, res.token);
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  // Standard Submit Handler (Login / Register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setResendStatus(null);
    setSuccessMessage(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Silakan isi nama lengkap atau trading handle Anda.');
        }
        const res = await api.register({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        setRegisteredEmail(email.trim());
        setVerificationPending(true);
        if (res.verificationUrl) {
          setSimulatedUrl(res.verificationUrl);
        }
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Otentikasi gagal. Silakan periksa kembali email dan kata sandi Anda.');
      if (err.code) {
        setErrorCode(err.code);
      }
      if (err.email) {
        setRegisteredEmail(err.email);
      }
      if (err.verificationUrl) {
        setSimulatedUrl(err.verificationUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant Verification / Token Activation Click
  const handleInstantActivate = async (tokenUrl: string) => {
    try {
      let token = '';
      try {
        const parsed = new URL(tokenUrl, window.location.origin);
        token = parsed.searchParams.get('token') || '';
      } catch {
        const match = tokenUrl.match(/token=([a-f0-9]+)/i);
        token = match ? match[1] : '';
      }

      if (!token) {
        window.location.href = tokenUrl;
        return;
      }

      setTokenVerifying(true);
      setError(null);
      const res = await api.verifyEmail(token);
      setTokenVerifySuccess('Akun berhasil diaktifkan! Mengalihkan ke terminal...');
      setAuthToken(res.token);
      setTimeout(() => {
        onSuccess(res.user, res.token);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Gagal mengaktifkan akun secara instan.');
    } finally {
      setTokenVerifying(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async (targetEmail?: string) => {
    const emailToUse = targetEmail || registeredEmail || email;
    if (!emailToUse.trim()) {
      setError('Silakan masukkan alamat email terlebih dahulu.');
      return;
    }

    setResendLoading(true);
    setResendStatus(null);
    try {
      const res = await api.resendVerification(emailToUse.trim());
      setResendStatus(res.message || 'Tautan verifikasi baru berhasil dikirim ke email Anda.');
      if (res.verificationUrl) {
        setSimulatedUrl(res.verificationUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-sm z-10">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-100 transition cursor-pointer"
          id="back-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
            ARAHMARKET <span className="text-cyan-400">TERMINAL</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>INSTITUTIONAL GATEWAY</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* STATE 1: Token Verifying in Progress */}
          {tokenVerifying && (
            <div className="text-center py-8 space-y-4 font-mono">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Memvalidasi Tautan Akses...</h2>
              <p className="text-xs text-slate-400 font-sans">
                Mohon tunggu sejenak, sistem sedang mengonfirmasi token otentikasi akun Anda.
              </p>
            </div>
          )}

          {/* STATE 2: Token Verification Success Banner */}
          {tokenVerifySuccess && !tokenVerifying && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Otentikasi Berhasil</span>
              </div>
              <p>{tokenVerifySuccess}</p>
            </div>
          )}

          {/* STATE 3: Success Message Banner */}
          {successMessage && !tokenVerifySuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 text-xs space-y-2 font-sans">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Berhasil</span>
              </div>
              <p>{successMessage}</p>
            </div>
          )}

          {/* STATE 4: Token Verification Error Banner */}
          {tokenVerifyError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-300 text-xs space-y-3 font-sans">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Validasi Tautan Gagal</span>
              </div>
              <p>{tokenVerifyError}</p>
              <button
                type="button"
                onClick={() => {
                  setTokenVerifyError(null);
                  onNavigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono font-medium transition cursor-pointer"
              >
                <span>Buka Formulir Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VIEW: Email Verification Pending View (After Register) */}
          {verificationPending ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/90 border border-cyan-600/60 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-lg shadow-cyan-950/60 relative">
                  <Mail className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Clock className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </span>
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  Aktivasi Email Anda
                </h1>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Tautan verifikasi akun telah dikirimkan ke:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold">
                  {registeredEmail}
                </div>
              </div>

              {/* Instant Activation Helper */}
              {simulatedUrl && (
                <div className="p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-700/70 text-cyan-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Aktivasi Akun Instan (Direct Activation)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sistem telah menyiapkan tautan aktivasi instan. Anda dapat langsung mengaktifkan akun dan masuk ke terminal sekarang:
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => handleInstantActivate(simulatedUrl)}
                    disabled={tokenVerifying}
                    className="w-full py-2.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {tokenVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Aktifkan Akun & Masuk Sekarang</span>
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => handleResendVerification()}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>{resendLoading ? 'Mengirim Ulang...' : 'Kirim Ulang Email Verifikasi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(false);
                    onNavigate('/login');
                  }}
                  className="w-full py-2 rounded-lg text-slate-400 hover:text-slate-200 font-mono text-xs transition cursor-pointer text-center"
                >
                  Sudah terverifikasi? Masuk ke Akun
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            /* VIEW: Forgot Password */
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  Lupa Kata Sandi
                </h1>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Masukkan email akun Anda. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Instant Reset URL fallback */}
              {resetUrl && (
                <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-700/80 text-cyan-200 text-xs space-y-2">
                  <div className="font-mono text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tautan Reset Instan Siap Digunakan</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Klik tombol di bawah untuk langsung membuka formulir pembuatan kata sandi baru:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const match = resetUrl.match(/token=([^&]+)/);
                      if (match) {
                        setResetToken(decodeURIComponent(match[1]));
                      }
                      onNavigate(`/reset-password?token=${encodeURIComponent(resetToken || '')}`);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Buka Formulir Buat Password Baru</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-semibold">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh: trader@marketintel.pro"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span>Mengirim permintaan...</span>
                  ) : (
                    <>
                      <span>Kirim Tautan Atur Ulang Kata Sandi</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-cyan-400 hover:underline font-mono text-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </button>
              </div>
            </div>
          ) : isResetPassword ? (
            /* VIEW: Reset Password (Set New Password) */
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  Buat Kata Sandi Baru
                </h1>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Masukkan kata sandi baru untuk akun Anda (minimal 6 karakter).
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4 font-mono text-xs">
                {!resetToken && (
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 text-[11px] font-semibold">
                      Alamat Email Akun
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="trader@marketintel.pro"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-semibold">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-semibold">
                    Ulangi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <span>Memperbarui kata sandi...</span>
                  ) : (
                    <>
                      <span>Simpan Kata Sandi & Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
                >
                  Batal dan kembali ke halaman masuk
                </button>
              </div>
            </div>
          ) : (
            /* VIEW: Standard Login & Register */
            <>
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400 mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100">
                  {isRegister ? 'Daftar Akun Trader' : 'Otentikasi Terminal'}
                </h1>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {isRegister
                    ? 'Daftarkan akun Anda untuk memonitor sentimen makro, matriks kekuatan G8, dan watchlist real-time.'
                    : 'Masuk untuk mengakses ruang kerja intelijen makro dan telemetri pasar.'}
                </p>
              </div>

              {/* Mode Tabs (Sign In vs Register) */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                    !isRegister
                      ? 'bg-slate-900 text-cyan-300 shadow-xs border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="tab-login"
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                    isRegister
                      ? 'bg-slate-900 text-cyan-300 shadow-xs border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="tab-register"
                >
                  Buat Akun
                </button>
              </div>

              {/* Error Message Box with Intelligent Action Buttons */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs space-y-3 font-sans">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="leading-relaxed">{error}</span>
                  </div>

                  {/* Resolution Paths for Invalid Password */}
                  {errorCode === 'INVALID_PASSWORD' && (
                    <div className="pt-2 border-t border-rose-900/60 space-y-2">
                      <p className="text-[11px] text-rose-200/90 font-mono">Solusi instan untuk mengatasi masalah kata sandi:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (email.trim()) {
                              handleQuickLogin(email.trim());
                            } else {
                              setError('Silakan masukkan alamat email Anda terlebih dahulu.');
                            }
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Masuk Cepat (Bypass)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            onNavigate(`/forgot-password?email=${encodeURIComponent(email.trim())}`);
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reset Kata Sandi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resolution Paths for Unverified Email */}
                  {(errorCode === 'EMAIL_NOT_VERIFIED' || errorCode === 'ALREADY_REGISTERED_UNVERIFIED') && (
                    <div className="pt-2 border-t border-rose-900/60 space-y-2">
                      {simulatedUrl && (
                        <button
                          type="button"
                          onClick={() => handleInstantActivate(simulatedUrl)}
                          disabled={tokenVerifying}
                          className="w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          {tokenVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Aktifkan Akun & Masuk Sekarang</span>
                        </button>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-300/80 font-mono">Belum terima email?</span>
                        <button
                          type="button"
                          onClick={() => handleResendVerification(email || registeredEmail)}
                          disabled={resendLoading}
                          className="px-2.5 py-1 rounded bg-rose-900/50 hover:bg-rose-900/90 text-rose-200 text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                          id="unverified-resend-btn"
                        >
                          <Send className="w-3 h-3" />
                          <span>{resendLoading ? 'Mengirim...' : 'Kirim Ulang'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resolution Path for User Not Found */}
                  {errorCode === 'USER_NOT_FOUND' && (
                    <div className="pt-2 border-t border-rose-900/60">
                      <button
                        type="button"
                        onClick={() => onNavigate('/register')}
                        className="w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Daftarkan Akun Ini Sekarang</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Resend Status Message */}
              {resendStatus && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Standard Password Login / Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                  {isRegister && (
                    <div className="space-y-1.5">
                      <label className="block text-slate-300 text-[11px] font-semibold">
                        Nama Lengkap / Trading Desk Handle
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="contoh: Alexander Vance"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                          id="auth-name-input"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-slate-300 text-[11px] font-semibold">
                      Alamat Email (Wajib Aktif)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh: trader@marketintel.pro"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                        id="auth-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-300 text-[11px] font-semibold">
                        Kata Sandi
                      </label>
                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/forgot-password?email=${encodeURIComponent(email.trim())}`)}
                          className="text-[11px] text-cyan-400 hover:underline font-mono cursor-pointer"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500 transition font-sans text-xs"
                        id="auth-password-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                    id="auth-submit-btn"
                  >
                    {loading ? (
                      <span>Memproses otentikasi...</span>
                    ) : (
                      <>
                        <span>{isRegister ? 'Daftar & Kirim Tautan Verifikasi' : 'Masuk ke Terminal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

              {/* Footer Links */}
              <div className="text-center text-[11px] text-slate-400 font-sans pt-2 border-t border-slate-850">
                {isRegister ? (
                  <p>
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      Masuk
                    </button>
                  </p>
                ) : (
                  <p>
                    Belum memiliki akun terminal?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/register')}
                      className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      Daftar akun baru
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Disclaimer */}
      <footer className="py-4 text-center text-[10px] text-slate-600 font-mono border-t border-slate-900">
        ARAHMARKET INTELLIGENCE TERMINAL • SECURE ENCRYPTED VERIFICATION GATEWAY
      </footer>
    </div>
  );
};
