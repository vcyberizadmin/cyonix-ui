/**
 * CX-TBL — DataTable and Pagination.
 *
 * The table has two modes that look identical from outside and behave
 * oppositely: uncontrolled, where it genuinely reorders the rows, and
 * controlled, where the caller owns ordering and the table must NOT touch it.
 * Getting that backwards produces a table that sorts twice, or one that
 * appears to ignore its own header — both plausible-looking and both wrong.
 *
 * Pagination's arithmetic is the other half: "Showing 1–25 of 140" is a
 * promise, and the boundary cases (empty, last partial page, single page) are
 * where the off-by-one lives.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, Pagination, Progress, SeverityCounts } from "../src/table/index.js";
import type { Column } from "../src/table/index.js";

interface Row {
  id: string;
  host: string;
  score: number;
  severity: string;
}

const ROWS: Row[] = [
  { id: "1", host: "web-03", score: 42, severity: "Low" },
  { id: "2", host: "api-01", score: 91, severity: "Critical" },
  { id: "3", host: "db-02", score: 7, severity: "Medium" },
];

const COLUMNS: Column<Row>[] = [
  {
    key: "host",
    header: "Host",
    cell: (r) => r.host,
    sortable: true,
    sortAs: "text",
    sortValue: (r) => r.host,
  },
  {
    key: "score",
    header: "Score",
    cell: (r) => r.score,
    sortable: true,
    sortAs: "number",
    sortValue: (r) => r.score,
  },
  {
    key: "severity",
    header: "Severity",
    cell: (r) => r.severity,
    sortable: true,
    sortAs: "severity",
    sortValue: (r) => r.severity,
  },
];

/** The host column's cell text, in rendered order. */
function hostOrder(): string[] {
  const body = screen.getAllByRole("rowgroup").at(-1)!;
  return within(body)
    .getAllByRole("row")
    .map((row) => within(row).getAllByRole("cell")[0]!.textContent!.trim());
}

describe("DataTable — structure", () => {
  it("renders a real table with a header per column", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("renders one row per record", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const body = screen.getAllByRole("rowgroup").at(-1)!;
    expect(within(body).getAllByRole("row")).toHaveLength(3);
  });

  it("passes the RENDERED index to the cell renderer", () => {
    // Documented: a numbered column has to stay in step when the table sorts.
    render(
      <DataTable
        rowKey={(r: Row) => r.id}
        rows={ROWS}
        columns={[{ key: "n", header: "#", cell: (_r: Row, i: number) => i + 1 }]}
      />,
    );
    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "3" })).toBeInTheDocument();
  });
});

describe("DataTable — sorting, uncontrolled", () => {
  it("marks sortable headers as sortable and the rest as not", () => {
    render(
      <DataTable
        rowKey={(r: Row) => r.id}
        rows={ROWS}
        columns={[...COLUMNS, { key: "x", header: "Actions", cell: () => null }]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /Host/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: /Actions/ })).not.toHaveAttribute("aria-sort");
  });

  it("sorts text ascending on first click", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);

    await user.click(screen.getByRole("button", { name: /Host/ }));

    expect(hostOrder()).toEqual(["api-01", "db-02", "web-03"]);
  });

  it("reverses on the second click and reports it in aria-sort", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);

    const header = screen.getByRole("button", { name: /Host/ });
    await user.click(header);
    expect(screen.getByRole("columnheader", { name: /Host/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await user.click(header);
    expect(hostOrder()).toEqual(["web-03", "db-02", "api-01"]);
    expect(screen.getByRole("columnheader", { name: /Host/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("sorts numbers numerically, not as strings", () => {
    // "7" > "42" as text. This is the classic silent wrong-order bug.
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);

    return user.click(screen.getByRole("button", { name: /Score/ })).then(() => {
      expect(hostOrder()).toEqual(["db-02", "web-03", "api-01"]);
    });
  });

  it("sorts severity by rank, so Critical comes first", async () => {
    // Alphabetically, Critical < Low < Medium — which is meaningless. The
    // documented contract is rank order.
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);

    await user.click(screen.getByRole("button", { name: /Severity/ }));

    expect(hostOrder()).toEqual(["api-01", "db-02", "web-03"]);
  });

  it("only one column is sorted at a time", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);

    await user.click(screen.getByRole("button", { name: /Host/ }));
    await user.click(screen.getByRole("button", { name: /Score/ }));

    expect(screen.getByRole("columnheader", { name: /Host/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: /Score/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });
});

describe("DataTable — sorting, controlled", () => {
  it("reports the requested sort and reorders NOTHING itself", async () => {
    // The caller owns ordering — typically because the sort happens server-side.
    // A table that also sorts locally would show the wrong page of results.
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(r) => r.id}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Host/ }));

    expect(onSortChange).toHaveBeenCalledOnce();
    expect(hostOrder()).toEqual(["web-03", "api-01", "db-02"]);
  });
});

describe("DataTable — states", () => {
  it("shows the empty state in its own body, keeping the headers", () => {
    // Documented: loading, empty and error render in the table's OWN body,
    // never replacing it — so the columns do not vanish under the reader.
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(r: Row) => r.id}
        empty={{ variant: "empty", title: "No assets yet" }}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getByText("No assets yet")).toBeInTheDocument();
  });

  it("shows an error without dropping the table", () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(r: Row) => r.id}
        error={{ title: "Could not load assets" }}
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Could not load assets")).toBeInTheDocument();
  });

  it("renders no data rows while loading", () => {
    render(
      <DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} loading />,
    );
    expect(screen.queryByText("web-03")).not.toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("states the range and the total", () => {
    render(<Pagination page={1} pageSize={25} total={140} onPageChange={() => {}} />);
    expect(screen.getByText(/1–25/)).toBeInTheDocument();
    expect(screen.getByText("140")).toBeInTheDocument();
  });

  it("computes the last partial page correctly", () => {
    // 140 / 25 = 5.6 → 6 pages, last one holding 15.
    render(<Pagination page={6} pageSize={25} total={140} onPageChange={() => {}} />);
    expect(screen.getByText(/126–140/)).toBeInTheDocument();
    expect(screen.getByText(/Page/)).toHaveTextContent("Page 6 of 6");
  });

  it("shows 0–0 for an empty result rather than 1–0", () => {
    render(<Pagination page={1} pageSize={25} total={0} onPageChange={() => {}} />);
    expect(screen.getByText(/0–0/)).toBeInTheDocument();
  });

  it("reports at least one page even when empty", () => {
    // Math.ceil(0 / 25) is 0; "Page 1 of 0" is nonsense.
    render(<Pagination page={1} pageSize={25} total={0} onPageChange={() => {}} />);
    expect(screen.getByText(/Page/)).toHaveTextContent("Page 1 of 1");
  });

  it("disables Previous on the first page", () => {
    render(<Pagination page={1} pageSize={25} total={140} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    render(<Pagination page={6} pageSize={25} total={140} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("disables both when everything fits on one page", () => {
    render(<Pagination page={1} pageSize={25} total={10} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("steps forwards and backwards", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={3} pageSize={25} total={140} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("announces the range politely as it changes", () => {
    const { container } = render(
      <Pagination page={1} pageSize={25} total={140} onPageChange={() => {}} />,
    );
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(/1–25/);
  });

  it("offers page sizes only when the caller can handle a change", () => {
    const { rerender } = render(
      <Pagination page={1} pageSize={25} total={140} onPageChange={() => {}} />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    rerender(
      <Pagination
        page={1}
        pageSize={25}
        total={140}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

describe("cells", () => {
  it("SeverityCounts renders each present rank", () => {
    render(<SeverityCounts counts={{ Critical: 2, High: 5 }} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("Progress reports its value to assistive tech or as text", () => {
    const { container } = render(<Progress value={40} />);
    expect(container.textContent).toMatch(/40/);
  });
});
