import Image from "next/image";
import Link from "next/link";
import Signin from "@/components/signin";

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

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col items-center w-full max-w-2xl min-h-screen border-x-0 sm:border-x-2 border-[#efefef]">
        <div className="flex flex-row items-center justify-start w-full px-4 py-4 sm:px-5 sm:py-5">
          <Image
            src="./logo.svg"
            alt="Opacity Logo"
            width={30}
            height={30}
            loading="eager"
          />
          <span className="font-pixel text-[22px] sm:text-[26px] ml-2 text-[#1d1d1d]">opacity</span>
        </div>
        <div className="flex flex-col items-start justify-center w-full px-4 sm:px-5 mt-6 sm:mt-[50px]">
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d]">Helping Every</span>
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] leading-tight sm:leading-[40px]">Dyslexic Mind Thrive</span>
          <div className="font-open-sauce text-[16px] sm:text-[18px] md:text-[20px] text-[#5e5e5e] mt-4 sm:mt-[20px] leading-[24px] sm:leading-[28px]">
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
              <button className="cursor-pointer">
                <div className="button-shadow flex flex-row items-center justify-center w-fit h-fit bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-5px] transition-all duration-200 rounded-[10px] mt-6 sm:mt-[30px] px-[17px] py-[8px]">
                  <Image
                    src="./game2.svg"
                    alt="Play Icon"
                    width={25}
                    height={25}
                    className="mr-[10px]"
                  />
                  <span className="font-pixel text-[18px] sm:text-[20px] text-[#ffffff]">lets play</span>
                </div>
              </button>
            }
          />
        </div>

        <div className="dashed-line w-full mt-8 sm:mt-[40px]"></div>

        <div className="flex flex-col items-start justify-center w-full px-4 sm:px-5">
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] mt-5 sm:mt-[20px]">Games</span>
          <span className="font-open-sauce text-[16px] sm:text-[18px] md:text-[20px] text-[#5e5e5e]">
            Five games. Five key skills. 
          </span>
          <span className="font-open-sauce text-[16px] sm:text-[18px] md:text-[20px] text-[#5e5e5e] leading-snug sm:leading-normal"> 
            One personalized learning journey
          </span>
          <div className="flex flex-col items-start justify-center w-full mt-5 sm:mt-[30px] dashed-border bg-[#fefefe] p-3.5 sm:p-[15px] rounded-[20px]">
            <div className="flex flex-row items-center justify-start w-full">
              <Image
                src="./skull.svg"
                alt="skull Icon"
                width={20}
                height={20}    
                className=""/>
              <span className="font-pixel text-[18px] sm:text-[20px] text-[#5e5e5e] ml-[10px]">disclaimer</span>
            </div>
            <p className="font-open-sauce text-[13px] sm:text-[14px] text-[#5e5e5e] leading-[18px] mt-[5px]">
                This platform is designed for early screening and personalized learning support. It is not a diagnostic tool and does not replace evaluation by a qualified professional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[20px] items-stretch justify-center w-full px-4 sm:px-5 mb-8 sm:mb-[30px] mt-5 sm:mt-[20px]">
          {gameCards.map((game) => (
            <div
              key={`${game.title}-${game.accent}`}
              className="flex flex-col items-start justify-between w-full bg-[#fefefe] rounded-[15px] border-[2px] border-[#efefef] min-h-[200px]"
            >
              <div className="flex flex-col w-full">
                <div className={`flex flex-row items-center justify-start w-full rounded-t-[15px] ${game.accent} px-[13px] py-[8px]`}>
                  <Image
                    src={game.icon}
                    alt={`${game.title} Icon`}
                    width={20}
                    height={20}
                  />
                  <span className="font-pixel text-[18px] sm:text-[20px] text-black ml-[10px]">{game.title}</span>
                </div>
                <div>
                  <p className="font-open-sauce text-[13px] sm:text-[14px] text-[#5e5e5e] leading-[18px] mt-[10px] px-[13px]">
                    {game.description}
                  </p>
                </div>
              </div>
              <Link
                href={game.href}
                className="flex flex-row items-center justify-center w-fit h-fit bg-white hover:bg-[#f7f7f7] hover:translate-x-[5px] transition-all duration-200 rounded-[10px] px-[10px] py-[5px] border-[2px] border-[#efefef] ml-[10px] mb-[10px] mt-3"
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

        <div className="flex flex-col items-start justify-between w-full px-4 sm:px-5 py-5 gap-3 min-h-[150px]">
          <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d]">Bengaluru, India 🇮🇳</span>
          <span className="font-pixel text-[15px] sm:text-[18px] text-[#1d1d1d] leading-[22px] sm:leading-[25px]">Built with
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
