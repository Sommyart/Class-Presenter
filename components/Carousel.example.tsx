import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./Carousel";

// Updated PlaceholderImage to accept a height parameter and adjust the image URL accordingly.
const PlaceholderImage = ({
  index,
  alt,
  height = "100%",
}: {
  index: number;
  alt: string;
  height?: string;
}) => {
  // Extract numeric height for the image URL; default to 400 if parsing fails.
  const numericHeight = parseInt(height, 10) || 400;
  return (
    <img
      src={`https://picsum.photos/800/${numericHeight}?random=${index}`}
      alt={alt}
      style={{
        width: "100%",
        height: height,
        objectFit: "cover",
      }}
    />
  );
};

export const BasicCarouselExample = {
  size: "lg",
  backdrop: "surface",
  title: "Basic Horizontal Carousel",
  component: () => (
    <div style={{ height: "200px" }}>
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <PlaceholderImage
              index={1}
              alt="Random landscape 1"
              height="300px"
            />
          </CarouselItem>
          <CarouselItem>
            <PlaceholderImage
              index={2}
              alt="Random landscape 2"
              height="400px"
            />
          </CarouselItem>
          <CarouselItem>
            <PlaceholderImage
              index={3}
              alt="Random landscape 3"
              height="500px"
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const VerticalCarouselExample = {
  size: "lg",
  backdrop: "surface",
  title: "Vertical Carousel",
  component: () => (
    <Carousel orientation="vertical">
      <CarouselContent style={{ height: "400px" }}>
        <CarouselItem>
          <PlaceholderImage index={4} alt="Random landscape 4" />
        </CarouselItem>
        <CarouselItem>
          <PlaceholderImage index={5} alt="Random landscape 5" />
        </CarouselItem>
        <CarouselItem>
          <PlaceholderImage index={6} alt="Random landscape 6" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const MultipleItemsCarouselExample = {
  size: "lg",
  backdrop: "surface",
  title: "Carousel with 3 Visible Items",
  component: () => (
    <Carousel opts={{ loop: false }}>
      <CarouselContent style={{ gap: "var(--spacing-xs)" }}>
        {[1, 2, 3, 4, 5, 6].map((index) => {
          // Use different heights for the multi example.
          const heights = ["150px", "200px", "250px"];
          const height = heights[(index - 1) % heights.length];
          return (
            <CarouselItem
              key={index}
              // Adjust flex basis to display 3 items at once.
              style={{
                flex: "0 0 calc((100% - 0.75rem) / 3)",
                paddingRight: 0,
              }}
            >
              <PlaceholderImage
                index={index}
                alt={`Random landscape ${index}`}
                height={height}
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

