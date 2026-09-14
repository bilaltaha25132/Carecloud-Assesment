const SPEAKER_LINE = /^(AI|User):\s*(.*)$/;

const SPEAKER_LABELS: Record<string, string> = {
  AI: 'Agent',
  User: 'Caller',
};

export function Transcript({ text }: { text: string }) {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, index) => {
        const speaker = SPEAKER_LINE.exec(line.trim());
        return (
          <p className="text-sm text-ink" key={index}>
            {speaker ? <span className="text-ink-muted">{SPEAKER_LABELS[speaker[1]]} </span> : null}
            {speaker ? speaker[2] : line.trim()}
          </p>
        );
      })}
    </div>
  );
}
