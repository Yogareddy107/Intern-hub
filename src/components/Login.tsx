"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Login({ onLogin }: { onLogin: (user: { id: string; name: string; role: 'admin' | 'intern' }) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Check if admin
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("name", name.trim())
        .single();

      if (admin) {
        onLogin({ id: admin.id, name: admin.name, role: 'admin' });
        toast.success(`Welcome back, Founder ${admin.name}!`);
        return;
      }

      // Check if intern
      const { data: intern, error: internError } = await supabase
        .from("interns")
        .select("*")
        .eq("name", name.trim())
        .single();

      if (intern) {
        onLogin({ id: intern.id, name: intern.name, role: 'intern' });
        toast.success(`Welcome back, ${intern.name}!`);
      } else {
        toast.error("User not found. Please contact the founder.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl">
            <CardHeader className="space-y-4 p-6 sm:p-8 flex flex-col items-center">
              <div className="w-full flex justify-center mb-2">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT_Image_Dec_26__2025__08_46_41_PM-removebg-preview-1766762272245.png?width=8000&height=8000&resize=contain" 
                  alt="Team IntraSphere" 
                  width={300}
                  height={120}
                  className="h-auto w-auto max-h-32 object-contain"
                  priority
                />
              </div>
              <CardDescription className="text-center text-sm sm:text-base">
                Enter your name to access the portal
              </CardDescription>
            </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 px-6 sm:px-8">
              <div className="space-y-2">
                <Input
                  id="name"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 sm:h-12 text-base sm:text-lg"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="p-6 sm:p-8 pt-4 sm:pt-4">
              <Button type="submit" className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
