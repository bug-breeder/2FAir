import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Secure Your &nbsp;</h1>
        <h1 className={title({ color: "violet" })}>Accounts&nbsp;</h1>
        <h1 className={title()}>on Every &nbsp;</h1>
        <h1 className={title({ color: "pink" })}>Device&nbsp;</h1>
        <br />
        <h2 className={subtitle({ class: "mt-4" })}>
          Free, open-source, and cross-platform
        </h2>
        <h2 className={subtitle()}>authentication app.</h2>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.login}
        >
          Getting Started
        </Link>
      </div>

      <div className="mt-8">
        {/* <Snippet hideCopyButton hideSymbol variant="flat">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet> */}
      </div>
    </section>
  );
}
