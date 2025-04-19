import Image from 'next/image';

interface MonoLogoProps {
    src: string;
    alt: string;
    rgb: string;
}

const MonoLogo: React.FC<MonoLogoProps> = ({ src, alt, rgb }) => {
    return (
        <>
        <Image
            src={src}
            alt={alt}
            className={`dark:invert duration-300 hover:scale-110 transition-all ease-in-out`}
            width={30}
            height={30}
        />
        </>
    );
};

export default MonoLogo;