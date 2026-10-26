import React, { useState } from 'react';
import {
  Youtube,
  LayoutGrid,
  FolderKanban,
  Tv,
  FlaskConical,
  Database,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveModule } from '../types';
import { ProfileId, PROFILES, logoutUser } from '../firebase';

interface NavbarProps {
  user: User;
  activeProfile: ProfileId;
  ownProfile: ProfileId;
  activeModule: ActiveModule;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectProfile: (profile: ProfileId) => void;
  onSelectModule: (module: ActiveModule) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeProfile,
  ownProfile,
  activeModule,
  theme,
  onToggleTheme,
  onSelectProfile,
  onSelectModule,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLight = theme === 'light';

  const navItems: {
    id: ActiveModule;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'repositorio',
      label: 'Repositorio',
      icon: LayoutGrid,
    },
    {
      id: 'misvideos',
      label: 'Mis Videos',
      icon: FolderKanban,
    },
    {
      id: 'preview',
      label: 'Comparar',
      icon: Tv,
    },
    {
      id: 'testing',
      label: 'Testing',
      icon: FlaskConical,
    },
    {
      id: 'datos',
      label: 'Datos',
      icon: Database,
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/35 z-30 transition-opacity duration-200 pointer-events-none ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed top-0 left-0 bottom-0 z-40 border-r flex flex-col justify-between transition-[width,box-shadow,background-color,border-color] duration-200 ease-out select-none overflow-hidden ${
          isLight
            ? 'bg-white border-neutral-200'
            : 'bg-[#0f0f0f] border-neutral-800/80'
        } ${
          isExpanded
            ? isLight
              ? 'w-64 shadow-[16px_0_40px_rgba(0,0,0,0.12)]'
              : 'w-64 shadow-[20px_0_50px_rgba(0,0,0,0.85)]'
            : 'w-16 shadow-none'
        }`}
      >
        {/* Top: Brand + Primary Navigation + Profile Switcher */}
        <div className="p-2.5 space-y-6">
          {/* Brand */}
          <button
            onClick={() => onSelectModule('repositorio')}
            className={`w-full flex items-center gap-3 px-1.5 py-1.5 rounded-xl transition-colors text-left ${
              isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900/80'
            }`}
            title="Ir al Repositorio"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <span
              className={`font-bold text-sm tracking-tight whitespace-nowrap transition-opacity duration-150 ${
                isLight ? 'text-neutral-900' : 'text-white'
              } ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              Tube Stacker
            </span>
          </button>

          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  title={!isExpanded ? item.label : undefined}
                  className={`w-full flex items-center gap-3.5 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? isLight
                        ? 'bg-neutral-100 text-neutral-950 font-semibold'
                        : 'bg-neutral-800/90 text-white font-semibold'
                      : isLight
                      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive
                        ? 'text-red-500'
                        : isLight
                        ? 'text-neutral-500'
                        : 'text-neutral-400'
                    }`}
                  />
                  <span
                    className={`transition-opacity duration-150 ${
                      isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Profile Switcher */}
          <div
            className={`pt-4 border-t space-y-1.5 ${
              isLight ? 'border-neutral-200' : 'border-neutral-800/70'
            }`}
          >
            <div
              className={`px-2.5 text-[11px] font-medium text-neutral-500 whitespace-nowrap transition-opacity duration-150 ${
                isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
              }`}
            >
              Perfil activo
            </div>

            {(['johnny', 'guido'] as ProfileId[]).map((pid) => {
              const prof = PROFILES[pid];
              const isSelected = activeProfile === pid;
              const isMine = ownProfile === pid;
              return (
                <button
                  key={pid}
                  onClick={() => onSelectProfile(pid)}
                  title={!isExpanded ? `Perfil de ${prof.name}` : undefined}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-xs transition-colors whitespace-nowrap ${
                    isSelected
                      ? isLight
                        ? 'bg-neutral-100 text-neutral-950 font-semibold'
                        : 'bg-neutral-800/90 text-white font-semibold'
                      : isLight
                      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/70'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? pid === 'johnny'
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isLight
                        ? 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    {prof.name[0]}
                  </span>

                  <div
                    className={`flex items-center justify-between flex-1 min-w-0 transition-opacity duration-150 ${
                      isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <span className="truncate">{prof.name}</span>
                    {isMine && (
                      <span className="text-[11px] text-neutral-500 font-normal">
                        tú
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: Theme Toggle + User / Gmail Account */}
        <div
          className={`p-2.5 border-t space-y-2 ${
            isLight ? 'border-neutral-200' : 'border-neutral-800/80'
          }`}
        >
          <button
            onClick={onToggleTheme}
            title={!isExpanded ? (isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro') : undefined}
            className={`w-full flex items-center gap-3.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              isLight
                ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
            }`}
          >
            {isLight ? (
              <Moon className="w-5 h-5 shrink-0 text-neutral-600" />
            ) : (
              <Sun className="w-5 h-5 shrink-0 text-amber-400" />
            )}
            <span
              className={`transition-opacity duration-150 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {isLight ? 'Modo oscuro' : 'Modo claro'}
            </span>
          </button>

          <div className="flex items-center gap-3 px-1.5 py-1.5 rounded-xl">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || 'Usuario'}
                referrerPolicy="no-referrer"
                className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
                  isLight ? 'border-neutral-300' : 'border-neutral-700'
                }`}
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isLight
                    ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                    : 'bg-neutral-800 text-neutral-200 border-neutral-700'
                }`}
              >
                {(user.email || 'U')[0].toUpperCase()}
              </div>
            )}

            <div
              className={`flex-1 min-w-0 transition-opacity duration-150 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {user.displayName && (
                <p
                  className={`text-xs font-medium truncate ${
                    isLight ? 'text-neutral-900' : 'text-neutral-200'
                  }`}
                >
                  {user.displayName}
                </p>
              )}
              <p
                className="text-[11px] text-neutral-500 truncate"
                title={user.email || ''}
              >
                {user.email}
              </p>
            </div>

            {isExpanded && (
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isLight
                    ? 'text-neutral-500 hover:text-red-600 hover:bg-neutral-100'
                    : 'text-neutral-500 hover:text-red-400 hover:bg-neutral-800/80'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
