'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrora, Cell, StatusType } from '@/lib/orora';
import dynamic from 'next/dynamic';
import { useTransition, animated, config } from '@react-spring/web';
import {
  transitions,
  positions,
  Provider as AlertProvider,
  useAlert,
} from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';

const options = {
  position: positions.TOP_CENTER,
  timeout: 5000,
  transition: transitions.SCALE,
};

const OroraCell = dynamic(() => import('./OroraCell'), {
  loading: () => <div className='h-32 bg-gray-100 animate-pulse'></div>,
  ssr: false,
});

type AnimatedCellItem =
  | { type: 'button'; id: string; index: number }
  | { type: 'cell'; id: string; cell: Cell };

const AddCellButton: React.FC<{
  index: number;
  addCell: (index: number) => void;
}> = React.memo(({ index, addCell }) => (
  <div className='relative -my-3 z-10'>
    <div className='absolute left-1/2 transform -translate-x-1/2 -translate-y-7'>
      <button
        onClick={() => addCell(index)}
        className='px-2 text-sm bg-green-500 text-white rounded-md opacity-40 hover:opacity-100 transition-opacity duration-200 shadow-md'
      >
        + Add Code
      </button>
    </div>
  </div>
));

AddCellButton.displayName = 'AddCellButton';

const LatexConvertButton: React.FC<{ title: string; cells: Cell[] }> = ({
  title,
  cells,
}) => {
  const [latexForm, setLatexForm] = useState<string>('');
  const [latexContent, setLatexContent] = useState<string>('');
  const alert = useAlert();

  useEffect(() => {
    fetch('/latex-form.tex')
      .then((response) => response.text())
      .then((data) => {
        setLatexForm(data);
      })
      .catch((error) => console.error('Error loading LaTeX content:', error));
  }, []);

  useEffect(() => {
    const mergedContent = cells
      .map((cell) => {
        const contentWithMarker = cell.content;
        const outputFormatted = cell.output
          .map((line) => `${line}\n`)
          .join('\n');
        return `${contentWithMarker}\n\n\\vspace{0.5em}\\tbox{${outputFormatted}}`;
      })
      .join('\n\n\\vspace{1em}\n\n');

    setLatexContent(mergedContent);
  }, [cells]);

  // useEffect(() => {
  //   setLatexContent(cells.map((cell) => cell.content).join('\\\\\n\n'));
  // }, [cells]);

  const handleConvert = async () => {
    try {
      console.log(
        `${latexForm}\n\\title{${title}}\\author{}\\begin{document}\\maketitle\n${latexContent}\n\\end{document}`
      );
      alert.show('Converting to PDF...', { type: 'info' });
      console.log("Sending request to 'http://localhost:16842/convert-latex'");
      const response = await fetch('http://localhost:16842/convert-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex: String(
            `${latexForm}\n\\title{${title}}\\author{}\\begin{document}\\maketitle\n${latexContent}\n\\end{document}`
          ),
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener, noreferrer');
        alert.success('Converted to PDF successfully');
      } else {
        console.error('Failed to convert LaTeX');
        alert.error('Failed to convert LaTeX');
      }
    } catch (error) {
      console.error('Error:', error);
      alert.error('Failed to convert LaTeX');
    }
  };

  return (
    <button
      className='bg-blue-500 text-white px-2 rounded hover:bg-blue-600 transition-colors duration-200'
      onClick={handleConvert}
    >
      Convert to PDF
    </button>
  );
};

const OroraApp: React.FC = () => {
  const {
    getCells,
    addCell,
    updateCell,
    deleteCell,
    deleteOutput,
    executeCell,
    isConnected,
    error,
    getCell,
    selectedCellId,
    setSelectedCellId,
    updateCellShowStatus,
  } = useOrora();
  const [isClient, setIsClient] = useState(false);
  const [projectName, setProjectName] = useState('ORORA Project');
  const [latexForm, setLatexForm] = useState<string>('');
  const [cells, setCells] = useState<Cell[]>([]);

  useEffect(() => {
    setCells(getCells());
    if (cells.length > 0 && !selectedCellId) {
      setSelectedCellId(cells[0].id);
    }
  }, [getCells, cells, selectedCellId, setSelectedCellId]);

  useEffect(() => {
    setIsClient(true);

    fetch('/latex-form.tex')
      .then((response) => response.text())
      .then((data) => {
        setLatexForm(data);
      })
      .catch((error) => console.error('Error loading LaTeX content:', error));
  }, []);

  useEffect(() => {
    if (cells.length > 0 && !selectedCellId) {
      setSelectedCellId(cells[0].id);
    }
  }, [cells, selectedCellId, setSelectedCellId]);

  const memoizedAddCell = useCallback(
    (index?: number) => {
      const newCellId = addCell(index);
      setSelectedCellId(newCellId);
    },
    [addCell, setSelectedCellId]
  );

  const memoizedUpdateCell = useCallback(
    (id: string, value: string) => {
      updateCell(id, value);
      setSelectedCellId(id);
    },
    [updateCell, setSelectedCellId]
  );

  const memoizedExecuteCell = useCallback(
    (cell: Cell) => {
      if (!selectedCellId) {
        console.warn(`Attempted to execute inactive cell: ${cell.id}`);
      }
      const selectedCell = getCell(selectedCellId as string);
      if (selectedCell) {
        executeCell(selectedCell.id, selectedCell.content);
      }
    },
    [executeCell, selectedCellId, getCell]
  );

  const items: AnimatedCellItem[] = useMemo(() => {
    return cells
      .flatMap((cell, index): AnimatedCellItem[] => [
        { type: 'button' as const, id: `${latexForm}button-${index}`, index },
        { type: 'cell' as const, id: cell.id, cell },
      ])
      .concat({
        type: 'button' as const,
        id: `button-${cells.length}`,
        index: cells.length,
      });
  }, [cells, latexForm]);

  const transitions = useTransition(items, {
    keys: (item) => item.id,
    from: {
      opacity: 0,
      height: (item: AnimatedCellItem) => (item.type === 'button' ? 32 : 0),
    },
    enter: {
      opacity: 1,
      height: (item: AnimatedCellItem) =>
        item.type === 'button' ? 32 : 'auto',
    },
    leave: { opacity: 0, height: 0 },
    config: { ...config.gentle, duration: 200 },
  });

  const memoizedCells = useMemo(
    () =>
      transitions((style, item) => (
        <animated.div style={style} key={item.id}>
          {item.type === 'button' ? (
            <AddCellButton
              key={`add-${item.index}`}
              index={item.index}
              addCell={memoizedAddCell}
            />
          ) : isClient ? (
            <React.Suspense
              fallback={<div className='h-32 bg-gray-100 animate-pulse'></div>}
            >
              <OroraCell
                key={item.cell.id}
                cell={item.cell}
                updateCell={memoizedUpdateCell}
                deleteCell={deleteCell}
                executeCell={memoizedExecuteCell}
                isSelected={selectedCellId === item.cell.id}
                onSelect={() => setSelectedCellId(item.cell.id)}
                updateShowStatus={updateCellShowStatus}
                selectedCellId={selectedCellId}
                deleteOutput={deleteOutput}
              />
            </React.Suspense>
          ) : null}
        </animated.div>
      )),
    [
      transitions,
      isClient,
      memoizedUpdateCell,
      deleteCell,
      deleteOutput,
      memoizedExecuteCell,
      memoizedAddCell,
      selectedCellId,
      setSelectedCellId,
      updateCellShowStatus,
    ]
  );

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen bg-red-100'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-red-500'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AlertProvider template={AlertTemplate} {...options}>
      <div className='flex flex-col h-screen'>
        <header className='bg-white shadow sticky top-0 z-50'>
          <div className='w-full flex py-3 px-4 items-center justify-between sm:px-6 lg:px-8'>
            <div className='h-full flex items-center gap-8'>
              <h1 className='text-3xl text-gray-900'>Orora</h1>
              <input
                type='text'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className='block pt-1 text-2xl h-full font-large text-gray-900'
                placeholder='Project Name'
              />
            </div>
            <div className='flex gap-4'>
              <LatexConvertButton title={projectName} cells={cells} />
              {isConnected ? (
                <div className='text-center'>
                  <p className='text-green-600'>Connected to Orora server</p>
                  <p className='text-xs'>
                    Server URL : {process.env.NEXT_PUBLIC_API_URL}
                  </p>
                </div>
              ) : (
                <p className='text-red-600'>Not connected to Orora server</p>
              )}
            </div>
          </div>
        </header>
        <div className='scrollbar flex-1 bg-gray-100 w-full h-full overflow-y-scroll pb-36 px-6 pt-16'>
          {memoizedCells}
        </div>
      </div>
    </AlertProvider>
  );
};

export default OroraApp;
