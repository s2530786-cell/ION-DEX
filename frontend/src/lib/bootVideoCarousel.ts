/** ION DEX boot splash — three clips, adaptive resolution per device. */



export const BOOT_CLIP_IDS = ["cyber", "matrix", "intro"] as const;

export type BootClipId = (typeof BOOT_CLIP_IDS)[number];



export const BOOT_VARIANTS = [

  "landscape-1080p",

  "landscape-4k",

  "portrait-1080p",

] as const;

export type BootVariant = (typeof BOOT_VARIANTS)[number];



const STORAGE_KEY = "ion-dex-boot-video-index-v2";

type NavigatorNetworkConnection = {
  saveData?: boolean;
};

type NavigatorWithNetwork = Navigator & {
  connection?: NavigatorNetworkConnection;
};



export type BootViewportHint = {

  width: number;

  height: number;

  devicePixelRatio: number;

  prefersReducedMotion: boolean;

  saveData: boolean;

};



/** Pick encoding tier from viewport — avoids loading 4K on phones or save-data. */

export function selectBootVariant(hint: BootViewportHint): BootVariant {

  const portrait =

    hint.height > hint.width || hint.width < 768;

  if (portrait) return "portrait-1080p";



  const can4k =

    !hint.saveData &&

    hint.width >= 1600 &&

    hint.devicePixelRatio >= 1.5;

  if (can4k) return "landscape-4k";



  return "landscape-1080p";

}



export function bootVideoPath(clip: BootClipId, variant: BootVariant): string {

  return `/boot/boot-ion-${clip}-${variant}.mp4`;

}

const LEGACY_BOOT_PATH: Partial<Record<BootClipId, string>> = {

  cyber: "/boot/boot-ion-cyber.mp4",

  matrix: "/boot/boot-ion-matrix.mp4",

};

/** Ordered URLs when primary variant file is missing (404). */

export function bootVideoSources(clip: BootClipId, variant: BootVariant): string[] {

  const ordered: string[] = [bootVideoPath(clip, variant)];

  if (variant !== "landscape-1080p") {

    ordered.push(bootVideoPath(clip, "landscape-1080p"));

  }

  const legacy = LEGACY_BOOT_PATH[clip];

  if (legacy) ordered.push(legacy);

  return [...new Set(ordered)];

}



function readLastIndex(): number {

  try {

    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (raw == null) return -1;

    const n = Number.parseInt(raw, 10);

    return Number.isFinite(n) ? n : -1;

  } catch {

    return -1;

  }

}



function writeIndex(index: number): void {

  try {

    sessionStorage.setItem(STORAGE_KEY, String(index));

  } catch {

    /* quota / private mode */

  }

}



/** Next clip in carousel (session-persisted). Pair with `selectBootVariant` for file path. */

export function pickBootClipId(): BootClipId {

  const last = readLastIndex();

  const next = (last + 1) % BOOT_CLIP_IDS.length;

  writeIndex(next);

  return BOOT_CLIP_IDS[next];

}



export function readBootViewportHint(): BootViewportHint {

  if (typeof window === "undefined") {

    return {

      width: 1920,

      height: 1080,

      devicePixelRatio: 1,

      prefersReducedMotion: false,

      saveData: false,

    };

  }



  const conn = (navigator as NavigatorWithNetwork).connection;



  return {

    width: window.innerWidth,

    height: window.innerHeight,

    devicePixelRatio: window.devicePixelRatio || 1,

    prefersReducedMotion: window.matchMedia(

      "(prefers-reduced-motion: reduce)",

    ).matches,

    saveData: Boolean(conn?.saveData),

  };

}



export type BootVideoPick = {

  clipId: BootClipId;

  variant: BootVariant;

  src: string;

  sources: string[];

  prefersReducedMotion: boolean;

};



/** Clip rotation + adaptive asset path for this device. */

export function pickBootVideo(): BootVideoPick {

  const hint = readBootViewportHint();

  const clipId = pickBootClipId();

  const variant = selectBootVariant(hint);

  const sources = bootVideoSources(clipId, variant);

  return {

    clipId,

    variant,

    src: sources[0],

    sources,

    prefersReducedMotion: hint.prefersReducedMotion,

  };

}


