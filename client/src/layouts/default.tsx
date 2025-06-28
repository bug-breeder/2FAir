import { Link } from "@heroui/link";

import { Navbar } from "@/components/navbar";
import { HeartFilledIcon } from "@/components/icons";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="w-full sm:container sm:mx-auto sm:max-w-7xl px-0 sm:px-6 flex-grow pt-4 sm:pt-8">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://nodez.one"
          title="nodez.one - Small Acts, Giant Impact"
        >
          <span className="text-default-600 flex items-center gap-1">
            Made with
            <HeartFilledIcon className="text-danger" size={16} />
            by
          </span>
          <p className="text-primary">nodez.one</p>
        </Link>
      </footer>
    </div>
  );
}
