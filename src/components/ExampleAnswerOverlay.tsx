interface Props {
  rounded?: boolean;
}

export default function ExampleAnswerOverlay({ rounded = false }: Props) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-black/70 dark:bg-black/80 pointer-events-none ${
        rounded ? 'rounded-lg' : ''
      }`}
    >
      <div className="text-white text-6xl">👁️‍🗨️</div>
    </div>
  );
}
