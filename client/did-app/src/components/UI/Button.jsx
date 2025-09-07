import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const baseClasses = "btn";
  
  return (
    <button 
      type={type}
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;