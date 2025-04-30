import { Navbar } from "@/components/navbar";
// import { Link } from "@heroui/link";
// import { FAir, HeartFilledIcon } from "@/components/icons";
// import { GiBuffaloHead } from "react-icons/gi";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-2 pb-2 sm:pt-6 px-2 sm:px-6 flex-grow">
        {children}
      </main>
      {/* <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://github.com/anh-ngn/2FAir"
          title="anh-ngn"
        >
          <span className="text-default-600">Made with </span>
          <HeartFilledIcon className="text-danger" />
          <span className="text-default-600"> by Yak3 </span>
          <GiBuffaloHead />
        </Link>
      </footer> */}
    </>
  );
}
