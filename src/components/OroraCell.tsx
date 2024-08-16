import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Cell } from '@/lib/orora';
import { useSpring, animated } from 'react-spring';
import dynamic from 'next/dynamic';
import { MdDeleteOutline } from 'react-icons/md';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface OroraCellProps {
  cell: Cell;
  updateCell: (id: string, value: string) => void;
  deleteCell: (id: string) => void;
  executeCell: (cell: Cell) => void;
  isSelected: boolean;
  onSelect: () => void;
}

const OroraCell: React.FC<OroraCellProps> = ({
  cell,
  updateCell,
  deleteCell,
  executeCell,
  isSelected,
  onSelect,
}) => {
  const editorRef = useRef<any>(null);
  const [editorHeight, setEditorHeight] = useState<number | string>('auto');
  const outputRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<string[]>(cell.output);
  const [isClient, setIsClient] = useState(false);
  const [outputHeight, setOutputHeight] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [springProps, setSpringProps] = useSpring(() => ({
    height: 0,
    opacity: 0,
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  useEffect(() => {
    setOutput(cell.output);

    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newHeight = entry.contentRect.height;
          setOutputHeight(newHeight);
          setSpringProps({
            height: newHeight,
            opacity: newHeight > 0 ? 1 : 0,
          });
        }
      });

      resizeObserver.observe(contentRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [cell.output, setSpringProps]);

  const updateEditorHeight = useCallback(() => {
    if (editorRef.current) {
      const contentHeight = editorRef.current.getContentHeight();
      if (contentHeight) {
        setEditorHeight(contentHeight);
      }
    }
  }, []);

  const handleDeleteCell = useCallback(() => {
    deleteCell(cell.id);
  }, [deleteCell, cell.id]);

  const handleExecuteCell = useCallback(() => {
    if (isSelected) {
      executeCell(cell);
    } else {
      onSelect();
      setTimeout(() => executeCell(cell), 0);
    }
  }, [executeCell, cell, isSelected, onSelect]);

  const handleEditorDidMount = useCallback(
    (editor: any) => {
      editorRef.current = editor;
      editor.focus();

      editor.onDidContentSizeChange(updateEditorHeight);
      updateEditorHeight();
    },
    [updateEditorHeight]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        handleExecuteCell();
      }
    },
    [handleExecuteCell]
  );

  const handleClick = useCallback(() => {
    if (!isSelected) {
      onSelect();
    }
  }, [onSelect, isSelected]);

  if (!cell) {
    return null;
  }

  return (
    isClient && (
      <>
        <div className='w-full relative -my-3 z-10'>
          <div className='absolute right-2 transform -translate-y-1/2'>
            <div className='flex items-center px-1 text-sm bg-gray-900 text-white rounded-sm opacity-30 hover:opacity-100 transition-opacity duration-200 shadow-md'>
              <button onClick={handleDeleteCell} className='flex items-center'>
                <MdDeleteOutline />
                <p>Delete</p>
              </button>
            </div>
          </div>
        </div>
        <div
          className={`mb-8 border overflow-hidden h-auto transition-colors duration-200 ${
            isSelected ? 'bg-blue-50' : 'bg-white'
          }`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className='w-full pt-2 pr-2'>
            <Editor
              language='tex'
              theme='vs-white'
              value={cell.content}
              onChange={(value) => updateCell(cell.id, value || '')}
              options={{
                minimap: { enabled: false },
                fontFamily: 'font-code, serif',
                automaticLayout: true,
                scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                scrollBeyondLastLine: false,
                overviewRulerLanes: 0,
              }}
              height={editorHeight}
              onMount={handleEditorDidMount}
              className={isSelected ? 'bg-blue-50' : 'bg-white'}
            />
          </div>
          <div className='flex justify-between items-center p-2'>
            <div className='text-sm'>
              Status:{' '}
              <span
                className={`font-bold ${
                  cell.status === 'running'
                    ? 'text-yellow-500'
                    : cell.status === 'completed'
                    ? 'text-green-500'
                    : 'text-gray-500'
                }`}
              >
                {cell.status.charAt(0).toUpperCase() + cell.status.slice(1)}
              </span>
            </div>
            <button
              onClick={handleExecuteCell}
              className={`px-2 text-sm ${
                cell.status === 'running'
                  ? 'bg-gray-500'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded`}
              disabled={cell.status === 'running'}
            >
              {cell.status === 'running' ? 'Running...' : 'Run'}
            </button>
          </div>
          <animated.div
            ref={outputRef}
            style={springProps}
            className={`bg-gray-800 text-white overflow-hidden italic`}
          >
            <div ref={contentRef}>
              {cell.status === 'running' && output.length === 0 ? (
                <div className='flex items-center p-4 justify-center h-8'>
                  <div className='animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white'></div>
                </div>
              ) : output.length > 0 ? (
                <div className='p-4'>
                  <pre className='whitespace-pre-wrap break-words font-cmu leading-tight'>
                    {output.join('\n')}
                  </pre>
                </div>
              ) : null}
            </div>
          </animated.div>
        </div>
      </>
    )
  );
};

OroraCell.displayName = 'OroraCell';

export default OroraCell;
