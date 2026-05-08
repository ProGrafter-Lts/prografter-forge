import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, RotateCcw, Type } from "lucide-react";
import { toast } from "sonner";

interface Props {
  transcript: string;
  onChange: (value: string) => void;
}

const MAX_SECONDS = 60;

// Web Speech API (browser-vendor prefixed)
type AnyWindow = typeof window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  SpeechRecognition?: new () => SpeechRecognitionLike;
};
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
  resultIndex: number;
}

export const QuickBuildVoiceRecorder = ({ transcript, onChange }: Props) => {
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [manualMode, setManualMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef(transcript);
  const timerRef = useRef<number | null>(null);

  const supported =
    typeof window !== "undefined" &&
    !!(
      (window as AnyWindow).webkitSpeechRecognition ||
      (window as AnyWindow).SpeechRecognition
    );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const start = () => {
    if (!supported) {
      setManualMode(true);
      toast.error("Voice input not supported in this browser. Type instead.");
      return;
    }
    const Ctor =
      (window as AnyWindow).SpeechRecognition ??
      (window as AnyWindow).webkitSpeechRecognition!;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-GB";
    finalRef.current = transcript;
    rec.onresult = (e) => {
      let interim = "";
      let final = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      finalRef.current = final;
      onChange((final + interim).trim());
    };
    rec.onerror = (ev) => {
      toast.error(`Voice error: ${ev.error ?? "unknown"}`);
      stop();
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
    setSecondsLeft(MAX_SECONDS);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = () => {
    stop();
    finalRef.current = "";
    onChange("");
    setSecondsLeft(MAX_SECONDS);
  };

  if (manualMode || !supported) {
    return (
      <div className="space-y-2">
        <Textarea
          value={transcript}
          onChange={(e) => onChange(e.target.value.slice(0, 4000))}
          placeholder="Describe the job in your own words — what you're quoting for, the scope, materials, anything unusual."
          rows={6}
        />
        {supported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManualMode(false)}
          >
            <Mic className="h-4 w-4" /> Use voice instead
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button onClick={stop} variant="destructive" size="sm">
            <MicOff className="h-4 w-4" /> Stop ({secondsLeft}s)
          </Button>
        ) : (
          <Button onClick={start} size="sm">
            <Mic className="h-4 w-4" />{" "}
            {transcript ? "Re-record" : "Start recording (60s)"}
          </Button>
        )}
        {transcript && !recording && (
          <Button onClick={reset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" /> Clear
          </Button>
        )}
        <Button
          onClick={() => setManualMode(true)}
          variant="ghost"
          size="sm"
        >
          <Type className="h-4 w-4" /> Type instead
        </Button>
      </div>
      <Textarea
        value={transcript}
        onChange={(e) => {
          finalRef.current = e.target.value;
          onChange(e.target.value);
        }}
        placeholder="Your transcription will appear here. You can edit it before generating."
        rows={6}
        readOnly={recording}
      />
    </div>
  );
};

export default QuickBuildVoiceRecorder;
