import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { AUTHORIZED_USERS } from '../env-login';
import { getLocalUsers } from '../services/storageService';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check Hardcoded Env Users
    if (AUTHORIZED_USERS[username] && AUTHORIZED_USERS[username] === password) {
        onLogin(username);
        return;
    }

    // Check Local Storage Users
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.username === username);
    if (user && user.pin === password) {
        onLogin(username);
        return;
    }

    setError('Invalid credentials');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 relative overflow-hidden bg-obsidian">
      {/* Image Background - Optimized size */}
      <div className="absolute inset-0 z-0">
         <img 
            src="https://images.squarespace-cdn.com/content/v1/6885124a98afac55ac8d915a/b43a8f5b-f523-4fb2-9bfe-01f6824b97ed/Langley+High+Team+611+Banner.png?format=1000w&auto=format&fit=crop"
            alt="Background" 
            className="w-full h-full object-cover opacity-80"
            loading="eager"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-obsidian/40 via-obsidian/70 to-obsidian"></div>
      </div>

      {/* Decorative background elements (Subtle glow behind the form) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-matcha/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen"></div>

      <div className="z-10 bg-obsidian-light/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md relative overflow-hidden group">
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        <div className="text-center space-y-2 mb-8 relative">
          <Logo variant="text" size="LG" />
          <p className="text-gold tracking-[0.2em] text-xs font-bold uppercase">Langley Saxons 611</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <Input 
              label="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-slate-900/60 border-slate-600 focus:border-matcha h-12 text-lg text-white placeholder-slate-400 backdrop-blur-sm"
              autoCapitalize="none"
              placeholder="Enter your ID"
          />
          
          <Input 
              label="Password" 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="bg-slate-900/60 border-slate-600 focus:border-matcha h-12 text-lg text-white placeholder-slate-400 backdrop-blur-sm"
              placeholder="Enter PIN"
          />

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center font-bold backdrop-blur-md">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth variant="gold" className="text-lg shadow-xl shadow-gold/10 hover:shadow-gold/20 transform hover:-translate-y-1 transition-all">
            Enter System
          </Button>
        </form>
      </div>
      
      <div className="absolute bottom-6 text-slate-500 text-xs z-10 font-medium">
        System Version 2026.2.0 (REBUILT)
      </div>
    </div>
  );
};
