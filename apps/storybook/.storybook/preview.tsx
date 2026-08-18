import type { Decorator, Preview } from "@storybook/react-vite";
import "./preview.css";

/**
 * Dark is the default; light is opt-in via a `.light` class. The toolbar
 * control below flips it so every story can be checked in both themes —
 * a token that only works in one of them is a bug we want to see here
 * rather than in an app.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals["theme"] as "dark" | "light";
  // Fullscreen stories (the rail, the shell) manage their own height and must
  // not inherit the padding, or the viewport overflows and their bottom-pinned
  // controls fall below the fold.
  const fullscreen = context.parameters["layout"] === "fullscreen";
  return (
    <div className={theme === "light" ? "light" : undefined}>
      <div
        className={
          fullscreen ? "bg-bg text-fg h-dvh" : "bg-bg text-fg min-h-screen p-8"
        }
      >
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: {
    theme: "dark",
  },
  globalTypes: {
    theme: {
      description: "Design system theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "dark", title: "Dark (default)" },
          { value: "light", title: "Light" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
};

export default preview;
