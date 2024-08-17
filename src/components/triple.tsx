import React, { useRef, useEffect } from 'react';

type ValueType = string | number | boolean;

interface Label {
  title: string;
  value: ValueType;
}

interface Labels {
  left: Label;
  center: Label;
  right: Label;
}

interface TripleToggleSwitchProps {
  labels: Labels;
  onChange: (value: ValueType) => void;
  styles?: React.CSSProperties;
  value: ValueType;
}

const TripleToggleSwitch: React.FC<TripleToggleSwitchProps> = ({
  labels,
  onChange,
  styles,
  value,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const switchPosition = Object.entries(labels).find(
    ([, label]) => label.value === value
  )?.[0] as 'left' | 'center' | 'right';

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const newLeft =
        switchPosition === 'left'
          ? 0
          : switchPosition === 'center'
          ? containerWidth / 3
          : (containerWidth / 3) * 2;
      containerRef.current.style.setProperty('--slider-left', `${newLeft}px`);
    }
  }, [switchPosition]);

  const handleChange = (position: 'left' | 'center' | 'right') => {
    onChange(labels[position].value);
  };

  return (
    <div className='inline-block w-full' style={styles}>
      <div
        ref={containerRef}
        className='flex items-center justify-between h-full rounded-full bg-gray-700 relative overflow-hidden'
      >
        <div
          className='absolute top-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-300 ease-in-out'
          style={{
            width: 'calc(100% / 3)',
            transform: 'translateX(var(--slider-left, 0))',
          }}
        />
        {(['left', 'center', 'right'] as const).map((position) => (
          <React.Fragment key={position}>
            <input
              className='sr-only'
              onChange={() => handleChange(position)}
              checked={switchPosition === position}
              name='map-switch'
              id={position}
              type='radio'
              value={position}
            />
            <label
              className={`flex-1 z-10 flex items-center justify-center h-full rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                ${switchPosition === position ? 'text-gray-700' : 'text-white'}
              `}
              htmlFor={position}
            >
              <span className='w-12 text-sm font-medium text-center'>
                {labels[position].title}
              </span>
            </label>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TripleToggleSwitch;
