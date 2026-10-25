import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./Select";

export const BasicSelect = {
  size: "sm",
  backdrop: "surface",
  title: "Basic Select",
  component: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const SelectWithFlex = {
  size: "sm",
  backdrop: "surface",
  title: "Select with flex",
  // Note: Create a new inner flex container instead of styling
  // the item with flex, because the SelectItem component has some
  // inner nesting that will make the flex display on the item
  // not applied to the content.
  component: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
              }}
            >
              <div
                style={{
                  background: "red",
                  height: "var(--spacing-2)",
                  width: "var(--spacing-2)",
                  borderRadius: "var(--spacing-2)",
                }}
              />
              Apple
            </div>
          </SelectItem>
          <SelectItem value="banana">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
              }}
            >
              <div
                style={{
                  background: "yellow",
                  height: "var(--spacing-2)",
                  width: "var(--spacing-2)",
                  borderRadius: "var(--spacing-2)",
                }}
              />
              Banana
            </div>
          </SelectItem>
          <SelectItem value="orange">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
              }}
            >
              <div
                style={{
                  background: "orange",
                  height: "var(--spacing-2)",
                  width: "var(--spacing-2)",
                  borderRadius: "var(--spacing-2)",
                }}
              />
              Orange
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const GroupedSelect = {
  size: "sm",
  backdrop: "surface",
  title: "Select with Groups and Labels",
  component: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const DisabledSelect = {
  size: "sm",
  backdrop: "surface",
  title: "Disabled Select",
  component: () => (
    <Select disabled>
      <SelectTrigger>
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const LongOptionsSelect = {
  size: "sm",
  backdrop: "surface",
  title: "Select with Long Options",
  component: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a long option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="1">
            This is a very long option that should be truncated
          </SelectItem>
          <SelectItem value="2">
            Another long option that demonstrates width handling
          </SelectItem>
          <SelectItem value="3">Short option</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
