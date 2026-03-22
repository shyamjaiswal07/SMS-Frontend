import { buildColumns } from "@/features/workspace/workspaceUtils";
import WorkspaceResourceCard from "@/features/workspace/WorkspaceResourceCard";
import type { WorkspaceOption } from "@/features/workspace/workspaceTypes";
import type { LibraryResourceKey } from "./libraryApi";
import type { BookCategoryRow, BookRow } from "./libraryTypes";

type Props = {
  loading: boolean;
  categories: BookCategoryRow[];
  books: BookRow[];
  categoryMap: Map<number, string>;
  categoryOptions: WorkspaceOption[];
  onCreate: (resource: LibraryResourceKey, payload: Record<string, unknown>) => Promise<void>;
};

export default function LibraryCatalogTab({ loading, categories, books, categoryMap, categoryOptions, onCreate }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkspaceResourceCard
        title="Book Categories"
        description="Keep catalog classification simple and reusable across new acquisitions and reports."
        endpoint="/api/library/book-categories/"
        rows={categories}
        loading={loading}
        columns={buildColumns<BookCategoryRow>([
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
        ])}
        createButtonLabel="New Category"
        createFields={[
          { name: "name", label: "Category Name", type: "text", required: true },
          { name: "code", label: "Category Code", type: "text", required: true },
        ]}
        onCreate={(payload) => onCreate("bookCategories", payload)}
      />

      <WorkspaceResourceCard
        title="Books"
        description="Manage the core catalog with author, shelf, and copy information in one dedicated view."
        endpoint="/api/library/books/"
        rows={books}
        loading={loading}
        columns={buildColumns<BookRow>([
          { key: "category", label: "Category", map: categoryMap },
          { key: "title", label: "Title" },
          { key: "author", label: "Author" },
          { key: "total_copies", label: "Total Copies" },
          { key: "available_copies", label: "Available" },
          { key: "shelf_location", label: "Shelf" },
        ])}
        createButtonLabel="New Book"
        createInitialValues={{ total_copies: 1, available_copies: 1 }}
        createFields={[
          { name: "category", label: "Category", type: "select", options: categoryOptions },
          { name: "isbn", label: "ISBN", type: "text" },
          { name: "title", label: "Title", type: "text", required: true },
          { name: "author", label: "Author", type: "text" },
          { name: "publisher", label: "Publisher", type: "text" },
          { name: "publish_year", label: "Publish Year", type: "number" },
          { name: "language", label: "Language", type: "text" },
          { name: "edition", label: "Edition", type: "text" },
          { name: "shelf_location", label: "Shelf Location", type: "text" },
          { name: "total_copies", label: "Total Copies", type: "number", required: true },
          { name: "available_copies", label: "Available Copies", type: "number", required: true },
        ]}
        onCreate={(payload) => onCreate("books", payload)}
      />
    </div>
  );
}
