/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("Gives an overview of project.", () => {
    render(<Home />);

    const text = screen.getByText(
      /Glean Family Tree helps you organize, visualize, and share your family history/i,
    );

    expect(text).toBeInTheDocument();
  });
});
