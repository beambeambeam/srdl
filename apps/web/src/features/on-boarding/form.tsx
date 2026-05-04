"use client";

import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import type { JSX } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@srdl/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@srdl/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@srdl/ui/components/field";
import { Input } from "@srdl/ui/components/input";
import AppLogo from "@/components/logo";

const ONBOARDING_REDIRECT_PATH = "/";
const ONBOARDING_STORAGE_KEY = "onboardingSeen";

const onboardingSchema = z.object({
  age: z
    .string()
    .trim()
    .min(1, "Age is required.")
    .refine((value) => /^\d+$/.test(value), "Age must be a whole number.")
    .refine((value) => Number(value) >= 1, "Age must be at least 1.")
    .refine((value) => Number(value) <= 120, "Age must be 120 or less."),
  nickname: z
    .string()
    .trim()
    .min(2, "Nickname must be at least 2 characters.")
    .max(32, "Nickname must be 32 characters or fewer."),
});

export default function Form(): JSX.Element {
  const navigate = useNavigate({
    from: "/onboarding",
  });

  const form = useForm({
    defaultValues: {
      age: "",
      nickname: "",
    },
    onSubmit: async ({ value }) => {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      toast.success(`Welcome, ${value.nickname.trim()}`);
      await navigate({
        replace: true,
        to: ONBOARDING_REDIRECT_PATH,
      });
    },
    validators: {
      onSubmit: onboardingSchema,
    },
  });

  return (
    <div className="mx-auto flex min-h-svh w-full items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="w-full flex items-center justify-center">
          <AppLogo className="pt-4 size-60" />
        </div>
        <CardHeader>
          <CardTitle>Welcome to our apps!</CardTitle>
          <CardDescription>
            Add a nickname and your age so we can finish your onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="nickname">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid ? true : undefined}>
                      <FieldLabel htmlFor={field.name}>Nickname</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="nickname"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="beam"
                        value={field.state.value}
                      />
                      <FieldDescription>This will be the name shown in the app.</FieldDescription>
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="age">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid ? true : undefined}>
                      <FieldLabel htmlFor={field.name}>How old are you</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        id={field.name}
                        inputMode="numeric"
                        max={120}
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="18"
                        type="number"
                        value={field.state.value}
                      />
                      <FieldDescription>Enter your age in whole years.</FieldDescription>
                      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="bg-transparent border-t-0">
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button className="w-full" disabled={!canSubmit || isSubmitting} type="submit">
                {isSubmitting ? "Saving..." : "Continue"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </div>
  );
}
