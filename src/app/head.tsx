import Script from "next/script";

export default function Head() {
  return (
    <>
      <title>AI 직원 메이커 | 전문가의 노하우를 AI로</title>
      <meta name="description" content="전문가의 업무 노하우를 AI 직원으로 제작하고 검수·유통·판매할 수 있는 AI 직원 마켓플랫폼" />
      <Script id="theme-init" strategy="beforeInteractive">
        {`(() => {
          try {
            const savedTheme = localStorage.getItem('theme-mode');
            const theme = savedTheme === 'dark' ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', theme === 'dark');
            document.documentElement.setAttribute('data-theme', theme);
          } catch {}
        })();`}
      </Script>
    </>
  );
}