import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { SiGithub, SiX, SiTelegram, SiGmail, SiBluesky } from "@icons-pack/react-simple-icons";

const ContactPage = () => {
  return (
    <main className="flex flex-grow flex-col mt-5 gap-4">
      <h1 className="text-2xl">Contact Me</h1>
      <ul className="flex flex-col gap-2">
      <li>
        <Link target="_blank" className="flex gap-1 text-lg items-center hover:underline" href="mailto:roman.fedunn@gmail.com">
        <SiGmail className="h-6 w-6 pr-1"/>
        roman.fedunn@gmail.com
        <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
        </Link>
      </li>
      <li>
        <Link target="_blank" className="flex gap-1 text-lg items-center hover:underline" href="https://t.me/feddunn">
        <SiTelegram className="h-6 w-6 pr-1"/>
        @feddunn
        <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
        </Link>
      </li>
      <li>
        <Link target="_blank" className="flex gap-1 text-lg items-center hover:underline" href="https://github.com/RoLO0u">
        <SiGithub className="h-6 w-6 pr-1"/>
        RoLO0u
        <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
        </Link>
      </li>
      <li>
        <Link target="_blank" className="flex gap-1 text-lg items-center hover:underline" href="https://x.com/FedunnRoman">
        <SiX className="h-6 w-6 pr-1"/>
        @FedunnRoman
        <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
        </Link>
      </li>
      <li>
        <Link target="_blank" className="flex gap-1 text-lg items-center hover:underline" href="https://bsky.app/profile/feddunn.bsky.social">
        <SiBluesky className="h-6 w-6 pr-1"/>
        @feddunn.bsky.social
        <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
        </Link>
      </li>
      </ul>
    </main>
  );
};

export default ContactPage;