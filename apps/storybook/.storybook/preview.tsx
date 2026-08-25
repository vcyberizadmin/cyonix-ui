import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "./preview.css";

/**
 * Dark is the default; light is opt-in via a `.light` class. The toolbar
 * control below flips it so every story can be checked in both themes —
 * a token that only works in one of them is a bug we want to see here
 * rather than in an app.
 *
 * The class goes on <html>, NOT on a wrapper div, and that distinction is
 * load-bearing. Overlays portal to document.body — see `usePortalTarget` — so
 * with the class on a wrapper, every Menu, Popover, Modal, Drawer, Tooltip and
 * DatePicker panel renders OUTSIDE the light scope and keeps the dark tokens
 * while the page behind it is light. The theme sheet scopes `.light` to the
 * element rather than to `:root` precisely so it can live on <html> here.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals["theme"] as "dark" | "light";
  // Fullscreen stories (the rail, the shell) manage their own height and must
  // not inherit the padding, or the viewport overflows and their bottom-pinned
  // controls fall below the fold.
  const fullscreen = context.parameters["layout"] === "fullscreen";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    return () => root.classList.remove("light");
  }, [theme]);

  return (
    <div
      className={
        fullscreen ? "bg-bg text-fg h-dvh" : "bg-bg text-fg min-h-screen p-8"
      }
    >
      <Story />
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
