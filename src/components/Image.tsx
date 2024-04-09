interface ImageComponentProps {
  src: string;
  alt: string;
}

function Image({ src, alt }: ImageComponentProps) {
  return <img src={src} alt={alt} />;
}

export default Image;
