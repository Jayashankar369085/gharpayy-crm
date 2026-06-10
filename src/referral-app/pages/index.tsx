// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { PersonaSelector } from "@/referral-app/components/persona-selector";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function IndexPage() {
  const { persona, referrer } = useAppStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (persona && referrer) {
      setLocation("/home");
    } else if (persona && !referrer) {
      setLocation("/register");
    }
  }, [persona, referrer, setLocation]);

  if (!persona || !referrer) {
    return <PersonaSelector />;
  }

  return null; // Will redirect
}