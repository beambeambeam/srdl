import { GripVertical, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { Badge } from "@srdl/ui/components/badge";

const questionItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Question text is required."),
});

const QUESTION_COUNT_MISMATCH_ERROR = "Question count must match the number of question rows.";

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
        message: QUESTION_COUNT_MISMATCH_ERROR,
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
    rootErrors.push({ message: QUESTION_COUNT_MISMATCH_ERROR });
  }

  return { rootErrors, rowErrors };
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

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="grid grid-cols-1 md:grid-cols-[1fr_2fr] md:grid-row-2 gap-6">
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <FieldDescription>
                  Give the room a clear title for admins to find it.
                </FieldDescription>
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
                <FieldDescription>Code to get in room!</FieldDescription>
                <Badge className="w-fit h-10 rounded-lg text-xl">{field.state.value}</Badge>
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
                <FieldDescription>
                  Need to create {field.state.value}{" "}
                  {field.state.value === 1 ? "question" : "questions"}.
                </FieldDescription>
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
                {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="questions">
          {(field) => {
            const questionErrors = getQuestionErrors(
              field.state.value,
              form.state.values.questionCount,
            );
            const hasMismatchError = field.state.value.length !== form.state.values.questionCount;
            const hasPromptValidationState = field.state.meta.isTouched || hasAttemptedSubmit;
            const visibleRootErrors =
              hasPromptValidationState || hasMismatchError
                ? questionErrors.rootErrors.filter(
                    (error) =>
                      error.message === QUESTION_COUNT_MISMATCH_ERROR || hasPromptValidationState,
                  )
                : [];
            const visibleRowErrors = hasPromptValidationState ? questionErrors.rowErrors : {};
            const isInvalid =
              visibleRootErrors.length > 0 || Object.keys(visibleRowErrors).length > 0;
            const isAddQuestionDisabled = field.state.value.length >= MAX_ROOM_QUESTION_COUNT;

            return (
              <Field data-invalid={isInvalid ? true : undefined}>
                <FieldLabel>Questions</FieldLabel>
                <FieldDescription>
                  Write each question prompt and drag rows to reorder them.
                </FieldDescription>
                <div className="space-y-2">
                  <Button
                    disabled={isAddQuestionDisabled}
                    onClick={() => {
                      field.handleChange([...field.state.value, getNextQuestion()]);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Add question
                  </Button>
                  {isAddQuestionDisabled ? (
                    <p className="text-muted-foreground text-sm">
                      You can add up to {MAX_ROOM_QUESTION_COUNT} questions.
                    </p>
                  ) : null}
                </div>
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
                          <TableHead className="w-20 bg-transparent text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <SortableContent asChild>
                        <TableBody>
                          {field.state.value.length === 0 ? (
                            <TableRow>
                              <TableCell
                                className="text-muted-foreground py-6 text-center"
                                colSpan={4}
                              >
                                No question rows yet. Add a question to continue.
                              </TableCell>
                            </TableRow>
                          ) : (
                            field.state.value.map((question, index) => {
                              const rowInputId = `${field.name}-${question.id}`;
                              const rowErrors = visibleRowErrors[index] ?? [];
                              const rowIsInvalid = rowErrors.length > 0;

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
                                    <TableCell className="w-20 align-top text-right">
                                      <Button
                                        aria-label={`Remove question ${index + 1}`}
                                        className="size-8"
                                        onClick={() => {
                                          const nextQuestions = field.state.value.filter(
                                            (item) => item.id !== question.id,
                                          );

                                          field.handleChange(nextQuestions);
                                        }}
                                        size="icon"
                                        type="button"
                                        variant="ghost"
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                </SortableItem>
                              );
                            })
                          )}
                        </TableBody>
                      </SortableContent>
                    </Table>
                    <SortableOverlay>
                      <div className="size-full rounded-none bg-primary/10" />
                    </SortableOverlay>
                  </Sortable>
                </div>
                {isInvalid ? <FieldError errors={visibleRootErrors} /> : null}
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
