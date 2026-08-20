import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col items-center w-full max-w-5xl min-h-screen border-x-0 sm:border-x-2 border-[#efefef]">
        <div className="flex flex-row items-center justify-between w-full px-4 sm:px-5 py-3 border-b-2 border-[#efefef]">
          <div className="flex flex-row items-center justify-start min-w-0 pr-2">
            <Image
              src="/logo.svg"
              alt="Opacity Logo"
              width={20}
              height={20}
              loading="eager"
              className="shrink-0"
            />
            <span className="font-pixel text-[16px] sm:text-[20px] ml-2 text-[#1d1d1d] truncate">
              opacity / dashboard
            </span>
          </div>
          <div className="flex flex-row items-center justify-left px-2.5 py-1 sm:px-3 sm:py-1.5 border border-[#e0e0e0] rounded-[10px] bg-white hover:bg-[#f5f5f5] transition-all duration-200 cursor-pointer shrink-0">
            <Image
              src="/user.svg"
              alt="User Icon"
              width={20}
              height={20}
              loading="eager"
              className="shrink-0"
            />
            <span className="font-pixel text-[16px] sm:text-[20px] ml-[5px]">pranshu</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
