// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore } from "@/referral-app/lib/store";
import { useRegisterReferrer } from "@/referral-app/api";
import { RegisterReferrerBodyPersona } from "@/referral-app/api";
import { Button } from "@/referral-app/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/referral-app/components/ui/form";
import { Input } from "@/referral-app/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit Indian phone number"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { persona, setReferrer } = useAppStore();
  const registerReferrer = useRegisterReferrer();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  if (!persona) {
    setLocation("/");
    return null;
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerReferrer.mutate({
      data: {
        name: values.name,
        phone: values.phone,
        persona: persona as RegisterReferrerBodyPersona,
      }
    }, {
      onSuccess: (data) => {
        setReferrer(data);
        toast.success("Registration successful!");
        setLocation("/home");
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border/50 bg-primary/5">
          <button 
            onClick={() => setLocation("/")}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to selection
          </button>
          <h2 className="text-2xl font-bold font-display text-foreground">Complete your profile</h2>
          <p className="text-muted-foreground mt-1">
            Setting up your account as a <span className="font-bold text-primary">{persona}</span>.
          </p>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-muted-foreground">+91</span>
                        <Input placeholder="9876543210" {...field} className="h-12 pl-10" maxLength={10} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold" 
                disabled={registerReferrer.isPending}
              >
                {registerReferrer.isPending ? "Creating account..." : "Start Earning"}
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}