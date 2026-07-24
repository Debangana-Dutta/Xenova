import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, Loader2 } from 'lucide-react';
import { productivityApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const DURATIONS = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_LABELS = {
  focus: 'Focus session',
  short_break: 'Short break',
  long_break: 'Long break',
};

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const FocusTimer = () => {
  const toast = useToast();
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [todaysMinutes, setTodaysMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await productivityApi.getFocusSessions();
      setSessions(data.sessions);
      const todayKey = new Date().toISOString().slice(0, 10);
      const minutes = data.sessions
        .filter((s) => s.sessionType === 'focus' && s.completed && s.startTime.slice(0, 10) === todayKey)
        .reduce((sum, s) => sum + s.duration, 0);
      setTodaysMinutes(minutes);
    } catch (error) {
      toast.error('Could not load your focus history');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const saveSession = useCallback(
    async (completedMode, durationMinutes) => {
      try {
        const { data } = await productivityApi.createFocusSession({
          duration: durationMinutes,
          sessionType: completedMode,
          startTime: startTimeRef.current || new Date().toISOString(),
          endTime: new Date().toISOString(),
          completed: true,
        });
        setSessions((prev) => [data.session, ...prev]);
        if (completedMode === 'focus') {
          setTodaysMinutes((prev) => prev + durationMinutes);
        }
      } catch (error) {
        toast.error('Could not save your session');
      }
    },
    [toast]
  );

  const handleModeComplete = useCallback(() => {
    const durationMinutes = DURATIONS[mode] / 60;
    saveSession(mode, durationMinutes);
    toast.success(`${MODE_LABELS[mode]} complete!`);

    if (mode === 'focus') {
      const nextCycles = cyclesCompleted + 1;
      setCyclesCompleted(nextCycles);
      const nextMode = nextCycles % 4 === 0 ? 'long_break' : 'short_break';
      setMode(nextMode);
      setSecondsLeft(DURATIONS[nextMode]);
    } else {
      setMode('focus');
      setSecondsLeft(DURATIONS.focus);
    }
    setRunning(false);
    startTimeRef.current = null;
  }, [mode, cyclesCompleted, saveSession, toast]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    if (!startTimeRef.current) {
      startTimeRef.current = new Date().toISOString();
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      handleModeComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const toggleRunning = () => {
    if (!running && !startTimeRef.current) {
      startTimeRef.current = new Date().toISOString();
    }
    setRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
    startTimeRef.current = null;
  };

  const switchMode = (nextMode) => {
    setRunning(false);
    setMode(nextMode);
    setSecondsLeft(DURATIONS[nextMode]);
    startTimeRef.current = null;
  };

  const progress = 1 - secondsLeft / DURATIONS[mode];
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const ringColor = mode === 'focus' ? '#dc8d20' : '#548a62';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Focus & Study
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          A calm Pomodoro timer to protect your deep work
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timer */}
        <div className="card flex flex-col items-center p-8 lg:col-span-2">
          <div className="mb-6 flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {['focus', 'short_break', 'long_break'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m
                    ? 'bg-white text-zinc-900 shadow-subtle dark:bg-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="relative flex h-72 w-72 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={RADIUS} stroke="currentColor" strokeWidth="10" fill="none" className="text-zinc-100 dark:text-zinc-800" />
              <circle
                cx="120"
                cy="120"
                r={RADIUS}
                stroke={ringColor}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              {mode === 'focus' ? (
                <BrainCircuit size={20} className="mb-2 text-amber-500" />
              ) : (
                <Coffee size={20} className="mb-2 text-sage-500" />
              )}
              <span className="font-mono text-5xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatTime(secondsLeft)}
              </span>
              <span className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                {MODE_LABELS[mode]}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={toggleRunning} className="btn-primary px-6">
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button onClick={resetTimer} className="btn-secondary px-6">
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Today's total focus time:{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {(todaysMinutes / 60).toFixed(1)}h
            </span>
          </p>
        </div>

        {/* Session history */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Session history
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              No sessions yet. Start your first focus block above.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {sessions.map((s) => (
                <li
                  key={s._id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    {s.sessionType === 'focus' ? (
                      <BrainCircuit size={14} className="text-amber-500" />
                    ) : (
                      <Coffee size={14} className="text-sage-500" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {MODE_LABELS[s.sessionType]}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {new Date(s.startTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">{s.duration}m</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
