"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatSettingsAndInstructionsPage from "../instructions/page";

export default function ChatAppearanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/chat/instructions");
  }, [router]);

  return <ChatSettingsAndInstructionsPage />;
}
