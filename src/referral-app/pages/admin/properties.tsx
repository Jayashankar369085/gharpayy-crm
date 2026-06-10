// @ts-nocheck
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetProperties, useAdminVerifyProperty } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Building2, MapPin, CheckCircle2, Clock, Star } from "lucide-react";
import { Badge } from "@/referral-app/components/ui/badge";
import { useToast } from "@/referral-app/hooks/use-toast";

export default function AdminProperties() {
  const { isAdminAuthenticated } = useAdminStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!isAdminAuthenticated) { setLocation("/admin"); return null; }

  const { data: properties, isLoading, refetch } = useAdminGetProperties();
  const verifyProperty = useAdminVerifyProperty();

  const handleVerify = async (id: number) => {
    try {
      await verifyProperty.mutateAsync({ propertyId: id });
      toast({ title: "Property verified!", description: "It will now show the verified badge" });
      refetch();
    } catch {
      toast({ title: "Failed to verify", variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="PG Listings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display text-white">PG Listings</h1>
            <p className="text-slate-400 text-sm">{(properties || []).length} properties in the network</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (properties || []).length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No properties listed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(properties || []).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg">{p.name}</h3>
                      {p.isVerified ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">✓ Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-[10px]">Pending</Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${p.availability === "AVAILABLE" ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30"}`}>
                        {p.availability}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{p.area} · {p.address}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-xl">₹{p.monthlyRent.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">{p.availableRooms}/{p.totalRooms} rooms</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{p.gender}</span>
                    <span>·</span>
                    <span>{p.totalReviews} reviews</span>
                    {p.avgRating && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {(p.avgRating as number).toFixed(1)}
                        </span>
                      </>
                    )}
                    {p.referralBonus > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-orange-400">+₹{p.referralBonus} referral bonus</span>
                      </>
                    )}
                  </div>
                  {!p.isVerified && (
                    <button onClick={() => handleVerify(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Verify
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
