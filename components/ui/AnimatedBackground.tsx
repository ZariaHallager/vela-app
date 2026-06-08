export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
    >
      {/* Top-left warm blush orb */}
      <div
        className="aurora-orb aurora-orb-slow"
        style={{
          width: '60vw',
          height: '60vw',
          top: '-20vw',
          left: '-15vw',
          background:
            'radial-gradient(circle, #F2D5D5 0%, #C084FC 55%, transparent 80%)',
        }}
      />

      {/* Bottom-right lavender orb */}
      <div
        className="aurora-orb"
        style={{
          width: '50vw',
          height: '50vw',
          bottom: '-18vw',
          right: '-12vw',
          background:
            'radial-gradient(circle, #C084FC 0%, #F2D5D5 60%, transparent 80%)',
          animationDelay: '-6s',
        }}
      />

      {/* Centre accent — small mauve hint */}
      <div
        className="aurora-orb aurora-orb-slow"
        style={{
          width: '30vw',
          height: '30vw',
          top: '35%',
          left: '35%',
          background:
            'radial-gradient(circle, rgba(45,27,46,0.18) 0%, transparent 70%)',
          animationDelay: '-9s',
          opacity: 0.25,
        }}
      />
    </div>
  );
}
