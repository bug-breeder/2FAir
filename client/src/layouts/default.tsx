import { Navbar } from "../components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        {children}
      </main>
    </div>
  );
}
