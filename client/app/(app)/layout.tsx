import { Navbar } from "@/components/navbar";
import { Link } from "@nextui-org/link";
import { FAir, GithubIcon, HeartFilledIcon } from "@/components/icons";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-7xl sm:pt-6 px-2 sm:px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://github.com/anh-ngn/2FAir"
          title="anh-ngn"
        >
          {/* <FAir size={30} /> */}
          <span className="text-default-600">Made with </span>
          <HeartFilledIcon className="text-danger" />
          <span className="text-default-600">Join us on </span>
          <GithubIcon />
        </Link>
      </footer>
    </>
  );
}
