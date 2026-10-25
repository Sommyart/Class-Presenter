import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./HoverCard";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Badge } from "./Badge";
import { CalendarDays, MessageCircle } from "lucide-react";

export const UserProfileHoverCard = {
  size: "md",
  backdrop: "surface",
  title: "User Profile Hover Card",
  component: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a
          href="#"
          style={{ textDecoration: "none", color: "var(--color-primary)" }}
        >
          @sarah_designer
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <Avatar>
            <AvatarImage src="https://picsum.photos/id/64/100" />
            <AvatarFallback>SD</AvatarFallback>
          </Avatar>
          <div>
            <div
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: "var(--font-weight-bold)",
                marginBottom: "var(--spacing-xxs)",
              }}
            >
              Sarah Designer
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                marginBottom: "var(--spacing-xs)",
              }}
            >
              UI/UX Designer & Creative Director
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-sm)",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-xxs)",
                }}
              >
                <CalendarDays size={14} />
                <span style={{ fontSize: "var(--font-size-xs)" }}>
                  Joined Dec 2023
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-xxs)",
                }}
              >
                <MessageCircle size={14} />
                <span style={{ fontSize: "var(--font-size-xs)" }}>
                  1.2K posts
                </span>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

