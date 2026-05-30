import { useEffect } from "react";

interface TermlyEmbedProps {
  dataId: string;
}

const TermlyEmbed = ({ dataId }: TermlyEmbedProps) => {
  useEffect(() => {
    const id = "termly-jssdk";
    if (document.getElementById(id)) {
      // Re-trigger Termly to render any newly mounted embeds
      (window as unknown as { Termly?: { initialize?: () => void } }).Termly?.initialize?.();
      return;
    }
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://app.termly.io/embed-policy.min.js";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(js, first);
  }, [dataId]);

  return <div {...{ name: "termly-embed" }} data-id={dataId} />;
};

export default TermlyEmbed;
