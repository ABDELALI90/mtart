export type RoomScene = 'floor' | 'bedroom' | 'living' | 'bathroom' | 'kitchen';

export function RoomFurniture({ scene }: { scene: RoomScene }) {
  if (scene === 'floor') {
    return (
      <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden="true">
        <rect x="0" y="146" width="800" height="8" fill="#c4b49a" />
        <rect x="118" y="28" width="176" height="96" fill="#e4d8c6" stroke="#cbb89a" />
        <rect x="128" y="36" width="156" height="80" fill="#d3e7ef" />
        <rect x="204" y="36" width="4" height="80" fill="#c5b79f" />
        <rect x="128" y="74" width="156" height="3" fill="#c5b79f" />
      </svg>
    );
  }
  if (scene === 'bedroom') {
    return (
      <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden="true">
        <rect x="118" y="36" width="140" height="96" fill="#e8ddcc" />
        <rect x="126" y="44" width="124" height="80" fill="#cfe4ea" />
        <rect x="236" y="168" width="328" height="150" rx="6" fill="#8d6b4a" />
        <rect x="254" y="148" width="292" height="44" fill="#efe6d8" />
        <rect x="254" y="196" width="292" height="104" fill="#d9c4a8" />
        <rect x="202" y="228" width="44" height="52" fill="#6e563f" />
        <rect x="554" y="228" width="44" height="52" fill="#6e563f" />
      </svg>
    );
  }
  if (scene === 'living') {
    return (
      <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden="true">
        <rect x="430" y="36" width="210" height="120" fill="#e4d7c4" />
        <rect x="438" y="44" width="194" height="104" fill="#d5e7ee" />
        <rect x="168" y="168" width="320" height="92" rx="10" fill="#6f7f5e" />
        <rect x="188" y="152" width="280" height="28" fill="#cfc6b6" />
        <rect x="278" y="248" width="120" height="36" fill="#b08968" />
      </svg>
    );
  }
  if (scene === 'bathroom') {
    return (
      <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden="true">
        <rect x="430" y="148" width="220" height="92" rx="18" fill="#d7e3e6" stroke="#9aaeb4" />
        <rect x="140" y="178" width="150" height="62" fill="#cfd8dc" />
        <rect x="186" y="158" width="58" height="28" fill="#eceff1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" aria-hidden="true">
      <rect x="90" y="86" width="620" height="70" fill="#d8c3a5" />
      <rect x="90" y="86" width="620" height="18" fill="#c4aa86" />
      <rect x="260" y="176" width="280" height="72" fill="#cbb496" />
    </svg>
  );
}
