import { Button } from "@srdl/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@srdl/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@srdl/ui/components/tabs";
import { useEffect, useRef, useState } from "react";

const TIMER_PRESETS = [
  { label: "30s", valueMs: 30_000 },
  { label: "1 minute", valueMs: 60_000 },
  { label: "2 minutes", valueMs: 120_000 },
  { label: "3 minutes", valueMs: 180_000 },
  { label: "5 minutes", valueMs: 300_000 },
] as const;

type TimerPreset = (typeof TIMER_PRESETS)[number];

const DEFAULT_TIMER_PRESET_MS = TIMER_PRESETS[0].valueMs;

const formatRemainingTime = (remainingMs: number): string => {
  const totalTenths = Math.max(0, Math.floor(remainingMs / 100));
  const totalSeconds = Math.floor(totalTenths / 10);
  const tenths = totalTenths % 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const secondsLabel = String(seconds).padStart(2, "0");

  return `${String(minutes).padStart(2, "0")}:${secondsLabel}.${tenths}`;
};

export function Timer(): JSX.Element {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedDurationMs, setSelectedDurationMs] = useState<number>(DEFAULT_TIMER_PRESET_MS);
  const [remainingMs, setRemainingMs] = useState<number>(DEFAULT_TIMER_PRESET_MS);
  const timerEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const tick = () => {
      if (timerEndTimeRef.current === null) {
        setIsTimerRunning(false);
        return;
      }

      const nextRemainingMs = Math.max(0, timerEndTimeRef.current - Date.now());

      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs <= 0) {
        setIsTimerRunning(false);
        timerEndTimeRef.current = null;
      }
    };

    tick();

    const intervalId = window.setInterval(tick, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTimerRunning]);

  const handleDurationChange = (durationValue: string): void => {
    const nextDurationMs = Number.parseInt(durationValue, 10) as TimerPreset["valueMs"];

    setSelectedDurationMs(nextDurationMs);
    setRemainingMs(nextDurationMs);

    if (isTimerRunning) {
      setIsTimerRunning(false);
    }

    timerEndTimeRef.current = null;
  };

  const handleTimerStart = (): void => {
    timerEndTimeRef.current = Date.now() + selectedDurationMs;
    setRemainingMs(selectedDurationMs);
    setIsTimerRunning(true);
  };

  const handleTimerStop = (): void => {
    setIsTimerRunning(false);
    timerEndTimeRef.current = null;
  };

  const handleTimerReset = (): void => {
    setIsTimerRunning(false);
    timerEndTimeRef.current = null;
    setRemainingMs(selectedDurationMs);
  };

  const selectedPresetLabel =
    TIMER_PRESETS.find((preset) => preset.valueMs === selectedDurationMs)?.label ??
    DEFAULT_TIMER_PRESET_MS.toString();

  return (
    <Tabs defaultValue="timer" className="flex w-full flex-col gap-2">
      <TabsList className="h-auto w-full justify-start gap-2">
        <TabsTrigger value="timer" className="shrink-0">
          Timer
        </TabsTrigger>
      </TabsList>
      <TabsContent value="timer" className="space-y-4 pt-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">Timer preset</p>
          <Select onValueChange={handleDurationChange} value={selectedDurationMs.toString()}>
            <SelectTrigger>
              <SelectValue>{selectedPresetLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMER_PRESETS.map((preset: TimerPreset) => (
                <SelectItem key={preset.valueMs} value={preset.valueMs.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Countdown</p>
          <p aria-live="polite" className="font-mono text-2xl font-semibold tabular-nums">
            {formatRemainingTime(remainingMs)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="w-full sm:w-auto"
            disabled={isTimerRunning}
            onClick={() => {
              handleTimerStart();
            }}
          >
            Start
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={!isTimerRunning}
            onClick={() => {
              handleTimerStop();
            }}
            variant="outline"
          >
            Stop
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              handleTimerReset();
            }}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
