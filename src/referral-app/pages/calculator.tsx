// @ts-nocheck
import { useState } from "react";
import { useCalculateEarnings } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, IndianRupee, Star, Zap } from "lucide-react";

const LEVEL_INFO = [
  { level: "BEGINNER", label: "Beginner", minXp: 0, color: "bg-slate-200 text-slate-700" },
  { level: "EXPLORER", label: "Explorer", minXp: 100, color: "bg-blue-100 text-blue-700" },
  { level: "HUSTLER", label: "Hustler", minXp: 300, color: "bg-orange-100 text-orange-700" },
  { level: "PRO", label: "Pro", minXp: 700, color: "bg-purple-100 text-purple-700" },
  { level: "LEGEND", label: "Legend", minXp: 1500, color: "bg-yellow-100 text-yellow-700" },
];

export default function CalculatorPage() {
  const [referrals, setReferrals] = useState(10);
  const [verifyRate, setVerifyRate] = useState(70);
  const [bookRate, setBookRate] = useState(30);

  const { data, isLoading } = useCalculateEarnings({
    referrals,
    verifyRate: verifyRate / 100,
    bookRate: bookRate / 100,
  });

  const levelInfo = data ? LEVEL_INFO.find(l => l.level === data.estimatedLevel) : null;

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" /> Earnings Calculator
          </h1>
          <p className="text-slate-500 text-sm mt-1">See how much you could earn referring people to PGs in Bangalore</p>
        </div>

        {/* Sliders */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-bold text-slate-800">Referrals per week</label>
              <span className="text-2xl font-black text-primary">{referrals}</span>
            </div>
            <input type="range" min={1} max={50} value={referrals} onChange={e => setReferrals(Number(e.target.value))}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1</span><span>50</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-bold text-slate-800">Verification rate</label>
              <span className="text-2xl font-black text-green-600">{verifyRate}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={verifyRate} onChange={e => setVerifyRate(Number(e.target.value))}
              className="w-full accent-green-500" />
            <p className="text-xs text-slate-400 mt-1">% of your referrals that get verified (avg: 65%)</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-bold text-slate-800">Booking rate</label>
              <span className="text-2xl font-black text-blue-600">{bookRate}%</span>
            </div>
            <input type="range" min={5} max={80} step={5} value={bookRate} onChange={e => setBookRate(Number(e.target.value))}
              className="w-full accent-blue-500" />
            <p className="text-xs text-slate-400 mt-1">% that actually move in (avg: 25%)</p>
          </div>
        </div>

        {/* Results */}
        {data && !isLoading && (
          <motion.div key={`${referrals}-${verifyRate}-${bookRate}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Weekly Earnings</p>
                <p className="text-4xl font-black text-green-700">₹{data.totalEarnings.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">{data.verifiedCount} verified · {data.bookedCount} booked</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Monthly Projection</p>
                <p className="text-4xl font-black text-orange-700">₹{data.monthlyProjection.toLocaleString()}</p>
                <p className="text-sm text-orange-600 mt-1">4 weeks × ₹{data.totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-4">Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Verification bonus (₹50 × {data.verifiedCount})</span>
                  <span className="font-bold text-slate-800">₹{data.verificationEarnings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Booking bonus (₹500 × {data.bookedCount})</span>
                  <span className="font-bold text-slate-800">₹{data.bookingEarnings}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total weekly</span>
                  <span className="font-black text-primary">₹{data.totalEarnings}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> XP & Level
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-slate-800">{data.xpEarned} <span className="text-base font-medium text-slate-500">XP</span></p>
                  <p className="text-sm text-slate-500 mt-1">per week at this rate</p>
                </div>
                {levelInfo && (
                  <div className={`px-4 py-2 rounded-xl ${levelInfo.color} font-bold text-sm`}>
                    🏆 {levelInfo.label}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Annual earnings
              </h3>
              <p className="text-5xl font-black text-green-400">₹{(data.monthlyProjection * 12).toLocaleString()}</p>
              <p className="text-slate-400 text-sm mt-2">Assuming consistent weekly performance</p>
            </div>

            <div className="bg-orange-500 rounded-2xl p-5 text-white text-center">
              <p className="font-bold text-lg mb-2">Ready to start earning?</p>
              <p className="text-sm text-orange-100 mb-4">Join thousands earning from PG referrals in Bangalore</p>
              <a href="/register" className="block bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-orange-50 transition-colors">
                Register Now →
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
