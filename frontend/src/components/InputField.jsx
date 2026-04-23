import React from 'react';
import './InputField.css';

const InputField = ({ label, type = 'text', placeholder, value, onChange, name, error, required = false }) => {
  return (
    <div className="input-group">
      {label && <label className="input-label" htmlFor={name}>{label} {required && '*'}</label>}
      <input
        id={name}
        name={name}
        type={type}
        className={`input-field ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default InputField;
