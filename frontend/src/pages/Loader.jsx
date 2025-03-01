import React from 'react';
import "../styles/Loader.css"

const Loader = ({ size = 'medium', text = 'Loading your brain battle...' }) => {
  return (
    <div className="loader-container">
      <div className={`brain-loader ${size}`}>
        <div className="brain">
          <div className="brain-half brain-left">
            <div className="brain-segment segment-1"></div>
            <div className="brain-segment segment-2"></div>
            <div className="brain-segment segment-3"></div>
          </div>
          <div className="brain-half brain-right">
            <div className="brain-segment segment-1"></div>
            <div className="brain-segment segment-2"></div>
            <div className="brain-segment segment-3"></div>
          </div>
        </div>
        <div className="synapse-container">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="synapse" 
              style={{ 
                animationDelay: `${i * 0.15}s`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`
              }}
            ></div>
          ))}
        </div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;