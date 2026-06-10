// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore } from "@/referral-app/lib/store";
import { useSubmitReferral } from "@/referral-app/api";
import { SubmitReferralBodyMoveInTimeline } from "@/referral-app/api";
import { Button } from "@/referral-app/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/referral-app/components/ui/form";
import { Input } from "@/referral-app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/referral-app/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Layout } from "@/referral-app/components/layout";
import { PageHeader } from "@/referral-app/components/page-header";
import { Copy, Share2, CheckCircle2, MessageCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { readReferContext } from "@/lib/referral-context";
import { CAPTAIN_BY_ID, captainForArea, captainForPersona, captainWaLink, type Expert } from "@/lib/captains";

const PROPERTY_TYPES = [
  { value: "PG",      label: "🏠 PG / Hostel",           desc: "Paying Guest accommodation" },
  { value: "1BHK",    label: "🏢 1BHK Flat",              desc: "1 bedroom flat / apartment" },
  { value: "2BHK",    label: "🏘️ 2BHK Flat",              desc: "2 bedroom flat / apartment" },
  { value: "3BHK",    label: "🏗️ 3BHK+ Flat",             desc: "3 or more bedrooms" },
  { value: "HOUSE",   label: "🏡 Independent House",       desc: "Villa or independent home" },
  { value: "STUDIO",  label: "🛏️ Studio / 1RK",            desc: "Single room with attached bath" },
];

const formSchema = z.object({
  leadName: z.string().min(2, "Name must be at least 2 characters"),
  leadPhone: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit Indian phone number"),
  propertyType: z.string().default("PG"),
  moveInTimeline: z.enum(["IMMEDIATE", "WITHIN_WEEK", "WITHIN_MONTH", "EXPLORING"]),
  area: z.string().optional(),
  referralCode: z.string().optional(),
});

export default function ReferPage() {
  const [, setLocation] = useLocation();
  const { persona, referrer } = useAppStore();
  const submitReferral = useSubmitReferral();
  const [successData, setSuccessData] = useState<{ id: string; name: string; expert: Expert } | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const refCodeFromUrl = searchParams.get("ref");
  const ctx = readReferContext(searchParams);

  // Resolve expert from context: explicit > persona > area > default
  const ctxCaptain: Expert =
    (ctx.expert && CAPTAIN_BY_ID[ctx.expert]) ||
    (ctx.persona ? captainForPersona(ctx.persona) : null) ||
    (ctx.area ? captainForArea(ctx.area) : null) ||
    captainForArea(null);

  const initialType = (ctx.propertyType as string) || "PG";
  const [selectedType, setSelectedType] = useState(initialType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadName: "",
      leadPhone: "",
      propertyType: initialType,
      moveInTimeline: "WITHIN_WEEK",
      area: ctx.area || "",
      referralCode: refCodeFromUrl || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitReferral.mutate({
      data: {
        leadName: values.leadName,
        leadPhone: values.leadPhone,
        moveInTimeline: values.moveInTimeline as SubmitReferralBodyMoveInTimeline,
        area: values.area,
        referrerId: referrer?.id,
        referrerPhone: referrer?.phone,
        referrerName: referrer?.name,
        referralCode: values.referralCode || undefined,
        propertyType: selectedType,
        captainId: ctxCaptain.id,
        personaId: ctx.persona,
        sourceContext: ctx.source,
      } as any
    }, {
      onSuccess: (data) => {
        setSuccessData({ id: data.referralId, name: data.leadName, expert: ctxCaptain });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#F97316', '#1FA968', '#FFFFFF'] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit referral");
      }
    });
  };

  const copyLink = () => {
    if (referrer) {
      const link = `${window.location.origin}/refer?ref=${referrer.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    }
  };

  const shareWhatsApp = () => {
    if (referrer) {
      const link = `${window.location.origin}/refer?ref=${referrer.referralCode}`;
      const text = `Hey! Looking for a PG, flat or house in Bangalore? Use my Gharpayy Homes link: ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // SUCCESS SCREEN
  if (successData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card p-8 rounded-3xl border border-border shadow-xl text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-black font-display text-foreground mb-2">Referral Sent! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              We'll contact <span className="font-bold text-foreground">{successData.name}</span> shortly to help them find their perfect home.
            </p>
            <div className="bg-muted/50 p-4 rounded-xl border border-border/50 mb-4">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Referral ID</p>
              <p className="text-2xl font-mono font-bold tracking-tight text-primary">{successData.id}</p>
            </div>
            {/* Expert routing card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-[11px] uppercase tracking-widest text-orange-700 font-bold mb-2">Lead routed to</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg font-black">
                  {successData.expert.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-base">{successData.expert.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{successData.expert.title}</p>
                  <p className="text-[11px] text-orange-700 font-semibold mt-0.5">{successData.expert.responseSla}</p>
                </div>
              </div>
              <a
                href={captainWaLink(successData.expert, `Hey ${successData.expert.name}, I just sent you ${successData.name} (${successData.id}). Please take care.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp {successData.expert.name} now
              </a>
            </div>
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="font-bold text-foreground">Earn ₹50</p>
                  <p className="text-sm text-muted-foreground">When lead is verified</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="font-bold text-foreground">Earn ₹500</p>
                  <p className="text-sm text-muted-foreground">When they move in to their new home</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button onClick={() => setSuccessData(null)} className="w-full h-12 text-lg font-bold">
                Refer Another Person
              </Button>
              <Button variant="outline" onClick={() => setLocation("/home")} className="w-full h-12">
                ← Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // GUARD · Super simple
  if (persona === "GUARD") {
    return (
      <Layout>
        <PageHeader title="Paisa Kamao" subtitle="PG · Flat · Ghar · Sab kuch refer karo" backHref="/home" dark />
        <div className="p-4 max-w-md mx-auto mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Property Type Chips */}
              <div>
                <p className="text-zinc-400 font-bold mb-3 text-sm uppercase tracking-wide">Kya dhundh raha hai?</p>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button type="button" key={pt.value}
                      onClick={() => { setSelectedType(pt.value); form.setValue("propertyType", pt.value); }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${selectedType === pt.value ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              <FormField control={form.control} name="leadName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-zinc-300">Naam</FormLabel>
                  <FormControl>
                    <Input placeholder="Bande ka naam" {...field} className="h-16 text-lg rounded-2xl border-2 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="leadPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg text-zinc-300">Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} className="h-16 text-xl tracking-widest font-bold rounded-2xl border-2 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" maxLength={10} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full h-16 text-2xl font-black rounded-full bg-green-500 hover:bg-green-600 text-white shadow-[0_8px_0_rgb(22,163,74)] active:translate-y-2 active:shadow-none transition-all"
                disabled={submitReferral.isPending}
              >
                {submitReferral.isPending ? "Ruko..." : "BHEJ DO 🚀"}
              </Button>
            </form>
          </Form>
        </div>
      </Layout>
    );
  }

  // STANDARD / STUDENT / EARNER Form
  return (
    <Layout>
      <PageHeader title="Send a friend to the right expert" subtitle="We know Bengaluru. Your friend gets the truth · you get ₹500 on move-in." backHref="/home" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">

        {/* Context banner · shown when arriving from Insights */}
        {(ctx.area || ctx.persona || ctx.expert) && (
          <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">
              {ctxCaptain.initial}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-bold text-foreground leading-tight">
                Goes straight to {ctxCaptain.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {ctx.area ? `From ${ctx.area} insights` : ctx.persona ? `Matched via ${ctx.persona}` : ctxCaptain.title} · {ctxCaptain.responseSla}
              </p>
            </div>
          </div>
        )}

        {/* Share Link */}
        {referrer && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-foreground">Your Gharpayy Homes Link</p>
              <p className="text-sm text-muted-foreground">Share · PGs, flats & houses all covered</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none gap-2 border-primary/20 hover:bg-primary/10" onClick={copyLink}>
                <Copy className="w-4 h-4" /> Copy
              </Button>
              <Button className="flex-1 sm:flex-none gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={shareWhatsApp}>
                <Share2 className="w-4 h-4" /> WhatsApp
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Property Type Picker */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">What are they looking for? *</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button type="button" key={pt.value}
                      onClick={() => { setSelectedType(pt.value); form.setValue("propertyType", pt.value); }}
                      className={`py-3 px-3 rounded-xl text-left transition-all border-2 ${selectedType === pt.value ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30"}`}>
                      <p className="font-bold text-sm">{pt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{pt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {!referrer && !refCodeFromUrl && (
                <div className="p-4 bg-muted rounded-xl mb-2">
                  <p className="text-sm text-muted-foreground mb-4">You are not logged in. Enter a referral code if you have one.</p>
                  <FormField control={form.control} name="referralCode" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter referral code (optional)" {...field} className="h-12 font-mono uppercase" />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="leadName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Name *</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} className="h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="leadPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Phone *</FormLabel>
                    <FormControl><Input placeholder="9876543210" {...field} className="h-12" maxLength={10} type="tel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="moveInTimeline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-in Timeline *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">🔥 Immediate</SelectItem>
                        <SelectItem value="WITHIN_WEEK">📅 Within a week</SelectItem>
                        <SelectItem value="WITHIN_MONTH">🗓️ Within a month</SelectItem>
                        <SelectItem value="EXPLORING">🔍 Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="area" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Area (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Koramangala, HSR, Indiranagar" {...field} className="h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={submitReferral.isPending}>
                {submitReferral.isPending ? "Submitting..." : `Submit Referral · ${PROPERTY_TYPES.find(p => p.value === selectedType)?.label ?? "🏠 PG"}`}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
