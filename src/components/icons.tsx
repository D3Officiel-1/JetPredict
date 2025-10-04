import Image from 'next/image';

export const AppLogo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-primary"
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
      <path d="M13 13l6 6"></path>
    </svg>
  );

export const AviatorLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/spribe/c7dc7be6-2fa2-46ff-ba1c-01531ca7f4b6.png@avif"
    alt="Aviator Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);
  
export const LuckyJetLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/1play/8cd3ae6e-3840-454e-8e42-434cd48af16c.jpg@avif"
    alt="Lucky Jet Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);

export const RocketQueenLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/1play/0c8b561e-d1d5-4e08-903f-f0b53d280c7c.jpg@avif"
    alt="Rocket Queen Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);

export const AstronautLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/100hp/6a61a18f-9551-4f10-8505-bda9799c8ea8_horizontal.png@avif"
    alt="Astronaut Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);

export const RocketXLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/1play/34c59b73-33f0-4c5f-b90d-f871cc9b329b.png@avif"
    alt="RocketX Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);

export const CrashLogo = () => (
  <Image 
    src="https://imgproxy.v1.bundlecdn.com/unsafe/casino_list_big_1x/plain/https://v1.bundlecdn.com/casino-images/1play/20ea037b-301f-46d5-993f-76d1b4319da3_horizontal.png@avif"
    alt="Crash Logo"
    width={24}
    height={24}
    className="h-6 w-6 rounded-sm"
  />
);

export const BellIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const MailOpenIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7" />
    <path d="m22 13-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 13" />
    <path d="M2 13h1.5" />
    <path d="M20.5 13H22" />
    <path d="m4 13 6 4" />
    <path d="m14 17 6-4" />
  </svg>
);

export const WhatsAppIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M16.75 13.96c.25.13.41.2.46.3.05.1.03.48-.02.73-.05.25-.33.48-.58.53-.25.05-1.73.28-3.38-1.38-1.65-1.65-2.73-3.03-2.73-3.03s-.12-.14-.25-.28c-.13-.13-.28-.25-.28-.25s-.1-.08-.14-.13c-.04-.05-.08-.1-.13-.14-.23-.2-.48-.43-.48-.73s.1-.45.2-.58c.1-.13.2-.18.3-.2.1-.03.2-.02.3-.02h.3s.28,0,.48.2c.2.2.5.58.5.58s.18.2.28.3c.1.1.18.23.28.35.1.13.14.18.2.23.05.05.1.1.14.1s.18-.02.28-.1c.1-.08.58-.5.58-.5s.2-.23.3-.34c.1-.1.18-.2.23-.2.05-.02.13,0,.23.04.1.04.58.28.58.28s.25.13.3.18c.05.05.08.1.08.14s-.02.18-.08.28c-.05.1-.13.18-.13.18zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
);
