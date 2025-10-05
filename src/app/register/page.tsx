
'use client';

import { Suspense } from "react";
import RegisterForm from "./RegisterForm";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
