import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen ">
      <section className="bg-brand p-10 hidden items-center justify-center lg:flex xl:2/5">
        <div className="flex flex-col max-h-[800px] max-w-[430px] justify-center space-y-12">
          <Image
            src="/logo.png"
            alt="logo"
            width={250}
            height={250}
            className="h-auto"
          />

          <div className="space-y-5 text-white">
            <h1 className="h1">Manage your files easily</h1>
            <p className="body-1">
              An advanced file management system that allows you to upload,
              organize, and access your files seamlessly.
            </p>
            <Image
              src="/assets/images/files.png"
              alt="files"
              className="transition-all hover:rotate-2 hover:scale-105"
              width={342}
              height={342}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden bg-brand">
          <Image
            src="/Logo.png"
            alt="logo"
            width={224}
            height={82}
            className="h-auto w-[200px] lg:w-[250px] p-5"
          />
        </div>
        {children}
      </section>
    </div>
  );
};

export default Layout;
