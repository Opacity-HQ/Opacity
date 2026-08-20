import Image from "next/image";
import Link from "next/link";

const gameCards = [
  {
    title: "Sound Match",
    description:
      "Helps children practice connecting sounds with letters, strengthening sound–letter associations.",
    accent: "bg-[#F7FCEC]",
    icon: "./sound.svg",
    href: "/sound-match",
  },
  {
    title: "Letter Detective",
    description:
      "Helps children distinguish commonly confused letters such as b/d, improving visual recognition and processing.",
    accent: "bg-[#f9f6fe]",
    icon: "./letter.svg",
    href: "/letter-detective",
  },
  {
    title: "Word Builder",
    description:
      "Gives children practice building and decoding words, supporting spelling-related skills.",
    accent: "bg-[#fefcea]",
    icon: "./block.svg",
    href: "/word-builder",
  },
  {
    title: "Memory Quest",
    description:
      "Exercises the ability to remember letters, words, and sequences, supporting short-term recall.",
    accent: "bg-[#f9f0f0]",
    icon: "./memory.svg",
    href: "/memory-quest",
  },
  {
    title: "Rapid match",
    description:
      "Practices quickly recognizing objects, letters, and symbols, while measuring response speed.",
    accent: "bg-[#F5f8fe]",
    icon: "./rapid.svg",
    href: "/rapid-match",
  },
];

import Signin from "@/components/signin";

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
            loading="eager"
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
          <Signin
            trigger={
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
            }
          />
        </div>

        <div className="dashed-line w-full mt-[40px]"></div>

        <div className="flex flex-col items-start justify-center w-full pl-[20px] pr-[15px]">
          <span className="font-pixel text-[40px] text-[#1d1d1d] mt-[20px] ">Games</span>
          <span className="font-open-sauce text-[20px] text-[#5e5e5e]">
            Five games. Five key skills. 
          </span>
          <span className="font-open-sauce text-[20px] text-[#5e5e5e] leading-[15px]"> 
            One personalized learning journey
          </span>
          <div className="flex flex-col items-start justify-center w-full mt-[30px] dashed-border bg-[#fefefe] p-[15px] rounded-[20px]">
            <div className="flex flex-row items-center justify-start w-full">
              <Image
                src="./skull.svg"
                alt="skull Icon"
                width={20}
                height={20}    
                className=""/>
              <span className="font-pixel text-[20px] text-[#5e5e5e] ml-[10px]">disclaimer</span>
            </div>
            <p className="font-open-sauce text-[14px] text-[#5e5e5e] leading-[18px] mt-[5px]">
                This platform is designed for early screening and personalized learning support. It is not a diagnostic tool and does not replace evaluation by a qualified professional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px] items-center justify-center w-full pl-[20px] pr-[15px] mb-[30px] mt-[20px]">
          {gameCards.map((game) => (
            <div
              key={`${game.title}-${game.accent}`}
              className="flex flex-col items-start justify-between w-full bg-[#fefefe] rounded-[15px] border-[2px] border-[#efefef] h-[200px]"
            >
              <div className="flex flex-col">
                <div className={`flex flex-row items-center justify-start w-full rounded-t-[15px] ${game.accent} px-[13px] py-[8px]`}>
                  <Image
                    src={game.icon}
                    alt={`${game.title} Icon`}
                    width={20}
                    height={20}
                  />
                  <span className="font-pixel text-[20px] text-black ml-[10px]">{game.title}</span>
                </div>
                <div>
                  <p className="font-open-sauce text-[14px] text-[#5e5e5e] leading-[18px] mt-[10px] px-[13px]">
                    {game.description}
                  </p>
                </div>
              </div>
              <Link
                href={game.href}
                className="flex flex-row items-center justify-center w-fit h-fit bg-white hover:bg-[#f7f7f7] hover:translate-x-[5px] transition-all duration-200 rounded-[10px] px-[10px] py-[5px] border-[2px] border-[#efefef] ml-[10px] mb-[10px]"
              >
                <Image
                  src="./play.svg"
                  alt="Play Icon"
                  width={15}
                  height={15}
                  className=""
                />
                <span className="font-pixel text-[15px] ml-[5px]">play</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="dashed-line w-full"></div>

        <div className="flex flex-col items-start justify-between w-full pl-[20px] pr-[15px] mt-[20px] mb-[20px] h-[150px]">
          <span className="font-pixel text-[18px] text-[#1d1d1d]">Bengaluru, India 🇮🇳</span>
          <span className="font-pixel text-[18px] text-[#1d1d1d] leading-[25px]">Built with
            <Image
              src="./love.svg"
              alt="love Icon"
              width={20}
              height={20}
              className="inline-block mx-[5px]"
            />
            by Saket rama, Atharv remeshan, Ritwik gupta, Saatvik Das, Zaid Khan and Pranshu Thakkar </span>
        </div>
      </div>
      
      </div>
  );
}
