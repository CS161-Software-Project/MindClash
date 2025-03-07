// import React from 'react';
// import "../styles/Loader.css"

// const Loader = ({ size = 'medium', text = 'Loading your brain battle...' }) => {
//   return (
//     <div className="loader-container">
//       <div className={`brain-loader ${size}`}>
//         <div className="brain">
//           <div className="brain-half brain-left">
//             <div className="brain-segment segment-1"></div>
//             <div className="brain-segment segment-2"></div>
//             <div className="brain-segment segment-3"></div>
//           </div>
//           <div className="brain-half brain-right">
//             <div className="brain-segment segment-1"></div>
//             <div className="brain-segment segment-2"></div>
//             <div className="brain-segment segment-3"></div>
//           </div>
//         </div>
//         <div className="synapse-container">
//           {[...Array(8)].map((_, i) => (
//             <div 
//               key={i} 
//               className="synapse" 
//               style={{ 
//                 animationDelay: `${i * 0.15}s`,
//                 left: `${10 + Math.random() * 80}%`,
//                 top: `${10 + Math.random() * 80}%`
//               }}
//             ></div>
//           ))}
//         </div>
//       </div>
//       {text && <p className="loader-text">{text}</p>}
//     </div>
//   );
// };


import React, { useEffect, useState, useRef } from 'react';
import "../styles/Loader.css";

const Loader = () => {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [phase, setPhase] = useState(0);
  const letters = "MIND CLASH";
  const glitchRef = useRef(null);
  const containerRef = useRef(null);
  
  // Particle generator for background effects
  const Particles = () => {
    const count = 30;
    const particles = Array(count).fill().map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(p => (
          <div 
            key={p.id}
            className="absolute rounded-full bg-cyan-400 opacity-70"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              boxShadow: '0 0 8px currentColor',
              animation: `float ${p.duration}s infinite ease-in-out`,
              animationDelay: `${p.delay}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    // Create random glitch effects
    const glitchInterval = setInterval(() => {
      if (glitchRef.current) {
        const randomSkew = Math.random() * 5 - 2.5;
        const randomTranslateX = Math.random() * 10 - 5;
        
        glitchRef.current.style.transform = `skew(${randomSkew}deg) translateX(${randomTranslateX}px)`;
        
        setTimeout(() => {
          if (glitchRef.current) {
            glitchRef.current.style.transform = 'skew(0deg) translateX(0px)';
          }
        }, 100);
      }
    }, 2000);
    
    return () => clearInterval(glitchInterval);
  }, []);

  useEffect(() => {
    // Sequential animation phases
    if (phase === 0) {
      // Phase 0: Letters appear one by one
      if (visibleLetters < letters.length) {
        const timer = setTimeout(() => {
          setVisibleLetters(prev => prev + 1);
        }, 180); 
        
        return () => clearTimeout(timer);
      } else {
        // Move to phase 1 after small delay
        const phaseTimer = setTimeout(() => {
          setPhase(1);
        }, 800);
        
        return () => clearTimeout(phaseTimer);
      }
    } else if (phase === 1) {
      // Phase 1: Energize the logo for 2 seconds
      const phaseTimer = setTimeout(() => {
        setPhase(2);
      }, 2000);
      
      return () => clearTimeout(phaseTimer);
    }
  }, [visibleLetters, phase]);

  // Generate neon line grid in background
  const renderGrid = () => {
    const lines = [];
    const count = 6;
    
    for (let i = 0; i < count; i++) {
      // Horizontal lines
      lines.push(
        <div 
          key={`h-${i}`}
          className="absolute bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20"
          style={{
            height: '1px',
            width: '100%',
            top: `${(i+1) * 100 / (count+1)}%`,
            left: 0,
            animation: `pulseWidth 4s infinite ease-in-out`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      );
      
      // Vertical lines
      lines.push(
        <div 
          key={`v-${i}`}
          className="absolute bg-gradient-to-b from-cyan-500/20 to-fuchsia-500/20"
          style={{
            width: '1px',
            height: '100%',
            left: `${(i+1) * 100 / (count+1)}%`,
            top: 0,
            animation: `pulseHeight 4s infinite ease-in-out`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      );
    }
    
    return lines;
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center h-screen bg-gray-900 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)'
      }}
    >
      
      {/* Animated background */}
      <div className="absolute inset-0 opacity-40">
        {renderGrid()}
      </div>
      
      {/* Floating particles */}
      <Particles />
      
      {/* Orbit elements */}
      {phase > 0 && (
        <>
          <div className="absolute w-6 h-6 rounded-full bg-cyan-500/30 blur-sm"
            style={{ animation: 'orbit 8s linear infinite' }}
          />
          <div className="absolute w-4 h-4 rounded-full bg-fuchsia-500/30 blur-sm"
            style={{ animation: 'orbit 6s linear infinite reverse' }}
          />
        </>
      )}
      
      {/* Main content container */}
      <div 
        ref={glitchRef} 
        className="relative z-10 transition-all duration-300"
        style={{
          filter: phase > 0 ? 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))' : 'none',
          animation: phase > 0 ? 'energize 2s infinite' : 'none'
        }}
      >
        {/* Main text with 3D perspective */}
        <div className="text-6xl font-bold tracking-wider relative perspective" style={{ perspective: '1000px' }}>
          {letters.split('').map((letter, index) => {
            const isMind = index < 4;
            const isSpace = letter === ' ';
            const mainColor = isMind ? 'text-cyan-400' : 'text-fuchsia-500';
            
            return (
              <span 
                key={index} 
                className={`inline-block transition-all duration-500 relative
                  ${index < visibleLetters ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-16 scale-50'} 
                  ${isSpace ? 'mr-4' : ''}
                  ${mainColor}`}
                style={{ 
                  textShadow: '0 0 10px currentColor',
                  animationDelay: `${index * 0.2}s`,
                  animation: phase > 0 ? 'textShadowPulse 2s infinite' : 'none',
                  transform: phase > 1 && !isSpace ? `rotateY(${index * 45}deg)` : 'none',
                  transition: 'all 0.5s ease-out'
                }}
              >
                {letter}
                
                {/* Connected lines beneath letters */}
                {index < visibleLetters && !isSpace && (
                  <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-px h-8 bg-current opacity-50 mt-1"></div>
                    <div className="w-2 h-2 rounded-full bg-current mt-1 animate-pulse"></div>
                  </div>
                )}
              </span>
            );
          })}
        </div>
        
        {/* Circular elements that appear when all letters are visible */}
        {phase > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">
            <div className="w-64 h-64 rounded-full border border-cyan-500 opacity-30 animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-fuchsia-500 opacity-30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-cyan-400 opacity-40 animate-pulse"></div>
          </div>
        )}
        
        {/* Fancy progress bar */}
        <div className="mt-12 w-full max-w-md mx-auto relative h-1.5 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500"
            style={{ 
              width: `${(visibleLetters / letters.length) * 100}%`,
              transition: 'width 0.3s ease-out',
              animation: phase > 0 ? 'energize 2s infinite' : 'none',
              boxShadow: '0 0 10px currentColor'
            }}
          ></div>
          
          {/* Animated loading pulse markers */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white" 
            style={{ 
              left: `${(visibleLetters / letters.length) * 100}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px white',
              display: phase < 2 ? 'block' : 'none'
            }}
          />
        </div>
        
        {/* Status text */}
        <div className="mt-6 flex justify-center items-center">
          <div className="text-gray-400 text-sm font-mono tracking-wider">
            {phase === 0 
              ? `INITIALIZING... ${Math.round((visibleLetters / letters.length) * 100)}%` 
              : phase === 1 
                ? "ENERGIZING SYSTEM..."
                : "SYSTEM ONLINE"}
          </div>
          
          {/* Animated dots */}
          {phase < 2 && (
            <div className="flex space-x-1 ml-2">
              {[0, 1, 2].map((dot) => (
                <div 
                  key={dot} 
                  className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${dot * 0.2}s` }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Final state elements */}
        {phase === 2 && (
          <div className="mt-4 flex justify-center items-center space-x-3">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 text-xs border border-cyan-500/20 backdrop-blur-sm">
              MIND CONNECTED
            </div>
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400 text-xs border border-fuchsia-500/20 backdrop-blur-sm">
              CLASH ACTIVATED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default Loader;