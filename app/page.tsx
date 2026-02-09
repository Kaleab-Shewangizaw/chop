import { History } from "lucide-react";
import Hero from "./comps/Hero";
import InputArea from "./comps/InputArea";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (

    <main className="flex h-screen max-h-screen flex-col text-white items-center  pb-20 bg-[#1a222a] justify-start overflow-hidden">
      <div className="h-4 flex p-4 px-10 justify-between w-full">
        <h1 className="font-medium text-xl cursor-pointer ">Chop.</h1>
        <Button className="cursor-pointer  text-white/50 hover:text-white transition-all duration-400"><History /></Button>
      </div>
      <Hero />
      <InputArea />
    </main>
  );
}
