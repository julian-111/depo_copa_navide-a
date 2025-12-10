import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;
