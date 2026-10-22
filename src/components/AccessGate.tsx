import React, { useState } from 'react';
import { Youtube, Lock, LogIn, ShieldAlert, LogOut, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../firebase';

interface AccessGateProps {
  authLoading: boolean;
  user: User | null;
  isAuthorized: boolean;
}

export const AccessGate: React.FC<AccessGateProps> = ({
  authLoading,
  user,
  isAuthorized,
}) => {
  const [loginBusy, setLoginBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse mb-4">
          <Youtube className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-neutral-300">Verificando acceso privado...</p>
      </div>
    );
  }

  if (!user) {
    const handlePrivateLogin = async () => {
      setLoginBusy(true);
      setErrorMsg(null);
      try {
        await loginWithGoogle();
      } catch {
        setErrorMsg('Error al iniciar sesión con Google.');
      } finally {
        setLoginBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold uppercase tracking-wider">
              Acceso Privado
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Tube Stacker
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Iniciá sesión con tu cuenta autorizada para continuar.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handlePrivateLogin}
            disabled={loginBusy}
            className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/50 transition-all active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>{loginBusy ? 'Conectando...' : 'Ingresar con Google'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white">
              Acceso Restringido
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Esta cuenta no tiene permisos para acceder a esta aplicación.
            </p>
          </div>

          <button
            onClick={() => logoutUser()}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cambiar de cuenta</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
