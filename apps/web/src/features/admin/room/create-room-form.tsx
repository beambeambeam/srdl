"use client";

import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@srdl/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@srdl/ui/components/field";
import { Input } from "@srdl/ui/components/input";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@srdl/ui/components/number-field";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@srdl/ui/components/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@srdl/ui/components/table";
import {
  DEFAULT_NEW_ROOM_QUESTION_COUNT,
  MAX_ROOM_QUESTION_COUNT,
  MIN_ROOM_QUESTION_COUNT,
} from "@/shared/games";

const questionItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Question text is required."),
});

const createRoomSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Room code must be 6 digits."),
    questionCount: z
      .number()
      .int("Question count must be a whole number.")
      .superRefine((value, context) => {
        if (value === 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `At least ${MIN_ROOM_QUESTION_COUNT} question is required.`,
          });
          return;
        }

        if (value < MIN_ROOM_QUESTION_COUNT) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Question count must be at least ${MIN_ROOM_QUESTION_COUNT}.`,
          });
        }

        if (value > MAX_ROOM_QUESTION_COUNT) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Question count cannot be more than ${MAX_ROOM_QUESTION_COUNT}.`,
          });
        }
      }),
    questions: z.array(questionItemSchema),
    title: z.string().trim().min(1, "Room title is required."),
  })
  .superRefine((value, context) => {
    if (value.questions.length !== value.questionCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Exactly ${value.questionCount} questions are required.`,
        path: ["questions"],
      });
    }
  });

interface QuestionItem {
  id: string;
  text: string;
}

interface QuestionErrors {
  rootErrors: { message?: string }[];
  rowErrors: Record<number, { message?: string }[]>;
}

const createQuestionItem = (initialCode: string, questionId: number): QuestionItem => ({
  id: `${initialCode}-question-${questionId}`,
  text: "",
});

const getQuestionErrors = (questions: QuestionItem[], questionCount: number): QuestionErrors => {
  const result = createRoomSchema.shape.questions.safeParse(questions);
  const rootErrors: { message?: string }[] = [];
  const rowErrors: Record<number, { message?: string }[]> = {};

  if (!result.success) {
    for (const issue of result.error.issues) {
      const [, rowIndex, key] = issue.path;

      if (typeof rowIndex === "number" && key === "text") {
        rowErrors[rowIndex] ??= [];
        rowErrors[rowIndex].push({ message: issue.message });
        continue;
      }

      rootErrors.push({ message: issue.message });
    }
  }

  if (questions.length !== questionCount) {
    rootErrors.push({ message: `Exactly ${questionCount} questions are required.` });
  }

  return { rootErrors, rowErrors };
};

const getQuestionsForCount = (
  questions: QuestionItem[],
  questionCount: number,
  createQuestion: () => QuestionItem,
): QuestionItem[] => {
  if (questions.length === questionCount) {
    return questions;
  }

  if (questions.length > questionCount) {
    return questions.slice(0, questionCount);
  }

  return [
    ...questions,
    ...Array.from({ length: questionCount - questions.length }, () => createQuestion()),
  ];
};

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
  const nextQuestionId = useRef(0);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const getNextQuestion = useCallback((): QuestionItem => {
    const question = createQuestionItem(initialCode, nextQuestionId.current);
    nextQuestionId.current += 1;

    return question;
  }, [initialCode]);

  const form = useForm({
    defaultValues: {
      code: initialCode,
      questionCount: DEFAULT_NEW_ROOM_QUESTION_COUNT,
      questions: [getNextQuestion()],
      title: "",
    },
    onSubmit: ({ value }) => {
      setHasAttemptedSubmit(true);
      createRoomSchema.parse(value);

      toast.success("Validation passed.");
      onSuccess?.();
    },
    onSubmitInvalid: () => {
      setHasAttemptedSubmit(true);
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

  useEffect(() => {
    const syncedQuestions = getQuestionsForCount(
      form.state.values.questions,
      form.state.values.questionCount,
      getNextQuestion,
    );

    if (syncedQuestions !== form.state.values.questions) {
      form.setFieldValue("questions", syncedQuestions);
    }
  }, [form, form.state.values.questionCount, form.state.values.questions, getNextQuestion]);

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

        <form.Field name="questionCount">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel htmlFor={field.name}>Question</FieldLabel>
                <NumberField
                  allowWheelScrub
                  defaultValue={DEFAULT_NEW_ROOM_QUESTION_COUNT}
                  id={field.name}
                  max={MAX_ROOM_QUESTION_COUNT}
                  min={MIN_ROOM_QUESTION_COUNT}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onValueChange={(value) =>
                    field.handleChange(value ?? DEFAULT_NEW_ROOM_QUESTION_COUNT)
                  }
                  step={1}
                  value={field.state.value}
                >
                  <NumberFieldGroup aria-invalid={isInvalid}>
                    <NumberFieldDecrement />
                    <NumberFieldInput aria-invalid={isInvalid} />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
                <FieldDescription>
                  Need to create {field.state.value}{" "}
                  {field.state.value === 1 ? "question" : "questions"}.
                </FieldDescription>
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="questions">
          {(field) => {
            const hasValidationState = field.state.meta.isTouched || hasAttemptedSubmit;
            const questionErrors = getQuestionErrors(
              field.state.value,
              form.state.values.questionCount,
            );
            const isInvalid =
              hasValidationState &&
              (questionErrors.rootErrors.length > 0 ||
                Object.keys(questionErrors.rowErrors).length > 0);

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel>Questions</FieldLabel>
                <FieldDescription>
                  Write each question prompt and drag rows to reorder them. The list always matches
                  the selected question count.
                </FieldDescription>
                <div className="overflow-hidden rounded-md border">
                  <Sortable
                    getItemValue={(item) => item.id}
                    onValueChange={(questions) => field.handleChange(questions)}
                    value={field.state.value}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-accent/50">
                          <TableHead className="w-12 bg-transparent" />
                          <TableHead className="w-32 bg-transparent">Index</TableHead>
                          <TableHead className="bg-transparent">Prompt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <SortableContent asChild>
                        <TableBody>
                          {field.state.value.map((question, index) => {
                            const rowInputId = `${field.name}-${question.id}`;
                            const rowErrors = questionErrors.rowErrors[index] ?? [];
                            const rowIsInvalid = isInvalid && rowErrors.length > 0;

                            return (
                              <SortableItem asChild key={question.id} value={question.id}>
                                <TableRow>
                                  <TableCell className="w-12 align-top">
                                    <SortableItemHandle asChild>
                                      <Button className="size-8" size="icon" variant="ghost">
                                        <GripVertical className="size-4" />
                                      </Button>
                                    </SortableItemHandle>
                                  </TableCell>
                                  <TableCell className="font-medium whitespace-normal">
                                    {`${index + 1}`}
                                  </TableCell>
                                  <TableCell className="whitespace-normal">
                                    <div className="space-y-2">
                                      <Input
                                        aria-invalid={rowIsInvalid}
                                        id={rowInputId}
                                        name={rowInputId}
                                        onBlur={field.handleBlur}
                                        onChange={(event) => {
                                          const nextQuestions = field.state.value.map((item) =>
                                            item.id === question.id
                                              ? { ...item, text: event.target.value }
                                              : item,
                                          );

                                          field.handleChange(nextQuestions);
                                        }}
                                        placeholder={`Enter question ${index + 1}`}
                                        value={question.text}
                                      />
                                      {rowIsInvalid ? <FieldError errors={rowErrors} /> : null}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </SortableItem>
                            );
                          })}
                        </TableBody>
                      </SortableContent>
                    </Table>
                    <SortableOverlay>
                      <div className="size-full rounded-none bg-primary/10" />
                    </SortableOverlay>
                  </Sortable>
                </div>
                {isInvalid ? <FieldError errors={questionErrors.rootErrors} /> : null}
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
