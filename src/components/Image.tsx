export const Image = ({ alt, src }: {
  alt: string;
  src: string
}) => {
  return <img src={src} alt={alt} />;
};
