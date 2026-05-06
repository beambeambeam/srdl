"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { JSX } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@srdl/backend/convex/client";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@srdl/ui/components/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@srdl/ui/components/field";
import type { LocalStorageOptions } from "@srdl/ui/hooks/use-local-storage";
import { useLocalStorage } from "@srdl/ui/hooks/use-local-storage";
import { Textarea } from "@srdl/ui/components/textarea";

import { MAX_WAITING_ANSWER_LENGTH } from "@/features/room/constants";
import { getQuestionIndexes, getQuestionLabel, getRoomStateLabel } from "@/shared/games";

const ONBOARDING_ID_STORAGE_KEY = "id";
const ONBOARDING_NICKNAME_STORAGE_KEY = "nickname";
const WAITING_STATE = "WAITING";
const stringLocalStorageOptions: LocalStorageOptions<string> = {
  defaultValue: "",
  deserializer: (value) => value,
  serializer: (value) => value,
};
const waitingQuestionSchema = z
  .string()
  .trim()
  .min(1, "This answer is required.")
  .max(
    MAX_WAITING_ANSWER_LENGTH,
    `Answer must be ${MAX_WAITING_ANSWER_LENGTH} characters or fewer.`,
  );

interface QuestioningFormProps {
  questionCount: number;
  roomId: GenericId<"rooms">;
  roomState: string;
}

interface QuestionFieldConfig {
  label: string;
  name: string;
}

const getQuestionFieldName = (questionIndex: number): string => `question${questionIndex + 1}`;

const getQuestionFields = (questionCount: number): QuestionFieldConfig[] =>
  getQuestionIndexes(questionCount).map((questionIndex) => ({
    label: getQuestionLabel(questionIndex),
    name: getQuestionFieldName(questionIndex),
  }));

const getInitialFormValues = (questionCount: number): Record<string, string> =>
  Object.fromEntries(
    getQuestionIndexes(questionCount).map((questionIndex) => [
      getQuestionFieldName(questionIndex),
      "",
    ]),
  );

const getQuestioningFormSchema = (questionCount: number) =>
  z.object(
    Object.fromEntries(
      getQuestionIndexes(questionCount).map((questionIndex) => [
        getQuestionFieldName(questionIndex),
        waitingQuestionSchema,
      ]),
    ),
  );

const getQuestionAnswers = (value: Record<string, string>, questionCount: number): string[] =>
  getQuestionIndexes(questionCount).map(
    (questionIndex) => value[getQuestionFieldName(questionIndex)]?.trim() ?? "",
  );

const getFormValuesFromAnswers = (
  answers: string[],
  questionCount: number,
): Record<string, string> =>
  Object.fromEntries(
    getQuestionIndexes(questionCount).map((questionIndex) => [
      getQuestionFieldName(questionIndex),
      answers[questionIndex] ?? "",
    ]),
  );

const focusFirstInvalidInput = (): void => {
  const invalidInput = document.querySelector("[aria-invalid='true']");

  if (invalidInput instanceof HTMLElement) {
    invalidInput.focus();
  }
};

export function QuestioningForm({
  questionCount,
  roomId,
  roomState,
}: QuestioningFormProps): JSX.Element {
  const [playerId] = useLocalStorage(ONBOARDING_ID_STORAGE_KEY, stringLocalStorageOptions);
  const [playerName] = useLocalStorage(ONBOARDING_NICKNAME_STORAGE_KEY, stringLocalStorageOptions);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmittingSubmission, setIsSubmittingSubmission] = useState(false);
  const queryClient = useQueryClient();
  const createSubmission = useMutation(api.games.roomPlayerSubmissions.create);
  const normalizedPlayerId = playerId.trim();
  const normalizedPlayerName = playerName.trim();
  const hasIdentity = normalizedPlayerId !== "" && normalizedPlayerName !== "";
  const isWaitingState = roomState === WAITING_STATE;
  const questionFields = getQuestionFields(questionCount);
  const questioningFormSchema = getQuestioningFormSchema(questionCount);
  const submissionQueryOptions = convexQuery(api.games.roomPlayerSubmissions.getForRoomAndPlayer, {
    playerId: normalizedPlayerId,
    roomId,
  });

  const submissionQuery = useQuery({
    ...submissionQueryOptions,
    enabled: hasIdentity,
  });

  const submission = submissionQuery.data ?? null;
  const isSubmitted = submission !== null;
  let cardDescription = `The room is currently in ${getRoomStateLabel(roomState)}.`;

  if (isSubmitted) {
    cardDescription = "You already submitted your answers for this room.";
  } else if (isWaitingState) {
    cardDescription = `Answer all ${questionCount} questions before the game starts.`;
  }

  const form = useForm({
    defaultValues: getInitialFormValues(questionCount),
    onSubmit: () => {
      setIsConfirmDialogOpen(true);
    },
    onSubmitInvalid: () => {
      focusFirstInvalidInput();
    },
    validators: {
      onBlur: questioningFormSchema,
      onSubmit: questioningFormSchema,
    },
  });

  useEffect(() => {
    if (submission === null) {
      return;
    }

    form.reset(getFormValuesFromAnswers(submission.answers, questionCount));
  }, [form, questionCount, submission]);

  const handleConfirmSubmit = async (): Promise<void> => {
    const value = form.state.values;
    const answers = getQuestionAnswers(value, questionCount);

    try {
      setIsSubmittingSubmission(true);
      await createSubmission({
        answers,
        playerId: normalizedPlayerId,
        playerName: normalizedPlayerName,
        roomId,
      });
      toast.success("Answers submitted successfully.");
      setIsConfirmDialogOpen(false);
      await queryClient.fetchQuery(submissionQueryOptions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit answers.";

      toast.error(message);

      if (message === "You already submitted this form.") {
        await queryClient.fetchQuery(submissionQueryOptions);
      }
    } finally {
      setIsSubmittingSubmission(false);
    }
  };

  if (!hasIdentity) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Complete onboarding first</EmptyTitle>
          <EmptyDescription>
            We need your saved player identity before you can answer this room form.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (submissionQuery.isPending && !submissionQuery.data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading your questions...</p>
      </div>
    );
  }

  if (submissionQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load your form</EmptyTitle>
          <EmptyDescription>We could not load your saved answers right now.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <form
        className={`flex w-full max-w-3xl overflow-hidden ${
          isSubmitted ? "h-fit min-h-fit flex-none" : "min-h-0 flex-1"
        }`}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Card
          className={`flex w-full flex-col overflow-hidden ${
            isSubmitted ? "h-fit" : "h-full min-h-0"
          }`}
        >
          <CardHeader>
            <CardTitle>{isSubmitted ? "Your waiting answers" : "Waiting room questions"}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent
            className={isSubmitted ? "overflow-visible" : "min-h-0 flex-1 overflow-y-auto"}
          >
            <FieldGroup>
              {questionFields.map((questionField) => (
                <form.Field key={questionField.name} name={questionField.name}>
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    const isReadOnly = isSubmitted || !isWaitingState;

                    return (
                      <Field data-invalid={isInvalid ? true : undefined}>
                        <FieldLabel htmlFor={field.name}>{questionField.label}</FieldLabel>
                        <Textarea
                          aria-invalid={isInvalid}
                          disabled={isReadOnly}
                          id={field.name}
                          maxLength={MAX_WAITING_ANSWER_LENGTH}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Type your answer here"
                          readOnly={isReadOnly}
                          rows={4}
                          value={field.state.value}
                        />
                        <FieldDescription />
                        {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                      </Field>
                    );
                  }}
                </form.Field>
              ))}
            </FieldGroup>
          </CardContent>
          {isWaitingState && !isSubmitted ? (
            <CardFooter>
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    className="w-full"
                    disabled={!canSubmit || isSubmitting || isSubmittingSubmission}
                    type="submit"
                  >
                    {isSubmitting || isSubmittingSubmission ? "Submitting..." : "Review and submit"}
                  </Button>
                )}
              </form.Subscribe>
            </CardFooter>
          ) : null}
        </Card>
      </form>

      <Dialog onOpenChange={setIsConfirmDialogOpen} open={isConfirmDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Submit answers?</DialogTitle>
            <DialogDescription>
              This is a one-time form. After you submit, your answers will stay read-only for this
              room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={isSubmittingSubmission}
              onClick={() => setIsConfirmDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Go back
            </Button>
            <Button
              disabled={isSubmittingSubmission}
              onClick={() => {
                void handleConfirmSubmit();
              }}
              type="button"
            >
              {isSubmittingSubmission ? "Submitting..." : "Submit answers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
