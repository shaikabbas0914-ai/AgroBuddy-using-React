import React from 'react';
import './Button.css';

const Button = ({ text, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`btn btn-${variant} ${className}`}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
