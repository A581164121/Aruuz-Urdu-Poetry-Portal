
import React, { useState, useCallback } from 'react';
import { URDU_PHONETIC_MAP } from '../constants';

interface PhoneticInputProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  id?: string;
  rows?: number;
  className?: string;
}

const PhoneticInput: React.FC<PhoneticInputProps> = ({ 
  placeholder, 
  value, 
  onChange, 
  multiline = false,
  id,
  rows = 4,
  className = ""
}) => {
  const [isEnglish, setIsEnglish] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Toggle language with Ctrl+G (common shortcut)
    if (e.ctrlKey && e.key === 'g') {
      e.preventDefault();
      setIsEnglish(prev => !prev);
      return;
    }

    if (isEnglish) return;

    const char = e.key;
    if (URDU_PHONETIC_MAP[char]) {
      e.preventDefault();
      const mappedChar = URDU_PHONETIC_MAP[char];
      const start = e.currentTarget.selectionStart || 0;
      const end = e.currentTarget.selectionEnd || 0;
      const newValue = value.substring(0, start) + mappedChar + value.substring(end);
      onChange(newValue);
      
      // Move cursor manually after state update
      setTimeout(() => {
        const target = e.target as any;
        target.setSelectionRange(start + mappedChar.length, start + mappedChar.length);
      }, 0);
    }
  }, [isEnglish, value, onChange]);

  const baseStyles = `w-full p-4 border rounded-lg focus:ring-2 focus:ring-aruuz-accent outline-none bg-white ${className}`;

  return (
    <div className="relative urdu-huge" dir="rtl">
      <div className="absolute top-2 left-2 z-10">
        <button 
          onClick={() => setIsEnglish(!isEnglish)}
          className={`px-2 py-0.5 text-xs rounded border transition-colors ${isEnglish ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-green-100 text-green-700 border-green-300'}`}
        >
          {isEnglish ? 'English' : 'Urdu (Phonetic)'}
        </button>
      </div>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`${baseStyles} urdu-large`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${baseStyles} urdu-large`}
        />
      )}
      <p className="text-xs text-gray-400 mt-1 text-left">Ctrl+G to toggle English/Urdu</p>
    </div>
  );
};

export default PhoneticInput;
