// @ts-nocheck
import { useParams, useLocation } from "wouter";
import { useGetProperty, useAddPropertyReview } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useAppStore } from "@/referral-app/lib/store";
import { motion } from "framer-motion";
import { MapPin, Star, Wifi, Wind, Utensils, Shield, ChevronLeft, Share2, Copy, Check, Building2, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/referral-app/components/ui/badge";
import { Button } from "@/referral-app/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Input } from "@/referral-app/components/ui/input";
import { Textarea } from "@/referral-app/components/ui/textarea";
import { track } from "@/referral-app/lib/bookos/leads";
import LeadModal from "@/referral-app/components/bookos/LeadModal";
import { Zap, Sparkles, CalendarCheck } from "lucide-react";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  ac: <Wind className="w-4 h-4" />,
  food: <Utensils className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
};

const GENDER_LABELS: Record<string, string> = { MALE: "Boys Only", FEMALE: "Girls Only", ANY: "Co-ed (All genders)" };

export default function PgDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { referrer } = useAppStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [modal, setModal] = useState<any>(null);

  const { data, isLoading, refetch } = useGetProperty(Number(params.id));
  const addReview = useAddPropertyReview();
  useEffect(() => { if (data?.property) track("view", { source: "detail", area: data.property.area, propertyId: data.property.id, propertyName: data.property.name }); }, [data?.property?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-8 bg-slate-100 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">PG not found</p>
        </div>
      </Layout>
    );
  }

  const { property, reviews, nearbyProperties } = data;

  const shareLink = `${window.location.origin}/pg/${property.id}${referrer ? `?ref=${referrer.referralCode}` : ""}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with friends looking for PG" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const msg = `🏠 Found this great PG in ${property.area}!\n\n*${property.name}*\n📍 ${property.address}\n💰 ₹${property.monthlyRent.toLocaleString()}/month\n\nCheck it out: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSubmitReview = async () => {
    if (!reviewName || !reviewComment) return;
    try {
      await addReview.mutateAsync({ propertyId: Number(params.id), data: { reviewerName: reviewName, rating: reviewRating, comment: reviewComment, tags: [] } });
      toast({ title: "Review submitted!", description: "Thank you for your feedback" });
      setShowReviewForm(false);
      setReviewName(""); setReviewComment(""); setReviewRating(5);
      refetch();
    } catch {
      toast({ title: "Failed to submit review", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <button onClick={() => setLocation("/pg")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to listings
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-slate-100 to-blue-50 h-40 flex items-center justify-center relative">
            <Building2 className="w-20 h-20 text-slate-300" />
            <div className="absolute top-4 right-4 flex gap-2">
              {property.isVerified && <Badge className="bg-green-500 text-white">✓ Verified</Badge>}
              <Badge className={property.availability === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {property.availability === "AVAILABLE" ? `${property.availableRooms} rooms available` : "FULL"}
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black font-display text-slate-900">{property.name}</h1>
                <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{property.address}</span>
                </div>
                {property.nearbyMetro && (
                  <div className="text-sm text-slate-400 mt-0.5">🚇 {property.nearbyMetro}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-slate-900">₹{property.monthlyRent.toLocaleString()}<span className="text-base font-normal text-slate-500">/mo</span></div>
                <div className="text-sm text-slate-500">Deposit: ₹{property.deposit.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">{GENDER_LABELS[property.gender]}</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">{property.totalRooms} total rooms</span>
              {property.avgRating && (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-100 rounded-full text-sm font-bold text-slate-700">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  {(property.avgRating as number).toFixed(1)} ({property.totalReviews} reviews)
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <button onClick={() => { track("booking_request", { source: "detail", area: property.area, propertyId: property.id, propertyName: property.name }); setModal({ mode: "booking", area: property.area, propertyId: property.id, propertyName: property.name, rent: property.monthlyRent }); }}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow"><Zap className="w-4 h-4"/> Request booking</button>
              <button onClick={() => { track("quote_request", { source: "detail", area: property.area, propertyId: property.id, propertyName: property.name }); setModal({ mode: "quote", area: property.area, propertyId: property.id, propertyName: property.name, rent: property.monthlyRent }); }}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-amber-800 font-semibold text-sm"><Sparkles className="w-4 h-4"/> Get quote</button>
              <button onClick={() => { track("visit_request", { source: "detail", area: property.area, propertyId: property.id, propertyName: property.name }); setModal({ mode: "visit", area: property.area, propertyId: property.id, propertyName: property.name, rent: property.monthlyRent }); }}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm"><CalendarCheck className="w-4 h-4"/> Visit</button>
            </div>
            {property.referralBonus > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-bold text-orange-800 text-sm">+₹{property.referralBonus} Referral Bonus</p>
                  <p className="text-orange-600 text-xs">Earn extra on top of standard ₹500 for successful bookings here</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description */}
        {property.description && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-2">About this PG</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && (property.amenities as string[]).length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h2 className="font-bold text-slate-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(property.amenities as string[]).map((a: string) => (
                <div key={a} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-primary">{AMENITY_ICONS[a.toLowerCase()] || "✓"}</span>
                  <span className="text-sm font-medium text-slate-700">{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share + Refer */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <h2 className="font-bold text-orange-900 mb-1">Refer this PG, earn ₹{500 + (property.referralBonus || 0)}</h2>
          <p className="text-orange-700 text-sm mb-4">Know someone looking for a PG? Share your link and earn when they move in.</p>
          <div className="flex gap-2">
            <input readOnly value={shareLink} className="flex-1 px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm text-slate-600 truncate" />
            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={handleShareWhatsApp} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors">
            <Share2 className="w-4 h-4" /> Share on WhatsApp
          </button>
        </div>

        {/* Reviews */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Reviews ({reviews.length})</h2>
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <MessageSquare className="w-4 h-4" /> Write review
            </button>
          </div>

          {showReviewForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 bg-slate-50 rounded-xl p-4 space-y-3">
              <Input placeholder="Your name" value={reviewName} onChange={e => setReviewName(e.target.value)} />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)} className={`text-2xl transition-all ${s <= reviewRating ? "text-yellow-400" : "text-slate-200"}`}>★</button>
                ))}
              </div>
              <Textarea placeholder="Share your experience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} />
              <Button onClick={handleSubmitReview} disabled={addReview.isPending} className="w-full">
                {addReview.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </motion.div>
          )}

          {reviews.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="border-b border-slate-50 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800">{r.reviewerName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < r.rating ? "text-yellow-400" : "text-slate-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{r.comment}</p>
                  {r.stayDuration && <p className="text-xs text-slate-400 mt-1">Stayed: {r.stayDuration}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby */}
        {nearbyProperties.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-3">Nearby PGs in {property.area}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyProperties.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => setLocation(`/pg/${p.id}`)}
                  className="bg-white border border-slate-100 rounded-xl p-4 cursor-pointer hover:border-orange-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">₹{p.monthlyRent.toLocaleString()}/mo</p>
                    </div>
                    <Badge variant="outline" className={p.availability === "AVAILABLE" ? "text-green-600 border-green-200" : "text-red-500 border-red-200"}>
                      {p.availability === "AVAILABLE" ? "Available" : "Full"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <LeadModal open={!!modal} onClose={() => setModal(null)} {...(modal || {})}/>
    </Layout>
  );
}
