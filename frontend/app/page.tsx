import Image from "next/image";
export default function Home() {
  return (
    <div className="flex flex-row border-black">
      <div className="flex flex-col items-center w-2xl min-h-screen border-r-2 border-[#efefef] border-l-2">
        <div className="flex flex-row items-center justify-left w-full p-5">
          <Image
            src="./logo.svg"
            alt="Opacity Logo"
            width={30}
            height={30}
          />
          <span className="font-pixel text-[26px] ml-2 text-[#1d1d1d]">opacity</span>
        </div>
        <div className="flex flex-col items-start justify-center w-full pl-[20px] pr-[15px] mt-[50px]">
          <span className="font-pixel text-[40px] text-[#1d1d1d]">Helping Every</span>
          <span className="font-pixel text-[40px] text-[#1d1d1d] leading-[40px]">Dyslexic Mind Thrive</span>
          <div className="font-open-sauce text-[20px] text-[#5e5e5e] mt-[20px] leading-[28px]">
            A gamified{" "}
            <Image
              src="./game.svg"
              alt="Gamification Icon"
              width={25}
              height={25}
              className="inline-block align-middle"
            />{" "}
            platform that helps identify potential learning difficulties early and
            turns gameplay into personalized {" "}
            <Image
              src="./face.svg"
              alt="face Icon"
              width={22}
              height={22}
              className="inline-block align-middle mb-[5px]"
            />{" "}
            learning activities for every child.
            <Image
              src="./baby.svg"
              alt="Baby Icon"
              width={26}
              height={26}
              className="inline-block align-middle"
            />
          </div>
          <button>
            <div className="button-shadow flex flex-row items-center justify-center w-fit h-fit bg-[#1b1b1b] shover:bg-[#323232]  hover:translate-y-[-5px] transition-all duration-200 rounded-[20px] mt-[30px] px-[17px] py-[8px]">
              <Image
                src="./game2.svg"
                alt="Play Icon"
                width={25}
                height={25}
                className="mr-[10px]"
              />
              <span className="font-pixel text-[20px] text-[#ffffff]">lets play</span>
            </div>
          </button>
        </div>
        <div className="dashed-line w-full mt-[50px]"></div>
      </div>
      
      </div>
  );
}
