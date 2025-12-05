import React, { useState, useEffect, useRef } from 'react';

interface EditableProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  tagName?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const Editable: React.FC<EditableProps> = ({ 
  value, 
  onChange, 
  className = '', 
  multiline = false,
  tagName = 'span'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const Tag = tagName as any;

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as any}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className={`w-full bg-white border border-indigo-300 rounded p-1 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y text-gray-900 ${className}`}
          style={{ font: 'inherit' }}
        />
      );
    }
    return (
      <input
        ref={inputRef as any}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border border-indigo-300 rounded px-1 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 ${className}`}
        style={{ font: 'inherit' }}
      />
    );
  }

  return (
    <Tag 
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-gray-100/50 hover:ring-1 hover:ring-gray-300 rounded px-0.5 transition-shadow duration-200 ${className}`}
      title="点击编辑"
    >
      {value}
    </Tag>
  );
};