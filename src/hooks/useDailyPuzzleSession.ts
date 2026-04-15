import { useCallback, useEffect, useState } from 'react';
import { getDailyPuzzle, getHistoryPuzzles } from '../puzzles/database';
import type { DailyPuzzleData, HistoryPuzzleData } from '../puzzles/types';

interface SavedCompletion {
  time: number;
}

interface DailyPuzzleSessionState {
  daily: DailyPuzzleData | null;
  history: HistoryPuzzleData[];
  started: boolean;
  startTime: number | null;
  elapsedTime: number;
  attemptCompleted: boolean;
  resultTime: number;
  resultOpen: boolean;
  savedCompletion: SavedCompletion | null;
}

function getStorageKey(dateStr: string) {
  return `puzzle-completion-${dateStr}`;
}

function readSavedCompletion(dateStr: string): SavedCompletion | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(getStorageKey(dateStr));
  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as SavedCompletion;
    return typeof data.time === 'number' ? data : null;
  } catch {
    return null;
  }
}

function createInitialSessionState(): DailyPuzzleSessionState {
  const daily = getDailyPuzzle();
  const history = daily ? getHistoryPuzzles(daily.daysSinceStart) : [];
  const savedCompletion = daily ? readSavedCompletion(daily.dateStr) : null;

  return {
    daily,
    history,
    started: !!savedCompletion,
    startTime: savedCompletion ? Date.now() : null,
    elapsedTime: savedCompletion?.time ?? 0,
    attemptCompleted: !!savedCompletion,
    resultTime: savedCompletion?.time ?? 0,
    resultOpen: false,
    savedCompletion,
  };
}

export function useDailyPuzzleSession() {
  const [initialState] = useState<DailyPuzzleSessionState>(() => createInitialSessionState());
  const [daily, setDaily] = useState<DailyPuzzleData | null>(initialState.daily);
  const [history] = useState<HistoryPuzzleData[]>(initialState.history);
  const [boardInstance, setBoardInstance] = useState(0);
  const [started, setStarted] = useState(initialState.started);
  const [startTime, setStartTime] = useState<number | null>(initialState.startTime);
  const [elapsedTime, setElapsedTime] = useState(initialState.elapsedTime);
  const [attemptCompleted, setAttemptCompleted] = useState(initialState.attemptCompleted);
  const [resultTime, setResultTime] = useState(initialState.resultTime);
  const [resultOpen, setResultOpen] = useState(initialState.resultOpen);
  const [savedCompletion, setSavedCompletion] = useState<SavedCompletion | null>(initialState.savedCompletion);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!started || !startTime || attemptCompleted) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptCompleted, started, startTime]);

  const saveCompletion = useCallback((time: number) => {
    if (!daily || typeof window === 'undefined') return;

    const existingCompletion = readSavedCompletion(daily.dateStr);
    if (existingCompletion) {
      setSavedCompletion(existingCompletion);
      return existingCompletion;
    }

    const nextCompletion = { time };
    localStorage.setItem(getStorageKey(daily.dateStr), JSON.stringify(nextCompletion));
    setSavedCompletion(nextCompletion);
    return nextCompletion;
  }, [daily]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setAttemptCompleted(false);
    setResultTime(savedCompletion?.time ?? 0);
    setResultOpen(false);
    setBoardInstance((value) => value + 1);
  }, [savedCompletion]);

  const handleRestart = useCallback(() => {
    setStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setAttemptCompleted(false);
    setResultTime(savedCompletion?.time ?? 0);
    setResultOpen(false);
    setBoardInstance((value) => value + 1);
  }, [savedCompletion]);

  const handleComplete = useCallback((finalTime: number) => {
    const persistedCompletion = saveCompletion(finalTime);
    setElapsedTime(finalTime);
    setAttemptCompleted(true);
    setResultTime(persistedCompletion?.time ?? finalTime);
    setResultOpen(true);
  }, [saveCompletion]);

  const handleViewResult = useCallback(() => {
    setResultTime(savedCompletion?.time ?? elapsedTime);
    setResultOpen(true);
  }, [elapsedTime, savedCompletion]);

  const closeCompletion = useCallback(() => {
    setResultOpen(false);
  }, []);

  const openHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const closeHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const loadHistoryPuzzle = useCallback((item: HistoryPuzzleData) => {
    const nextSavedCompletion = readSavedCompletion(item.dateStr);

    setDaily({
      puzzle: item.puzzle,
      template: item.template,
      index: item.index,
      daysSinceStart: item.daysSinceStart,
      dateStr: item.dateStr,
    });
    setStarted(!!nextSavedCompletion);
    setStartTime(nextSavedCompletion ? Date.now() : null);
    setElapsedTime(nextSavedCompletion?.time ?? 0);
    setAttemptCompleted(!!nextSavedCompletion);
    setResultTime(nextSavedCompletion?.time ?? 0);
    setResultOpen(false);
    setSavedCompletion(nextSavedCompletion);
    setBoardInstance(0);
    setShowHistory(false);
  }, []);

  return {
    daily,
    history,
    boardInstance,
    started,
    startTime,
    elapsedTime,
    attemptCompleted,
    resultTime,
    resultOpen,
    savedCompletion,
    showHistory,
    handleStart,
    handleRestart,
    handleComplete,
    handleViewResult,
    closeCompletion,
    openHistory,
    closeHistory,
    loadHistoryPuzzle,
  };
}
