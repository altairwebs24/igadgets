type AutoVideoProps = {
  src: string;
  className?: string;
  poster?: string;
};

/** Muted, looping, controls-free video that starts on its own everywhere. */
export function AutoVideo({ src, className, poster }: AutoVideoProps) {
  return (
    <video
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controls={false}
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
