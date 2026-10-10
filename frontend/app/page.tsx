"use client";

import Image from "next/image";
import Link from "next/link";
import Signin from "@/components/signin";
import { ThemeToggle } from "@/components/theme-toggle";
import { DiagonalBoxPattern } from "@/components/background-pattern/diagonal-box-pattern";
import { motion } from "motion/react";
import { HairlineFigure, type HairlineFigureName } from "@/components/hairline-figure";
import { JustifiedText } from "@/components/justified-text";
import { Avatar, AvatarFallback, AvatarImage } from "xiod-ui/avatar";
import { Marker, MarkerContent } from "xiod-ui/marker";
import {
  Bubble,
  BubbleContent,
  BubbleReactions,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "xiod-ui/message";

const gameCards: {
  title: string;
  description: string;
  accent: string;
  icon: string;
  href: string;
  figure: HairlineFigureName;
  figureLabel: string;
}[] = [
  {
    title: "Sound Match",
    description:
      "Helps children practice connecting sounds with letters, strengthening sound–letter associations.",
    accent: "bg-[#F7FCEC] dark:bg-[#1b2113]",
    icon: "/sound.svg",
    href: "/sound-match",
    figure: "sound-match",
    figureLabel: "A line drawing of a speaker sending sound waves to a tile with a dot code",
  },
  {
    title: "Letter Detective",
    description:
      "Helps children distinguish commonly confused letters such as b/d, improving visual recognition and processing.",
    accent: "bg-[#f9f6fe] dark:bg-[#1d1828]",
    icon: "/letter.svg",
    href: "/letter-detective",
    figure: "letter-detective",
    figureLabel: "A line drawing of a magnifying glass over a mirrored b and d",
  },
  {
    title: "Word Builder",
    description:
      "Gives children practice building and decoding words, supporting spelling-related skills.",
    accent: "bg-[#fefcea] dark:bg-[#26230f]",
    icon: "/block.svg",
    href: "/word-builder",
    figure: "word-builder",
    figureLabel: "A line drawing of three blocks with one, two and three dots, one lifted from its slot",
  },
  {
    title: "Memory Quest",
    description:
      "Exercises the ability to remember letters, words, and sequences, supporting short-term recall.",
    accent: "bg-[#f9f0f0] dark:bg-[#2a1a1a]",
    icon: "/memory.svg",
    href: "/memory-quest",
    figure: "memory-quest",
    figureLabel: "A line drawing of six face-down cards with one turned face up",
  },
  {
    title: "Rapid match",
    description:
      "Practices quickly recognizing objects, letters, and symbols, while measuring response speed.",
    accent: "bg-[#F5f8fe] dark:bg-[#16202e]",
    icon: "/rapid.svg",
    href: "/rapid-match",
    figure: "rapid-match",
    figureLabel: "A line drawing of a stopwatch with streaks behind it",
  },
];

export default function Home() {
  return (
    <DiagonalBoxPattern className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col items-center w-full max-w-2xl min-h-screen bg-background border-x-0 sm:border-x-2 border-[#efefef] dark:border-[#262626]">
        
        {/* Header */}
        <motion.div 
          className="flex flex-row items-center justify-between w-full px-4 py-4 sm:px-5 sm:py-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-row items-center">
            <Image
              src="/logo.svg"
              alt="Opacity Logo"
              width={30}
              height={30}
              loading="eager"
              className="dark:invert"
            />
            <span className="font-pixel text-[22px] sm:text-[26px] ml-2 text-[#1d1d1d] dark:text-[#f2f2f2]">opacity</span>
          </div>
          <ThemeToggle />
        </motion.div>

        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-start justify-center w-full px-4 sm:px-5 mt-6 sm:mt-[50px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] dark:text-[#f2f2f2]">Helping Every</span>
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] dark:text-[#f2f2f2] leading-tight sm:leading-[40px]">Dyslexic Mind Thrive</span>
          <motion.div 
            className="font-open-sauce text-[16px] sm:text-[18px] md:text-[20px] text-[#5e5e5e] dark:text-[#a3a3a3] mt-4 sm:mt-[20px] leading-[24px] sm:leading-[28px]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            A gamified{" "}
            <Image
              src="/game.svg"
              alt="Gamification Icon"
              width={25}
              height={25}
              className="inline-block align-middle dark:invert"
            />{" "}
            platform that helps identify potential learning difficulties early and
            turns gameplay into personalized {" "}
            <Image
              src="/face.svg"
              alt="face Icon"
              width={22}
              height={22}
              className="inline-block align-middle mb-[5px] dark:invert"
            />{" "}
            learning activities for every child.
            <Image
              src="/baby.svg"
              alt="Baby Icon"
              width={26}
              height={26}
              className="inline-block align-middle dark:invert"
            />
          </motion.div>
          <Signin
            trigger={
              <motion.button 
                className="cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="button-shadow flex flex-row items-center justify-center w-fit h-fit bg-[#1b1b1b] hover:bg-[#323232] dark:bg-[#f2f2f2] dark:hover:bg-white hover:translate-y-[-5px] transition-all duration-200 rounded-[10px] mt-6 sm:mt-[30px] px-[17px] py-[8px]">
                  <Image
                    src="/game2.svg"
                    alt="Play Icon"
                    width={25}
                    height={25}
                    className="mr-[10px] dark:invert"
                  />
                  <span className="font-pixel [-webkit-text-stroke:0.4px_currentColor] text-[18px] sm:text-[20px] text-[#ffffff] dark:text-[#1b1b1b]">lets play</span>
                </div>
              </motion.button>
            }
          />
        </motion.div>

        <div className="dashed-line w-full mt-8 sm:mt-[40px]"></div>

        
        {/* Chat FAQ Section with Motion Stagger */}
        <div className="flex w-full px-[20px] flex-col gap-[20px] mt-[40px]">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Message align="end">
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">You</MessageHeader>
                <Bubble align="end" className="max-w-[65%] sm:max-w-[75%]">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">How do these mini-games help spot dyslexia early?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:24 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Message>
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">Oliver</MessageHeader>
                <Bubble variant="secondary" className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:border-border">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">Each game tests key skills like phonics, b/d letter confusion, and recall while measuring response speed and accuracy.</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:24 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Message align="end">
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">You</MessageHeader>
                <Bubble align="end" className="max-w-[65%] sm:max-w-[75%]">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">Is it easy and stress-free for kids?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:25 AM • Delivered</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Message>
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">Oliver</MessageHeader>
                <>
                  <Bubble variant="secondary" className="*:data-[slot=bubble-content]:border-border">
                    <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">
                      Yes! They feel like play, so kids stay relaxed and engaged without any test anxiety.
                    </BubbleContent>
                  </Bubble>
                  <Bubble variant="outline">
                    <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">Plus, parents get instant insights to support personalized learning!</BubbleContent>
                    <BubbleReactions aria-label="Reactions: thumbs up" className="font-pixel text-xs">
                      <span>👍</span>
                    </BubbleReactions>
                  </Bubble>
                </>
                <MessageFooter className="font-sauce text-[12px]">10:25 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Message align="end">
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">You</MessageHeader>
                <Bubble align="end" className="max-w-[65%] sm:max-w-[75%]">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">What age group is this best for?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:26 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Message>
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">Oliver</MessageHeader>
                <Bubble variant="secondary" className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:border-border">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">It is designed primarily for kids aged 5 to 10 to strengthen core reading and visual skills.</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:26 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Message align="end">
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">You</MessageHeader>
                <Bubble align="end" className="max-w-[65%] sm:max-w-[75%]">
                  <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">How long does a session take?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-sauce text-[12px]">10:27 AM • Delivered</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Message>
              <MessageAvatar>
                <Avatar>
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="font-sauce text-[12px]">Oliver</MessageHeader>
                <>
                  <Bubble variant="secondary" className="*:data-[slot=bubble-content]:border-border">
                    <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">
                      Just 5 to 10 minutes a day!
                    </BubbleContent>
                  </Bubble>
                  <Bubble variant="outline">
                    <BubbleContent className="font-sauce text-[14px] rounded-xl group-data-[align=end]/bubble:rounded-tr-xs group-data-[align=start]/bubble:rounded-tl-xs">Short, playful bursts keep kids excited to practice regularly.</BubbleContent>
                    <BubbleReactions aria-label="Reactions: heart" className="font-pixel text-xs">
                      <span>❤️</span>
                    </BubbleReactions>
                  </Bubble>
                </>
                <MessageFooter className="font-sauce text-[12px]">10:27 AM</MessageFooter>
              </MessageContent>
            </Message>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Marker role="status">
              <MarkerContent className="shimmer font-sauce text-[13px]">
                <span className="font-sauce font-medium text-foreground">Oliver</span> is typing...
              </MarkerContent>
            </Marker>
          </motion.div>
        </div>

        <div className="dashed-line w-full mt-8 sm:mt-[40px]"></div>

        {/* Games Section Header */}
        <motion.div 
          className="flex flex-col items-start justify-center w-full px-4 sm:px-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] dark:text-[#f2f2f2] mt-5 sm:mt-[20px]">Games</span>
          <span className="font-pixel text-[16px] sm:text-[18px] md:text-[20px] text-black dark:text-white">
            Five games. Five key skills. 
          </span>
          <span className="font-pixel text-[16px] sm:text-[18px] md:text-[20px] text-black dark:text-white leading-snug sm:leading-[20px]"> 
            One personalized learning journey
          </span>
          <div className="flex flex-col items-start justify-center w-full mt-5 sm:mt-[30px] dashed-border bg-[#fefefe] dark:bg-[#141414] p-3.5 sm:p-[15px] rounded-[20px]">
            <div className="flex flex-row items-center justify-start w-full">
              <Image
                src="/skull.svg"
                alt="skull Icon"
                width={20}
                height={20}    
                className="dark:invert"/>
              <span className="font-pixel text-[18px] sm:text-[20px] text-[#5e5e5e] dark:text-[#a3a3a3] ml-[10px]">disclaimer</span>
            </div>
            <p className="font-open-sauce text-[13px] sm:text-[14px] text-[#5e5e5e] dark:text-[#a3a3a3] leading-[18px] mt-[5px]">
                This platform is designed for early screening and personalized learning support. It is not a diagnostic tool and does not replace evaluation by a qualified professional.
            </p>
          </div>
        </motion.div>

        {/* Game Cards Grid with Stagger */}
        <div className="grid grid-cols-2 gap-3 sm:gap-[20px] items-stretch justify-center w-full px-4 sm:px-5 mb-8 sm:mb-[30px] mt-5 sm:mt-[20px]">
          {gameCards.map((game, index) => {
            return (
            <motion.div
              key={`${game.title}-${game.accent}`}
              className="flex flex-col w-full"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              {/* The coloured title bar pops up from behind the white body as it scrolls into view */}
              <motion.div
                className={`flex flex-row items-center justify-start w-full ${game.accent} rounded-t-[20px] border border-[#e8e8e8] dark:border-[#2a2a2a] px-[12px] sm:px-[16px] pt-[10px] sm:pt-[12px] pb-[26px] sm:pb-[28px]`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: index * 0.08 + 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={game.icon}
                  alt={`${game.title} Icon`}
                  width={22}
                  height={22}
                  className="size-[18px] sm:size-[22px] shrink-0 dark:invert"
                />
                <span className="font-pixel text-[14px] sm:text-[22px] leading-[1.1] sm:leading-none text-black dark:text-white ml-[8px] sm:ml-[10px]">{game.title}</span>
              </motion.div>
              <motion.div
                className="relative flex flex-1 flex-col -mt-[20px] bg-white dark:bg-[#141414] rounded-[20px] border border-[#e8e8e8] dark:border-[#2a2a2a] px-[10px] sm:px-[16px] pt-[6px] pb-[10px] sm:pb-[14px]"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              >
                <HairlineFigure
                  name={game.figure}
                  label={game.figureLabel}
                  className="w-full sm:max-w-[280px] mx-auto -mt-[10px] sm:-mt-[14px] -mb-[12px] sm:-mb-[18px] [--hairline-plate:#ffffff] [--hairline-hi:#0a0a0c] [--hairline-edge:#55555d] [--hairline-mid:#80808a] [--hairline-lo:#b4b4bc] dark:[--hairline-plate:#141414] dark:[--hairline-hi:#f5f5f7] dark:[--hairline-edge:#b4b4bc] dark:[--hairline-mid:#80808a] dark:[--hairline-lo:#55555d] [--hairline-stroke:1.1]"
                />
                <JustifiedText className="font-open-sauce text-[10px] sm:text-[15px] text-black dark:text-white leading-[1.25] sm:leading-[1.3] mt-[2px] sm:mt-[6px]">
                  {game.description}
                </JustifiedText>
                <motion.div className="mt-auto pt-2.5 sm:pt-3 w-full sm:w-fit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={game.href}
                    aria-label={`Play ${game.title}`}
                    className="flex flex-row items-center justify-center w-full sm:w-fit min-h-9 bg-white hover:bg-[#f7f7f7] active:bg-[#f0f0f0] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] dark:active:bg-[#333333] transition-all duration-200 rounded-[12px] px-[10px] py-[5px] border border-[#e8e8e8] dark:border-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b] dark:focus-visible:outline-[#f2f2f2]"
                  >
                    <Image
                      src="/play.svg"
                      alt=""
                      width={15}
                      height={15}
                      className="dark:invert"
                    />
                    <span className="font-pixel text-[15px] leading-none ml-[6px] dark:text-[#f2f2f2]">play</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
            );
          })}
        </div>

        <div className="dashed-line w-full"></div>

        {/* Footer & Opacity Title */}
        <motion.div 
          className="flex flex-col items-start justify-between w-full pt-5 pb-0 gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-start justify-start w-full px-4 sm:px-5 gap-3">
            <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">Bengaluru, India 🇮🇳</span>
            <span className="font-pixel text-[15px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2] leading-[22px] sm:leading-[25px]">Built with
              <Image
                src="/love.svg"
                alt="love Icon"
                width={20}
                height={20}
                className="inline-block mx-[5px] dark:invert"
              />
              by Saket rama, Atharv remeshan, Ritwik gupta, Saatvik Das, Zaid Khan and Pranshu Thakkar </span>
          </div>
          <div className="[--wm:clamp(3.5rem,24vw,10.5rem)] flex w-full justify-center overflow-hidden h-[calc(var(--wm)*0.66)] mt-2">
            <motion.h1
              className="font-pixel leading-[1.15] text-[#f8f8f8] text-(length:--wm) [-webkit-text-stroke:1px_#e0e0e0] select-none"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              opacity
            </motion.h1>
          </div>
        </motion.div>
      </div>
    </DiagonalBoxPattern>
  );
}
