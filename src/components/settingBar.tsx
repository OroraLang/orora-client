import React, { useCallback } from 'react';
import { MdDeleteOutline } from 'react-icons/md';
import TripleToggleSwitch from './triple';
import { StatusType } from '@/lib/orora';

type CellValueType = string | number | boolean;

const SettingBar: React.FC<{
  onDelete: () => void;
  updateShowStatus: (status: StatusType) => void;
  showStatus: StatusType;
}> = React.memo(({ onDelete, updateShowStatus, showStatus }) => {
  const handleUpdateShowStatus = useCallback(
    (value: CellValueType) => {
      if (
        typeof value === 'string' &&
        (value === 'code' || value === 'both' || value === 'latex')
      ) {
        updateShowStatus(value);
      }
    },
    [updateShowStatus]
  );

  return (
    <div className='absolute right-2 transform -translate-y-1/2'>
      <div className='flex gap-2 items-center px-1 text-sm bg-gray-900 text-white rounded-sm opacity-30 hover:opacity-100 transition-opacity duration-200 shadow-md'>
        <div className='w-full'>
          <TripleToggleSwitch
            labels={{
              left: { title: 'Code', value: 'code' },
              center: { title: 'Both', value: 'both' },
              right: { title: 'LaTeX', value: 'latex' },
            }}
            onChange={handleUpdateShowStatus}
            value={showStatus}
          />
        </div>
        |
        <button onClick={onDelete} className='flex items-center'>
          <MdDeleteOutline />
          <p>Delete</p>
        </button>
      </div>
    </div>
  );
});

SettingBar.displayName = 'SettingBar';

export default SettingBar;
