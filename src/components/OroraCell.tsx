import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Cell, StatusType } from '@/lib/orora';
import { useSpring, animated } from '@react-spring/web';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import SettingBar from './settingBar';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface OroraCellProps {
  cell: Cell;
  updateCell: (id: string, value: string) => void;
  deleteCell: (id: string) => void;
  executeCell: (cell: Cell) => void;
  isSelected: boolean;
  onSelect: () => void;
  selectedCellId: string | null;
  updateShowStatus: (id: string, status: StatusType) => void;
  deleteOutput: (id: string) => void;
}

const OroraCell: React.FC<OroraCellProps> = ({
  cell,
  updateCell,
  deleteCell,
  executeCell,
  isSelected,
  onSelect,
  updateShowStatus,
  selectedCellId,
  deleteOutput,
}) => {
  const editorRef = useRef<any>(null);
  const [editorHeight, setEditorHeight] = useState<number | string>('auto');
  const outputRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<string[]>(cell.output);
  const [isClient, setIsClient] = useState(false);

  const [springProps, setSpringProps] = useSpring(() => ({
    height: 0,
    opacity: 0,
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  const [selectedSpringProps, setSelectedSpringProps] = useSpring(() => ({
    backgroundColor: 'rgba(255, 255, 255, 1)', // white
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  const [settingBarSpringProps, setSettingBarSpringProps] = useSpring(() => ({
    opacity: 0,
    transform: 'translateY(-10px)',
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  useEffect(() => {
    setSelectedSpringProps({
      backgroundColor: isSelected
        ? 'rgba(239, 246, 255, 1)'
        : 'rgba(255, 255, 255, 1)', // blue-50 : white
    });

    setSettingBarSpringProps({
      opacity: isSelected ? 1 : 0,
      transform: isSelected ? 'translateY(0px)' : 'translateY(-10px)',
    });
  }, [isSelected, setSelectedSpringProps, setSettingBarSpringProps]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setOutput(cell.output);

    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const newHeight = entry.contentRect.height;
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

  // const handleUpdateShowStatus = useCallback(
  //   (status: StatusType) => {
  //     updateShowStatus(selectedCellId as string, status);
  //   },
  //   [updateShowStatus, selectedCellId]
  // );

  const handleUpdateShowStatus = useCallback(
    (status: StatusType) => {
      updateShowStatus(selectedCellId as string, status);
    },
    [updateShowStatus, selectedCellId]
  );

  const handleExecuteCell = useCallback(() => {
    if (selectedCellId === cell.id) {
      executeCell(cell);
    } else {
      onSelect();
      setTimeout(() => executeCell(cell), 0);
    }
  }, [executeCell, cell, onSelect, selectedCellId]);

  const handleDeleteOutput = useCallback(() => {
    deleteOutput(cell.id);
  }, [deleteOutput, cell.id]);

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
  const unifyLatexDelimiters = (text: string): string => {
    return text.replace(/\$\$(.*?)\$\$/g, (_, latex) => `$${latex}$`);
  };

  const splitContent = (text: string): string[] => {
    const parts: string[] = [];
    let isInLatex = false;
    let currentPart = '';

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
        if (isInLatex) {
          currentPart += '$';
          parts.push(currentPart);
          currentPart = '';
        } else {
          if (currentPart) parts.push(currentPart);
          currentPart = '$';
        }
        isInLatex = !isInLatex;
      } else {
        currentPart += text[i];
      }
    }

    if (currentPart) parts.push(currentPart);
    return parts;
  };

  const unifiedContent = unifyLatexDelimiters(cell.content);
  const parts = splitContent(unifiedContent);

  return (
    isClient && (
      <>
        <animated.div
          style={settingBarSpringProps}
          className='w-full relative -my-3 z-10'
        >
          <SettingBar
            key={cell.id}
            onDelete={handleDeleteCell}
            updateShowStatus={handleUpdateShowStatus}
            showStatus={cell.showStatus}
          />
        </animated.div>
        <animated.div
          style={selectedSpringProps}
          className={`mb-8 overflow-hidden h-auto`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className='w-full pt-2 pr-2'>
            {(cell.showStatus === 'both' || cell.showStatus === 'code') && (
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
                className=''
              />
            )}
            {(cell.showStatus === 'both' || cell.showStatus === 'latex') && (
              <div
                className={`px-4 flex flex-col ${
                  cell.showStatus === 'both' && 'mt-2'
                }`}
              >
                {parts.map((part, index) => {
                  if (part.startsWith('$') && part.endsWith('$')) {
                    if (part === '$$') return null;
                    return (
                      <>
                        <Latex
                          key={index}
                          macros={{ '\\otherwise': '\\text{otherwise}' }}
                        >
                          {part}
                        </Latex>
                      </>
                    );
                  } else {
                    return <span key={index}>{part}</span>;
                  }
                })}

                {/* <Latex
                  macros={{ '\\otherwise': '\\text{otherwise}' }}
                >{`${cell.content}`}</Latex> */}
              </div>
            )}
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
            <div className='flex gap-2'>
              <button
                onClick={handleDeleteOutput}
                className={`px-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded`}
                disabled={cell.output.length === 0}
              >
                Delete Output
              </button>
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
          </div>
          <animated.div
            ref={outputRef}
            style={springProps}
            className={`bg-gray-800 text-white overflow-hidden italic`}
          >
            <div ref={contentRef}>
              {cell.status === 'running' && output.length === 0 ? (
                <div className='flex items-center p-4 justify-center h-8'>
                  <div className='animate-spin rounded-full h-4 w-4'></div>
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
        </animated.div>
      </>
    )
  );
};

OroraCell.displayName = 'OroraCell';

export default OroraCell;
