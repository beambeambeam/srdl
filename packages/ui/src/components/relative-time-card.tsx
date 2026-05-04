"use client";

import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@srdl/ui/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@srdl/ui/components/hover-card";

function pluralize(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const isInFuture = diff < 0;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 5) {
    return "just now";
  }

  if (isInFuture) {
    if (seconds < 60) {
      return `in ${pluralize(seconds, "second")}`;
    }
    if (minutes < 60) {
      return `in ${pluralize(minutes, "minute")}`;
    }
    if (hours < 24) {
      return `in ${pluralize(hours, "hour")}`;
    }
    if (days < 7) {
      return `in ${pluralize(days, "day")}`;
    }
    return date.toLocaleDateString();
  }

  if (seconds < 60) {
    return `${pluralize(seconds, "second")} ago`;
  }
  if (minutes < 60) {
    return `${pluralize(minutes, "minute")} ${pluralize(seconds % 60, "second")} ago`;
  }
  if (hours < 24) {
    return `${pluralize(hours, "hour")} ago`;
  }
  if (days < 7) {
    return `${pluralize(days, "day")} ago`;
  }
  return date.toLocaleDateString();
}

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

interface TimezoneCardProps extends React.ComponentProps<"div"> {
  date: Date;
  timezone?: string;
}

function TimezoneCard(props: TimezoneCardProps) {
  const { date, timezone, ...cardProps } = props;

  const locale = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().locale, []);

  const timezoneName = React.useMemo(
    () =>
      timezone ??
      new Intl.DateTimeFormat(locale, { timeZoneName: "shortOffset" })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value,
    [date, timezone, locale],
  );

  const { formattedDate, formattedTime } = React.useMemo(
    () => ({
      formattedDate: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        timeZone: timezone,
        year: "numeric",
      }).format(date),
      formattedTime: new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        hour12: true,
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezone,
      }).format(date),
    }),
    [date, timezone, locale],
  );

  return (
    <div
      role="region"
      aria-label={`Time in ${timezoneName}: ${formattedDate} ${formattedTime}`}
      {...cardProps}
      className="flex items-center justify-between gap-2 text-muted-foreground text-sm"
    >
      <span className="w-fit rounded bg-accent px-1 font-medium text-xs">{timezoneName}</span>
      <div className="flex items-center gap-2">
        <time dateTime={date.toISOString()}>{formattedDate}</time>
        <time className="tabular-nums" dateTime={date.toISOString()}>
          {formattedTime}
        </time>
      </div>
    </div>
  );
}

const triggerVariants = cva(
  "inline-flex w-fit items-center justify-center text-foreground/70 text-sm transition-colors hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "",
        ghost: "hover:underline",
        muted: "text-foreground/50 hover:text-foreground/70",
      },
    },
  },
);

type RelativeTimeCardRootProps = Pick<
  React.ComponentProps<typeof HoverCard>,
  "defaultOpen" | "onOpenChange" | "open"
>;

type RelativeTimeCardContentProps = Pick<
  React.ComponentProps<typeof HoverCardContent>,
  "align" | "alignOffset" | "side" | "sideOffset"
>;

interface RelativeTimeCardProps
  extends
    Omit<React.ComponentProps<"button">, "children">,
    RelativeTimeCardRootProps,
    RelativeTimeCardContentProps,
    VariantProps<typeof triggerVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  date: Date | string | number;
  timezones?: string[];
  updateInterval?: number;
}

function RelativeTimeCard(props: RelativeTimeCardProps) {
  const {
    date: dateProp,
    variant,
    timezones = ["UTC"],
    open,
    defaultOpen,
    onOpenChange,
    align,
    side,
    alignOffset,
    sideOffset,
    updateInterval = 1000,
    asChild,
    children,
    className,
    ...triggerProps
  } = props;

  const date = React.useMemo(
    () => (dateProp instanceof Date ? dateProp : new Date(dateProp)),
    [dateProp],
  );

  const hasValidDate = isValidDate(date);

  const [formattedTime, setFormattedTime] = React.useState<string>(
    hasValidDate ? formatRelativeTime(date) : "",
  );

  React.useEffect(() => {
    if (!hasValidDate) {
      setFormattedTime("");
      return;
    }

    setFormattedTime(formatRelativeTime(date));
    const timer = setInterval(() => {
      setFormattedTime(formatRelativeTime(date));
    }, updateInterval);

    return () => clearInterval(timer);
  }, [date, hasValidDate, updateInterval]);

  const TriggerPrimitive = asChild ? SlotPrimitive.Slot : "button";

  if (!hasValidDate) {
    return children ? (
      <>{children}</>
    ) : (
      <span className={cn(triggerVariants({ className, variant }))}>--</span>
    );
  }

  return (
    <HoverCard open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <HoverCardTrigger
        render={
          <TriggerPrimitive
            {...triggerProps}
            className={cn(triggerVariants({ className, variant }))}
          />
        }
      >
        {children ?? (
          <time dateTime={date.toISOString()} suppressHydrationWarning>
            {formattedTime}
          </time>
        )}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="flex w-full max-w-[420px] flex-col gap-2 p-3"
      >
        <time dateTime={date.toISOString()} className="text-muted-foreground text-sm">
          {formattedTime}
        </time>
        <div role="list" className="flex flex-col gap-1">
          {timezones.map((timezone) => (
            <TimezoneCard key={timezone} role="listitem" date={date} timezone={timezone} />
          ))}
          <TimezoneCard role="listitem" date={date} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export { RelativeTimeCard };
