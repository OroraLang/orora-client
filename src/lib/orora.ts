import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type StatusType = 'code' | 'both' | 'latex';

export interface Cell {
  id: string;
  content: string;
  output: string[];
  status: 'idle' | 'running' | 'completed';
  showStatus: StatusType;
}

export interface OroraState {
  cells: Cell[];
  addCell: (index?: number) => string;
  updateCell: (id: string, content: string) => void;
  deleteCell: (id: string) => void;
  getCell: (id: string) => Cell | undefined;
  executeCell: (id: string, content: string) => void;
  isConnected: boolean;
  error: string | null;
  selectedCellId: string | null;
  setSelectedCellId: (id: string | null) => void;
  updateCellShowStatus: (id: string, showStatus: StatusType) => void;
}

const sanitizeJsonString = (str: string): string => {
  return str.replace(/[\n\r\t\b\f\v]/g, (match) => {
    const escapes: { [key: string]: string } = {
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\b': '\\b',
      '\f': '\\f',
      '\v': '\\v',
    };
    return escapes[match] || '';
  });
};

const getWebSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in .env.local');
  }
  return apiUrl.replace(/^http/, 'ws');
};

export function useOrora(): OroraState {
  const [cells, setCells] = useState<Cell[]>([
    {
      id: uuidv4(),
      content: '',
      output: [],
      status: 'idle',
      showStatus: 'code',
    },
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(
    cells[0].id
  );
  const ws = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    try {
      const WS_URL = getWebSocketUrl();
      console.log('Attempting to connect WebSocket to:', WS_URL);
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data);
        try {
          const sanitizedData = sanitizeJsonString(event.data);
          const data = JSON.parse(sanitizedData);
          if (data.type === 'execution_status') {
            console.log('Updating cell with execution status:', data);
            setCells((prevCells) =>
              prevCells.map((cell) => {
                if (cell.id === data.id) {
                  const newLines = data.result
                    .split('\n')
                    .filter((line: string) => line !== '');
                  if (data.status === 'running') {
                    return {
                      ...cell,
                      status: 'running',
                      output: [...cell.output, ...newLines],
                    };
                  } else if (data.status === 'completed') {
                    if (newLines.length === 0 && cell.output.length == 0) {
                      newLines.push('No output');
                    }

                    return {
                      ...cell,
                      status: 'completed',
                      output: [...cell.output, ...newLines],
                    };
                  }
                }
                return cell;
              })
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Problematic message:', event.data);
          if (error instanceof SyntaxError) {
            console.error('JSON parse error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          }
          setCells((prevCells) =>
            prevCells.map((cell) => ({
              ...cell,
              status: 'completed',
              output: [
                ...cell.output,
                'Error: Failed to parse server response',
              ],
            }))
          );
        }
      };
    } catch (error) {
      console.error('Error in connectWebSocket:', error);
      setError((error as Error).message);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  const addCell = useCallback((index?: number) => {
    const newCellId = uuidv4();
    setCells((prevCells) => {
      const newCell: Cell = {
        id: newCellId,
        content: '',
        output: [],
        status: 'idle',
        showStatus: 'code',
      };
      if (index === undefined) {
        return [...prevCells, newCell];
      } else {
        return [
          ...prevCells.slice(0, index),
          newCell,
          ...prevCells.slice(index),
        ];
      }
    });
    setSelectedCellId(newCellId);
    return newCellId;
  }, []);

  const updateCell = useCallback((id: string, content: string) => {
    setCells((cells) =>
      cells.map((selectCell) =>
        selectCell.id === id ? { ...selectCell, content } : selectCell
      )
    );
    setSelectedCellId(id);
  }, []);

  const deleteCell = useCallback(
    (id: string) => {
      setCells((prevCells) => {
        const index = prevCells.findIndex((cell) => cell.id === id);
        if (index === -1) return prevCells;

        const newCells = prevCells.filter((cell) => cell.id !== id);

        if (id === selectedCellId) {
          if (newCells.length === 0) {
            setSelectedCellId(null);
          } else if (index < newCells.length) {
            setSelectedCellId(newCells[index].id);
          } else {
            setSelectedCellId(newCells[newCells.length - 1].id);
          }
        }

        return newCells;
      });
    },
    [selectedCellId]
  );

  const getCell = useCallback(
    (id: string): Cell | undefined => {
      const cell = cells.find((cell) => cell.id === id);
      if (!cell) {
        console.warn(`Cell with id ${id} not found`);
      }
      return cell;
    },
    [cells]
  );

  const executeCell = useCallback(
    (id: string, content: string) => {
      const cellToExecute = getCell(id);
      if (!cellToExecute) {
        console.error(`Cell with id ${id} not found`);
        return;
      }

      // console.log('Executing cell:', cellToExecute.content);

      setCells((cells) =>
        cells.map((cell) =>
          cell.id === id ? { ...cell, status: 'running', output: [] } : cell
        )
      );

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: 'execute',
          id: id,
          code: content,
        });
        console.log('Sending WebSocket message:', message);
        ws.current.send(message);
      } else {
        console.error('WebSocket is not connected');
        setCells((cells) =>
          cells.map((cell) =>
            cell.id === id
              ? {
                  ...cell,
                  status: 'completed',
                  output: ['Error: WebSocket not connected'],
                }
              : cell
          )
        );
      }
    },
    [getCell]
  );

  const updateCellShowStatus = useCallback(
    (id: string, showStatus: StatusType) => {
      setCells((prevCells) =>
        prevCells.map((cell) =>
          cell.id === id ? { ...cell, showStatus } : cell
        )
      );
    },
    []
  );

  return {
    cells,
    addCell,
    updateCell,
    deleteCell,
    getCell,
    executeCell,
    isConnected,
    error,
    selectedCellId,
    setSelectedCellId,
    updateCellShowStatus,
  };
}
