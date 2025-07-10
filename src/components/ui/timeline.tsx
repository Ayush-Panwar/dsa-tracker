"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "left" | "right" | "alternate";
  children: React.ReactNode;
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "default" | "primary" | "secondary" | "success" | "info" | "error" | "warning";
  variant?: "filled" | "outlined";
  children?: React.ReactNode;
}

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TimelineContext = React.createContext<{ position: "left" | "right" | "alternate" }>({
  position: "right",
});

export function Timeline({
  position = "right",
  className,
  children,
  ...props
}: TimelineProps) {
  return (
    <TimelineContext.Provider value={{ position }}>
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    </TimelineContext.Provider>
  );
}

export function TimelineItem({ className, children, ...props }: TimelineItemProps) {
  const { position } = React.useContext(TimelineContext);
  
  return (
    <div
      className={cn(
        "relative flex min-h-[70px]",
        position === "left" && "flex-row-reverse",
        position === "alternate" && "odd:flex-row-reverse",
        "mb-6 last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TimelineSeparator({ className, children, ...props }: TimelineSeparatorProps) {
  return (
    <div
      className={cn("flex flex-col items-center mx-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function TimelineDot({
  color = "default",
  variant = "filled",
  className,
  children,
  ...props
}: TimelineDotProps) {
  const colorVariants = {
    default: "bg-gray-400 text-white",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: variant === "filled" ? "bg-green-500 text-white" : "border-green-500 text-green-500",
    info: variant === "filled" ? "bg-blue-500 text-white" : "border-blue-500 text-blue-500",
    error: variant === "filled" ? "bg-red-500 text-white" : "border-red-500 text-red-500",
    warning: variant === "filled" ? "bg-yellow-500 text-white" : "border-yellow-500 text-yellow-500"
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center z-10",
        "w-8 h-8 rounded-full",
        variant === "outlined" && "border-2 bg-white",
        colorVariants[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TimelineConnector({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-grow w-px bg-gray-300", className)}
      {...props}
    />
  );
}

export function TimelineContent({ className, children, ...props }: TimelineContentProps) {
  return (
    <div className={cn("pt-1 flex-1", className)} {...props}>
      {children}
    </div>
  );
} 
 
 
 