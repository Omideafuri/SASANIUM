import manifest from '../generated/frames.manifest.json';

export interface ChapterConfig {
  id: string;
  number: string;
  landmark: string;
  /** Inclusive global start frame */
  startFrame: number;
  /** Inclusive global end frame */
  endFrame: number;
  /** Frame range where scroll gently slows down for readability */
  holdRange: [number, number];
  /** Ideal frame to land on when clicking the chapter dot in the progress rail */
  anchorFrame: number;
  /** Whether this stop coincides with a dark architectural doorway/arch */
  darkMoment?: boolean;
  /** Accent color token: 'amber' | 'turquoise' */
  accent?: 'amber' | 'turquoise';
  /** Screen placement kept away from each frame's central focal point */
  layout: 'bottom-left' | 'top-left' | 'bottom-right' | 'center-low';
}

/** Helper to map a 0..1 ratio within a specific clip to a global frame index */
function clipFrame(clipId: string, ratio: number): number {
  const clip = manifest.clips.find((c) => c.id === clipId);
  if (!clip) return 0;
  const span = clip.endFrame - clip.startFrame;
  return Math.round(clip.startFrame + span * Math.max(0, Math.min(1, ratio)));
}

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 'persepolis',
    number: '01',
    landmark: 'Persepolis',
    startFrame: clipFrame('clip1', 0.06),
    endFrame: clipFrame('clip1', 0.68),
    holdRange: [clipFrame('clip1', 0.1), clipFrame('clip1', 0.46)],
    anchorFrame: clipFrame('clip1', 0.14),
    accent: 'amber',
    layout: 'bottom-left',
  },
  {
    id: 'pasargadae',
    number: '02',
    landmark: 'Pasargadae',
    startFrame: clipFrame('clip1', 0.72),
    endFrame: clipFrame('clip2', 0.56),
    holdRange: [clipFrame('clip2', 0.22), clipFrame('clip2', 0.48)],
    anchorFrame: clipFrame('clip2', 0.28),
    darkMoment: true,
    accent: 'amber',
    layout: 'bottom-left',
  },
  {
    id: 'isfahan',
    number: '03',
    landmark: 'Naqsh-e Jahan',
    startFrame: clipFrame('clip2', 0.62),
    endFrame: clipFrame('clip3', 0.52),
    holdRange: [clipFrame('clip2', 0.88), clipFrame('clip3', 0.36)],
    anchorFrame: clipFrame('clip3', 0.04),
    darkMoment: true,
    accent: 'turquoise',
    layout: 'bottom-left',
  },
  {
    id: 'hafez',
    number: '04',
    landmark: 'Hafez Tomb',
    startFrame: clipFrame('clip3', 0.56),
    endFrame: clipFrame('clip4', 0.46),
    holdRange: [clipFrame('clip3', 0.74), clipFrame('clip4', 0.24)],
    anchorFrame: clipFrame('clip4', 0.02),
    accent: 'amber',
    layout: 'bottom-left',
  },
  {
    id: 'abyaneh',
    number: '05',
    landmark: 'Abyaneh',
    startFrame: clipFrame('clip4', 0.54),
    endFrame: clipFrame('clip5', 0.5),
    holdRange: [clipFrame('clip4', 0.84), clipFrame('clip5', 0.32)],
    anchorFrame: clipFrame('clip5', 0.05),
    accent: 'amber',
    layout: 'top-left',
  },
  {
    id: 'azadi',
    number: '06',
    landmark: 'Azadi Tower',
    startFrame: clipFrame('clip5', 0.58),
    endFrame: clipFrame('clip5', 0.96),
    holdRange: [clipFrame('clip5', 0.72), clipFrame('clip5', 0.95)],
    anchorFrame: clipFrame('clip5', 0.78),
    accent: 'amber',
    layout: 'center-low',
  },
];
