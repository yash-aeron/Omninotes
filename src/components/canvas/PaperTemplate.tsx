import React from 'react';
import type { PaperPattern, PaperTheme } from '../../engine/types';

interface PaperTemplateProps {
  pattern: PaperPattern;
  theme: PaperTheme;
  width: number;
  height: number;
}

export const PAPER_THEME_COLORS: Record<
  PaperTheme,
  { bg: string; line: string; margin: string; text: string; headerBg: string }
> = {
  white: {
    bg: '#ffffff',
    line: '#e2e8f0',
    margin: '#fca5a5',
    text: '#1e293b',
    headerBg: '#f8fafc',
  },
  ivory: {
    bg: '#fdfbf7',
    line: '#e7e2d7',
    margin: '#f87171',
    text: '#292524',
    headerBg: '#f5efe6',
  },
  'legal-yellow': {
    bg: '#fefce8',
    line: '#fef08a',
    margin: '#f87171',
    text: '#422006',
    headerBg: '#fef9c3',
  },
  'dark-slate': {
    bg: '#1e293b',
    line: '#334155',
    margin: '#64748b',
    text: '#f8fafc',
    headerBg: '#0f172a',
  },
  'oled-black': {
    bg: '#090a0f',
    line: '#1e2230',
    margin: '#3b4252',
    text: '#f3f4f6',
    headerBg: '#12141c',
  },
};

export const PaperTemplate: React.FC<PaperTemplateProps> = ({
  pattern,
  theme,
  width,
  height,
}) => {
  const colors = PAPER_THEME_COLORS[theme] || PAPER_THEME_COLORS.white;
  const patternId = `pattern-${pattern}-${theme}`;

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Ruled lines pattern */}
        {pattern === 'ruled' && (
          <pattern id={patternId} width={width} height="32" patternUnits="userSpaceOnUse">
            <line x1="0" y1="31.5" x2={width} y2="31.5" stroke={colors.line} strokeWidth="1" />
          </pattern>
        )}

        {/* Square Grid pattern */}
        {pattern === 'grid' && (
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={colors.line} strokeWidth="0.8" />
          </pattern>
        )}

        {/* Dotted pattern */}
        {pattern === 'dotted' && (
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill={colors.line} />
          </pattern>
        )}

        {/* Isometric dot grid pattern */}
        {pattern === 'isometric' && (
          <pattern id={patternId} width="32" height="55.42" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="0" r="1.2" fill={colors.line} />
            <circle cx="0" cy="27.71" r="1.2" fill={colors.line} />
            <circle cx="32" cy="27.71" r="1.2" fill={colors.line} />
            <circle cx="16" cy="55.42" r="1.2" fill={colors.line} />
          </pattern>
        )}
      </defs>

      {/* Solid background */}
      <rect width={width} height={height} fill={colors.bg} />

      {/* Repeating Pattern */}
      {(pattern === 'ruled' || pattern === 'grid' || pattern === 'dotted' || pattern === 'isometric') && (
        <rect width={width} height={height} fill={`url(#${patternId})`} />
      )}

      {/* Ruled Left Margin line */}
      {pattern === 'ruled' && (
        <line x1="90" y1="0" x2="90" y2={height} stroke={colors.margin} strokeWidth="1.5" strokeOpacity="0.8" />
      )}

      {/* 1. Cornell Notes Template */}
      {pattern === 'cornell' && (
        <g>
          {Array.from({ length: Math.floor((height - 240) / 32) }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={80 + i * 32}
              x2={width}
              y2={80 + i * 32}
              stroke={colors.line}
              strokeWidth="1"
            />
          ))}
          <line x1="0" y1="80" x2={width} y2="80" stroke={colors.text} strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="30" y="52" fill={colors.text} fontSize="14" fontFamily="sans-serif" fontWeight="bold" opacity="0.6">
            TOPIC / OBJECTIVE / DATE
          </text>
          <line x1="220" y1="80" x2="220" y2={height - 160} stroke={colors.margin} strokeWidth="1.5" />
          <text x="30" y="110" fill={colors.text} fontSize="12" fontFamily="sans-serif" fontWeight="600" opacity="0.5">
            CUES / KEYWORDS
          </text>
          <text x="240" y="110" fill={colors.text} fontSize="12" fontFamily="sans-serif" fontWeight="600" opacity="0.5">
            NOTES
          </text>
          <line x1="0" y1={height - 160} x2={width} y2={height - 160} stroke={colors.text} strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="30" y={height - 130} fill={colors.text} fontSize="12" fontFamily="sans-serif" fontWeight="bold" opacity="0.6">
            SUMMARY
          </text>
        </g>
      )}

      {/* 2. Music Staff Template (5-line musical staves) */}
      {pattern === 'music' && (
        <g>
          {Array.from({ length: Math.floor((height - 100) / 90) }).map((_, staffIdx) => {
            const startY = 60 + staffIdx * 90;
            return (
              <g key={staffIdx}>
                {[0, 8, 16, 24, 32].map((lineOffset) => (
                  <line
                    key={lineOffset}
                    x1="60"
                    y1={startY + lineOffset}
                    x2={width - 60}
                    y2={startY + lineOffset}
                    stroke={colors.text}
                    strokeWidth="1.2"
                    strokeOpacity="0.75"
                  />
                ))}
                {/* Left and right clef bar lines */}
                <line x1="60" y1={startY} x2="60" y2={startY + 32} stroke={colors.text} strokeWidth="1.5" />
                <line x1={width - 60} y1={startY} x2={width - 60} y2={startY + 32} stroke={colors.text} strokeWidth="1.5" />
              </g>
            );
          })}
        </g>
      )}

      {/* 3. Daily Journal Template */}
      {pattern === 'daily-journal' && (
        <g>
          <rect x="40" y="40" width={width - 80} height="50" rx="8" fill={colors.headerBg} stroke={colors.line} />
          <text x="60" y="72" fill={colors.text} fontSize="16" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">
            DAILY REFLECTION & HABITS
          </text>
          <text x={width - 180} y="72" fill={colors.text} fontSize="13" fontFamily="sans-serif" opacity="0.5">
            Date: ____ / ____ / 2026
          </text>

          {/* Three priorities block */}
          <rect x="40" y="110" width={(width - 100) / 2} height="130" rx="6" fill="none" stroke={colors.line} />
          <text x="56" y="134" fill={colors.text} fontSize="12" fontWeight="bold" opacity="0.6">
            TOP 3 PRIORITIES
          </text>
          <line x1="56" y1="165" x2={(width - 100) / 2 + 20} y2="165" stroke={colors.line} />
          <line x1="56" y1="195" x2={(width - 100) / 2 + 20} y2="195" stroke={colors.line} />
          <line x1="56" y1="225" x2={(width - 100) / 2 + 20} y2="225" stroke={colors.line} />

          {/* Gratitude block */}
          <rect x={(width - 100) / 2 + 60} y="110" width={(width - 100) / 2} height="130" rx="6" fill="none" stroke={colors.line} />
          <text x={(width - 100) / 2 + 76} y="134" fill={colors.text} fontSize="12" fontWeight="bold" opacity="0.6">
            TODAY'S GRATITUDE
          </text>
          <line x1={(width - 100) / 2 + 76} y1="165" x2={width - 60} y2="165" stroke={colors.line} />
          <line x1={(width - 100) / 2 + 76} y1="195" x2={width - 60} y2="195" stroke={colors.line} />
          <line x1={(width - 100) / 2 + 76} y1="225" x2={width - 60} y2="225" stroke={colors.line} />

          {/* Freeform Journaling lined space */}
          <text x="50" y="275" fill={colors.text} fontSize="12" fontWeight="bold" opacity="0.6">
            FREEFORM THOUGHTS & BRAIN DUMP
          </text>
          {Array.from({ length: Math.floor((height - 300) / 32) }).map((_, i) => (
            <line
              key={i}
              x1="40"
              y1={290 + i * 32}
              x2={width - 40}
              y2={290 + i * 32}
              stroke={colors.line}
              strokeWidth="0.9"
            />
          ))}
        </g>
      )}

      {/* 4. Meeting Notes Template */}
      {pattern === 'meeting-notes' && (
        <g>
          <rect x="40" y="40" width={width - 80} height="80" rx="8" fill={colors.headerBg} stroke={colors.line} />
          <text x="60" y="70" fill={colors.text} fontSize="16" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            MEETING MINUTES & AGENDA
          </text>
          <text x="60" y="98" fill={colors.text} fontSize="12" fontFamily="sans-serif" opacity="0.5">
            Attendees: _______________________________ | Time: _________
          </text>

          {/* Discussion lines */}
          <text x="50" y="150" fill={colors.text} fontSize="12" fontWeight="bold" opacity="0.6">
            KEY DISCUSSIONS & DECISIONS
          </text>
          {Array.from({ length: Math.floor((height - 380) / 32) }).map((_, i) => (
            <line
              key={i}
              x1="40"
              y1={170 + i * 32}
              x2={width - 40}
              y2={170 + i * 32}
              stroke={colors.line}
              strokeWidth="0.9"
            />
          ))}

          {/* Action Items Bottom Grid */}
          <rect x="40" y={height - 200} width={width - 80} height="160" rx="8" fill="none" stroke={colors.line} />
          <text x="60" y={height - 175} fill={colors.text} fontSize="13" fontWeight="bold" opacity="0.7">
            ACTION ITEMS & DELIVERABLES (WHO / WHAT / WHEN)
          </text>
          <line x1="40" y1={height - 155} x2={width - 40} y2={height - 155} stroke={colors.line} />
          <line x1="40" y1={height - 115} x2={width - 40} y2={height - 115} stroke={colors.line} />
          <line x1="40" y1={height - 75} x2={width - 40} y2={height - 75} stroke={colors.line} />
        </g>
      )}

      {/* 5. Lecture Notes Template */}
      {pattern === 'lecture-notes' && (
        <g>
          <rect x="40" y="40" width={width - 80} height="60" rx="6" fill={colors.headerBg} stroke={colors.line} />
          <text x="60" y="76" fill={colors.text} fontSize="16" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            LECTURE / COURSE NOTES
          </text>
          {Array.from({ length: Math.floor((height - 140) / 30) }).map((_, i) => (
            <line
              key={i}
              x1="40"
              y1={130 + i * 30}
              x2={width - 40}
              y2={130 + i * 30}
              stroke={colors.line}
              strokeWidth="0.9"
            />
          ))}
          <line x1="200" y1="110" x2="200" y2={height - 40} stroke={colors.margin} strokeWidth="1.2" />
          <text x="60" y="135" fill={colors.text} fontSize="11" fontWeight="bold" opacity="0.4">
            QUESTIONS / TERMS
          </text>
        </g>
      )}

      {/* 6. Code + Notes Split Layout */}
      {pattern === 'code-split' && (
        <g>
          {/* Vertical Split Line at 42% width */}
          <line x1={width * 0.42} y1="0" x2={width * 0.42} y2={height} stroke={colors.line} strokeWidth="2" />
          {/* Left: Handwritten notes lined */}
          <text x="30" y="35" fill={colors.text} fontSize="13" fontWeight="bold" opacity="0.6">
            ANNOTATIONS & ARCHITECTURE
          </text>
          {Array.from({ length: Math.floor((height - 60) / 32) }).map((_, i) => (
            <line
              key={i}
              x1="20"
              y1={60 + i * 32}
              x2={width * 0.42 - 20}
              y2={60 + i * 32}
              stroke={colors.line}
              strokeWidth="0.8"
            />
          ))}
          {/* Right: Code editor grid zone */}
          <text x={width * 0.42 + 25} y="35" fill={colors.text} fontSize="13" fontWeight="bold" opacity="0.6">
            CODE IMPLEMENTATION / SYNTAX
          </text>
          <rect
            x={width * 0.42 + 15}
            y="50"
            width={width * 0.58 - 35}
            height={height - 75}
            rx="6"
            fill={colors.headerBg}
            stroke={colors.line}
          />
        </g>
      )}
    </svg>
  );
};
