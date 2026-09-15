interface Props {
  rounded?: boolean;
}

export default function ExampleAnswerOverlay({ rounded = false }: Props) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-black pointer-events-none ${
        rounded ? 'rounded-lg' : ''
      }`}
      // Keep the spoiler surface above renderer-specific SVG/canvas layers.
      // Some boards use their own high z-index for edge annotations; the
      // answer mask must still cover every pixel until the user confirms.
      style={{ zIndex: 2147483647 }}
    >
      <div className="text-white text-6xl">👁️‍🗨️</div>
    </div>
  );
}
