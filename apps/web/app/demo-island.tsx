"use client";

// The live demo is heavy (an editor, a theme list, a render call) and it sits below the fold, so it
// waits until it is about to be seen. The static card stands in until then, and without JS.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Demo = dynamic(() => import("./landing-demo"), { ssr: false });

export default function DemoIsland() {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setOn(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setOn(true);
        io.disconnect();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {on ? (
        <Demo />
      ) : (
        <figure className="mk-shot">
          <img
            src="/examples/hero.jpg"
            alt="A code card rendered by the editor: cart.ts in the github-dark theme"
            width={1088}
            height={780}
          />
          <figcaption>
            The live demo loads here. <a href="/editor">Open the editor</a> to render your own.
          </figcaption>
        </figure>
      )}
    </div>
  );
}