import React from 'react';

/**
 * 프로그램 아이콘 컴포넌트 모음
 */
export const ProgramIcons = {
  BUDDY: () => (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="40" r="15" fill="#FF6B6B"/>
      <circle cx="65" cy="40" r="15" fill="#4ECDC4"/>
      <path d="M50 60 Q35 70 20 60" stroke="#FF6B6B" strokeWidth="3" fill="none"/>
      <path d="M50 60 Q65 70 80 60" stroke="#4ECDC4" strokeWidth="3" fill="none"/>
    </svg>
  ),
  KOKO: () => (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="50" y="40" fontFamily="Arial" fontSize="24" fill="#7B68EE" textAnchor="middle">한글</text>
      <circle cx="50" cy="60" r="20" stroke="#7B68EE" strokeWidth="3" fill="none"/>
    </svg>
  ),
  POPPOP: () => (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 50 L40 30 L50 45 L60 25 L70 50" stroke="#FF1744" strokeWidth="4" fill="none"/>
      <circle cx="30" cy="50" r="5" fill="#FF1744"/>
      <circle cx="40" cy="30" r="5" fill="#FF1744"/>
      <circle cx="50" cy="45" r="5" fill="#FF1744"/>
      <circle cx="60" cy="25" r="5" fill="#FF1744"/>
      <circle cx="70" cy="50" r="5" fill="#FF1744"/>
    </svg>
  ),
  TALKTALK: () => (
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="30" height="25" rx="5" fill="#00BFA5"/>
      <rect x="50" y="40" width="30" height="25" rx="5" fill="#FFB300"/>
      <path d="M35 50 L35 60 L25 50" fill="#00BFA5"/>
      <path d="M65 65 L65 75 L75 65" fill="#FFB300"/>
    </svg>
  )
};

export default ProgramIcons;