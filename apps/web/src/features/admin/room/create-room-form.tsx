"use client";

import { useMutation } from "convex/react";
import type { JSX } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@srdl/backend/convex/api";
import { Button } from "@srdl/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@srdl/ui/components/field";
import { Input } from "@srdl/ui/components/input";

const createRoomSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Room code must be 6 digits."),
  title: z.string().trim().min(1, "Room title is required."),
});

interface CreateRoomFormProps {
  initialCode: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function CreateRoomForm({
  initialCode,
  onCancel,
  onSuccess,
}: CreateRoomFormProps): JSX.Element {
  const createRoom = useMutation(api.admin.rooms.create);

  const form = useForm({
    defaultValues: {
      code: initialCode,
      title: "",
    },
    onSubmit: async ({ value }) => {
      const parsedValue = createRoomSchema.parse(value);

      try {
        await createRoom({
          code: parsedValue.code,
          title: parsedValue.title,
        });
        toast.success("Room created successfully.");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create room.";
        toast.error(message);
      }
    },
    onSubmitInvalid: () => {
      const invalidInput = document.querySelector("[aria-invalid='true']");

      if (invalidInput instanceof HTMLElement) {
        invalidInput.focus();
      }
    },
    validators: {
      onBlur: createRoomSchema,
      onSubmit: createRoomSchema,
    },
  });

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Room A"
                  value={field.state.value}
                />
                <FieldDescription>
                  Give the room a clear title for admins to find it.
                </FieldDescription>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="code">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel htmlFor={field.name}>6 Digit Code</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  className="font-mono"
                  disabled
                  id={field.name}
                  inputMode="numeric"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  value={field.state.value}
                />
                <FieldDescription>Room codes are generated automatically.</FieldDescription>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create room"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
