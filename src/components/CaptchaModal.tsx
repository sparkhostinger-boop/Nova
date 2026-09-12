import React, { useState, useEffect } from 'react';
import { Shield, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const SYMBOLS = "!@#$%^&*+?";
const COLORS = [
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Green', class: 'bg-emerald-500' },
  { name: 'Yellow', class: 'bg-amber-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Orange', class: 'bg-orange-500' }
];

export default function CaptchaModal({ mode, onSuccess, onClose }: { mode: string, onSuccess: () => void, onClose: () => void }) {
  const [actualMode, setActualMode] = useState<string>("");
  const [errorText, setErrorText] = useState("");
  
  // Symbol State
  const [targetSymbol, setTargetSymbol] = useState("");
  const [symbolInput, setSymbolInput] = useState("");

  // Color State
  const [targetColor, setTargetColor] = useState<any>(null);
  const [colorOptions, setColorOptions] = useState<any[]>([]);

  // Pattern State
  const [targetIndex, setTargetIndex] = useState(-1);

  const initCaptcha = () => {
    setErrorText("");
    let selectedMode = mode;
    if (mode === "Random") {
      const modes = ["Pattern", "Color", "Symbol"];
      selectedMode = modes[Math.floor(Math.random() * modes.length)];
    }
    setActualMode(selectedMode);

    if (selectedMode === "Symbol") {
      let sym = "";
      for(let i=0; i<5; i++) sym += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      setTargetSymbol(sym);
      setSymbolInput("");
    } 
    else if (selectedMode === "Color") {
      const shuffled = [...COLORS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);
      setColorOptions(selected);
      setTargetColor(selected[Math.floor(Math.random() * selected.length)]);
    }
    else if (selectedMode === "Pattern") {
      setTargetIndex(Math.floor(Math.random() * 9));
    }
  };

  useEffect(() => {
    initCaptcha();
  }, [mode]);

  const verifySymbol = () => {
    if (symbolInput === targetSymbol) onSuccess();
    else {
      setErrorText("Incorrect symbols. Try again.");
      setTimeout(initCaptcha, 1000);
    }
  };

  const verifyColor = (c: any) => {
    if (c.name === targetColor.name) onSuccess();
    else {
      setErrorText("Incorrect color. Try again.");
      setTimeout(initCaptcha, 1000);
    }
  };

  const verifyPattern = (idx: number) => {
    if (idx === targetIndex) onSuccess();
    else {
      setErrorText("Incorrect pattern. Try again.");
      setTimeout(initCaptcha, 1000);
    }
  };

  if (!actualMode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold">
            <Shield size={18} className="text-indigo-400" />
            Security Verification
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {errorText && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
              {errorText}
            </div>
          )}

          {actualMode === "Symbol" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-zinc-400 text-center">Type the characters exactly as shown below:</p>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 w-full text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                <span className="text-3xl font-mono tracking-[0.5em] text-white font-bold relative z-10 select-none line-through decoration-indigo-500/50 decoration-2">{targetSymbol}</span>
              </div>
              <input 
                type="text" 
                value={symbolInput}
                onChange={e => setSymbolInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifySymbol()}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-center text-white tracking-widest focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Enter symbols"
                autoFocus
              />
              <button type="button" onClick={verifySymbol} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">Verify</button>
            </div>
          )}

          {actualMode === "Color" && targetColor && (
            <div className="flex flex-col items-center gap-5">
              <p className="text-sm text-zinc-400 text-center">Please select the <strong className="text-white text-base">{targetColor.name}</strong> box to continue:</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {colorOptions.map((c, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => verifyColor(c)}
                    className={`h-20 rounded-xl transition-transform hover:scale-105 active:scale-95 ${c.class} shadow-lg`}
                  />
                ))}
              </div>
            </div>
          )}

          {actualMode === "Pattern" && (
            <div className="flex flex-col items-center gap-5">
              <p className="text-sm text-zinc-400 text-center">Click the highlighted square to verify you are human:</p>
              <div className="grid grid-cols-3 gap-2 w-full max-w-[200px] mx-auto">
                {Array.from({length: 9}).map((_, i) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => verifyPattern(i)}
                    className={`aspect-square rounded-lg border transition-all ${i === targetIndex ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
             <button type="button" onClick={initCaptcha} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
               <RefreshCw size={12} /> Reload challenge
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
