"use client";

import Image from "next/image";
import Link from "next/link";
import Signin from "@/components/signin";
import { motion } from "motion/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@/components/ui/bubble"
import { Marker, MarkerContent } from "@/components/ui/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message"

const gameCards = [
  {
    title: "Sound Match",
    description:
      "Helps children practice connecting sounds with letters, strengthening sound–letter associations.",
    accent: "bg-[#F7FCEC]",
    icon: "/sound.svg",
    href: "/sound-match",
  },
  {
    title: "Letter Detective",
    description:
      "Helps children distinguish commonly confused letters such as b/d, improving visual recognition and processing.",
    accent: "bg-[#f9f6fe]",
    icon: "/letter.svg",
    href: "/letter-detective",
  },
  {
    title: "Word Builder",
    description:
      "Gives children practice building and decoding words, supporting spelling-related skills.",
    accent: "bg-[#fefcea]",
    icon: "/block.svg",
    href: "/word-builder",
  },
  {
    title: "Memory Quest",
    description:
      "Exercises the ability to remember letters, words, and sequences, supporting short-term recall.",
    accent: "bg-[#f9f0f0]",
    icon: "/memory.svg",
    href: "/memory-quest",
  },
  {
    title: "Rapid match",
    description:
      "Practices quickly recognizing objects, letters, and symbols, while measuring response speed.",
    accent: "bg-[#F5f8fe]",
    icon: "/rapid.svg",
    href: "/rapid-match",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <div className="flex flex-col items-center w-full max-w-2xl min-h-screen border-x-0 sm:border-x-2 border-[#efefef]">
        
        {/* Header */}
        <motion.div 
          className="flex flex-row items-center justify-start w-full px-4 py-4 sm:px-5 sm:py-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Image
            src="/logo.svg"
            alt="Opacity Logo"
            width={30}
            height={30}
            loading="eager"
          />
          <span className="font-pixel text-[22px] sm:text-[26px] ml-2 text-[#1d1d1d]">opacity</span>
        </motion.div>

        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-start justify-center w-full px-4 sm:px-5 mt-6 sm:mt-[50px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d]">Helping Every</span>
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] leading-tight sm:leading-[40px]">Dyslexic Mind Thrive</span>
          <motion.div 
            className="font-open-sauce text-[16px] sm:text-[18px] md:text-[20px] text-[#5e5e5e] mt-4 sm:mt-[20px] leading-[24px] sm:leading-[28px]"
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
              className="inline-block align-middle"
            />{" "}
            platform that helps identify potential learning difficulties early and
            turns gameplay into personalized {" "}
            <Image
              src="/face.svg"
              alt="face Icon"
              width={22}
              height={22}
              className="inline-block align-middle mb-[5px]"
            />{" "}
            learning activities for every child.
            <Image
              src="/baby.svg"
              alt="Baby Icon"
              width={26}
              height={26}
              className="inline-block align-middle"
            />
          </motion.div>
          <Signin
            trigger={
              <motion.button 
                className="cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="button-shadow flex flex-row items-center justify-center w-fit h-fit bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-5px] transition-all duration-200 rounded-[10px] mt-6 sm:mt-[30px] px-[17px] py-[8px]">
                  <Image
                    src="/game2.svg"
                    alt="Play Icon"
                    width={25}
                    height={25}
                    className="mr-[10px]"
                  />
                  <span className="font-pixel text-[18px] sm:text-[20px] text-[#ffffff]">lets play</span>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-black *:data-[slot=bubble-content]:text-white *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">How do these mini-games help spot dyslexia early?</BubbleContent>
                </Bubble>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted" className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">Each game tests key skills like phonics, b/d letter confusion, and recall while measuring response speed and accuracy.</BubbleContent>
                </Bubble>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-black *:data-[slot=bubble-content]:text-white *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">Is it easy and stress-free for kids?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-pixel text-[11px] text-[#71717a]">Delivered</MessageFooter>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <BubbleGroup className="max-w-[65%] sm:max-w-[75%]">
                  <Bubble variant="muted" className="*:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                    <BubbleContent className="font-pixel text-[14px]">
                      Yes! They feel like play, so kids stay relaxed and engaged without any test anxiety.
                    </BubbleContent>
                  </Bubble>
                  <Bubble variant="outline" className="*:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                    <BubbleContent className="font-pixel text-[14px]">Plus, parents get instant insights to support personalized learning!</BubbleContent>
                    <BubbleReactions aria-label="Reactions: thumbs up" className="bg-white border border-[#e4e4e7] text-[#1d1d1d] font-pixel text-xs shadow-2xs">
                      <span>👍</span>
                    </BubbleReactions>
                  </Bubble>
                </BubbleGroup>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-black *:data-[slot=bubble-content]:text-white *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">What age group is this best for?</BubbleContent>
                </Bubble>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="muted" className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">It is designed primarily for kids aged 5 to 10 to strengthen core reading and visual skills.</BubbleContent>
                </Bubble>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar1.png" alt="@me" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">ME</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble className="max-w-[65%] sm:max-w-[75%] *:data-[slot=bubble-content]:bg-black *:data-[slot=bubble-content]:text-white *:data-[slot=bubble-content]:shadow-sm">
                  <BubbleContent className="font-pixel text-[14px]">How long does a session take?</BubbleContent>
                </Bubble>
                <MessageFooter className="font-pixel text-[11px] text-[#71717a]">Delivered</MessageFooter>
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
                <Avatar className="border border-[#e4e4e7] bg-white shadow-2xs">
                  <AvatarImage src="/avatar-2.png" alt="@rabbit" />
                  <AvatarFallback className="font-pixel text-[12px] bg-[#f4f4f5] text-[#1d1d1d]">R</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <BubbleGroup className="max-w-[65%] sm:max-w-[75%]">
                  <Bubble variant="muted" className="*:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                    <BubbleContent className="font-pixel text-[14px]">
                      Just 5 to 10 minutes a day!
                    </BubbleContent>
                  </Bubble>
                  <Bubble variant="outline" className="*:data-[slot=bubble-content]:bg-white *:data-[slot=bubble-content]:text-[#1d1d1d] *:data-[slot=bubble-content]:border *:data-[slot=bubble-content]:border-[#e4e4e7] *:data-[slot=bubble-content]:shadow-sm">
                    <BubbleContent className="font-pixel text-[14px]">Short, playful bursts keep kids excited to practice regularly.</BubbleContent>
                    <BubbleReactions aria-label="Reactions: heart" className="bg-white border border-[#e4e4e7] text-[#1d1d1d] font-pixel text-xs shadow-2xs">
                      <span>❤️</span>
                    </BubbleReactions>
                  </Bubble>
                </BubbleGroup>
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
              <MarkerContent className="shimmer font-pixel text-[13px] text-[#71717a]">
                <span className="font-pixel font-medium text-[#1d1d1d]">Oliver</span> is typing...
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
          <span className="font-pixel text-[28px] sm:text-[36px] md:text-[40px] text-[#1d1d1d] mt-5 sm:mt-[20px]">Games</span>
          <span className="font-pixel text-[16px] sm:text-[18px] md:text-[20px] text-black">
            Five games. Five key skills. 
          </span>
          <span className="font-pixel text-[16px] sm:text-[18px] md:text-[20px] text-black leading-snug sm:leading-[20px]"> 
            One personalized learning journey
          </span>
          <div className="flex flex-col items-start justify-center w-full mt-5 sm:mt-[30px] dashed-border bg-[#fefefe] p-3.5 sm:p-[15px] rounded-[20px]">
            <div className="flex flex-row items-center justify-start w-full">
              <Image
                src="/skull.svg"
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
        </motion.div>

        {/* Game Cards Grid with Stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[20px] items-stretch justify-center w-full px-4 sm:px-5 mb-8 sm:mb-[30px] mt-5 sm:mt-[20px]">
          {gameCards.map((game, index) => (
            <motion.div
              key={`${game.title}-${game.accent}`}
              className="flex flex-col items-start justify-between w-full bg-[#fefefe] rounded-[15px] border-[2px] border-[#efefef] min-h-[200px]"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
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
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={game.href}
                  className="flex flex-row items-center justify-center w-fit h-fit bg-white hover:bg-[#f7f7f7] transition-all duration-200 rounded-[10px] px-[10px] py-[5px] border-[2px] border-[#efefef] ml-[10px] mb-[10px] mt-3"
                >
                  <Image
                    src="/play.svg"
                    alt="Play Icon"
                    width={15}
                    height={15}
                    className=""
                  />
                  <span className="font-pixel text-[15px] ml-[5px]">play</span>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="dashed-line w-full"></div>

        {/* Footer & Opacity Title */}
        <motion.div 
          className="flex flex-col items-start justify-between w-full pt-5 pb-0 gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-start justify-start w-full px-4 sm:px-5 gap-3">
            <span className="font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d]">Bengaluru, India 🇮🇳</span>
            <span className="font-pixel text-[15px] sm:text-[18px] text-[#1d1d1d] leading-[22px] sm:leading-[25px]">Built with
              <Image
                src="/love.svg"
                alt="love Icon"
                width={20}
                height={20}
                className="inline-block mx-[5px]"
              />
              by Saket rama, Atharv remeshan, Ritwik gupta, Saatvik Das, Zaid Khan and Pranshu Thakkar </span>
          </div>
          <div className="relative w-full overflow-hidden mt-2 -mb-1 sm:-mb-2 pt-3">
            <div className="absolute inset-x-0 bottom-0 mx-auto w-full h-full max-h-64 rounded-full blur-[100px] pointer-events-none"></div>
            <motion.h1 
              className="text-center font-extrabold leading-[0.88] text-[#fcfcfc] text-[clamp(3rem,17.5vw,8.2rem)] [-webkit-text-stroke:1px_#E5E5E5] select-none pt-1"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              Opacity
            </motion.h1>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
