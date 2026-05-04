"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";
import { useState } from "react";
import { z } from "zod";

import AppLogo from "@/components/logo";
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

const roomCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Room code is required.")
    .regex(/^\d{6}$/, "Room code must be 6 digits."),
});

export default function JoinRoomForm(): JSX.Element {
  const navigate = useNavigate({
    from: "/room",
  });
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      const parsedValue = roomCodeSchema.parse(value);
      const room = await queryClient.fetchQuery(
        convexQuery(api.games.rooms.getByCode, {
          code: parsedValue.code,
        }),
      );

      if (room === null) {
        setSubmitError("Room not found. Check the 6-digit code and try again.");
        return;
      }

      setSubmitError(null);
      await navigate({
        params: {
          id: room._id,
        },
        replace: true,
        to: "/room/$id",
      });
    },
    onSubmitInvalid: () => {
      const invalidInput = document.querySelector("[aria-invalid='true']");

      if (invalidInput instanceof HTMLElement) {
        invalidInput.focus();
      }
    },
    validators: {
      onBlur: roomCodeSchema,
      onSubmit: roomCodeSchema,
    },
  });

  return (
    <form
      className="w-full max-w-md"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Card className="w-full">
        <div className="flex w-full items-center justify-center px-4">
          <AppLogo className="size-60" />
        </div>
        <CardHeader>
          <CardTitle>Join a room</CardTitle>
          <CardDescription>Enter the 6-digit room code shared by the organizer.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <form.Field name="code">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const hasError = isInvalid || submitError !== null;

                return (
                  <Field data-invalid={hasError ? true : undefined}>
                    <FieldLabel htmlFor={field.name}>Room code</FieldLabel>
                    <Input
                      aria-invalid={hasError}
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                      id={field.name}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        if (submitError !== null) {
                          setSubmitError(null);
                        }
                        field.handleChange(event.target.value);
                      }}
                      placeholder="123456"
                      spellCheck={false}
                      value={field.state.value}
                    />
                    <FieldDescription>Use the exact 6-digit code provided to you.</FieldDescription>
                    {hasError ? (
                      <FieldError
                        errors={
                          submitError === null
                            ? field.state.meta.errors
                            : [...field.state.meta.errors, submitError]
                        }
                      />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button className="w-full" disabled={!canSubmit || isSubmitting} type="submit">
                {isSubmitting ? "Joining..." : "Join room"}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </form>
  );
}
