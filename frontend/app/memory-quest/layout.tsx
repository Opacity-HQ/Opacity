import Image from "next/image";
export default function MemoryQuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row border-black">
        <div className="flex flex-col items-center w-5xl min-h-screen border-r-2 border-[#efefef] border-l-2">
            <div className="flex flex-row items-center justify-between w-full px-[20px] pt-[10px] border-b-[2px] border-[#efefef] pb-[10px]">
                <div className="flex flex-row items-center justify-left">
                    <Image
                        src="./logo.svg"
                        alt="Opacity Logo"
                        width={20}
                        height={20}
                        loading="eager"
                    />
                    <span className="font-pixel text-[20px] ml-2 text-[#1d1d1d]">opacity / memory quest </span>
                </div>
                <div className="flex flex-row items-center justify-left px-[10px] border-1 border-[#e0e0e0] rounded-[10px] bg-white hover:bg-[#f5f5f5] transition-all duration-200 cursor-pointer">
                <Image
                    src="./user.svg"
                    alt="User Icon"
                    width={20}
                    height={20}
                    loading="eager"
                />
                <span className="font-pixel text-[20px] ml-[5px]">pranshu</span>
                </div>
            </div>
            {children}
        </div>
    </div>
  );
}
