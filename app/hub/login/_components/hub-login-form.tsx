"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerStaffUser } from "@/features/staff-auth";

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid staff email address." }),
  password: z.string().min(1, { message: "Please enter your password." }),
  remember: z.boolean().optional(),
});

const signUpSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid staff email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function HubLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSignInSubmit(data: SignInValues) {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email.trim(),
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Authentication failed", {
          description: "Invalid email or password. Please check your credentials.",
        });
        return;
      }

      toast.success("Welcome back!", {
        description: "Authenticated as MedServe clinical staff.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Error signing in", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSignUpSubmit(data: SignUpValues) {
    setLoading(true);
    try {
      const result = await registerStaffUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (!result.ok) {
        toast.error("Sign up failed", {
          description: result.error,
        });
        return;
      }

      toast.success("Account created successfully!", {
        description: "Signing you in to MedServe Hub...",
      });

      // Auto sign in with newly created credentials
      const res = await signIn("credentials", {
        email: data.email.trim(),
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setMode("signin");
        signInForm.setValue("email", data.email);
        toast.info("Please sign in with your new password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Error creating account", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sign In vs Sign Up Sub-toggle */}
      <div className="flex p-1 bg-muted/60 rounded-xl border border-border/40 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            mode === "signin"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            mode === "signup"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {mode === "signin" ? (
        <form noValidate onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={signInForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hub-email" className="text-sm font-medium">
                    Staff Email Address
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="hub-email"
                      type="email"
                      size="lg"
                      placeholder="name@medserve.ng"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={signInForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="hub-password" className="text-sm font-medium">
                      Password
                    </FieldLabel>
                  </div>
                  <div className="relative">
                    <Input
                      {...field}
                      id="hub-password"
                      type={showPassword ? "text" : "password"}
                      size="lg"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={signInForm.control}
              name="remember"
              render={({ field, fieldState }) => (
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Checkbox
                    id="hub-remember"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="hub-remember" className="font-normal text-sm cursor-pointer">
                      Remember me
                    </FieldLabel>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <Button className="w-full mt-2" size="lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      ) : (
        <form noValidate onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={signUpForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hub-signup-name" className="text-sm font-medium">
                    Full Name <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="hub-signup-name"
                      type="text"
                      size="lg"
                      placeholder="e.g. Dr. Ngozi Adeleke"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={signUpForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hub-signup-email" className="text-sm font-medium">
                    Staff Email Address
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="hub-signup-email"
                      type="email"
                      size="lg"
                      placeholder="name@medserve.ng"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={signUpForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hub-signup-password" className="text-sm font-medium">
                    Password (min 8 characters)
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="hub-signup-password"
                      type={showPassword ? "text" : "password"}
                      size="lg"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Button className="w-full mt-2" size="lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
