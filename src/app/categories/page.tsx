"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Tags, Search,
  Network, LayoutGrid, AlignJustify,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  children: Category[];
  _count?: { children: number; inventoryItems: number };
}

interface FlatCategory {
  id: string;
  name: string;
  parentId: string | null;
}

const NODE_COLOR = {
  bg: "bg-tertiary",
  ring: "ring-tertiary/20",
  line: "bg-tertiary/20",
  light: "bg-tertiary/8",
  text: "text-tertiary",
  accent: "#2A7D6E",
};

function getColor(_index: number) {
  return NODE_COLOR;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", parentId: "", description: "" });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchCategories() {
    const [tree, flat] = await Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/categories/flat").then((r) => r.json()),
    ]);
    setCategories(tree);
    setFlatCategories(flat);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate(parentId?: string) {
    setEditId(null);
    setForm({ name: "", parentId: parentId || "", description: "" });
    setError("");
    setDialogOpen(true);
  }

  function openEdit(cat: FlatCategory) {
    setEditId(cat.id);
    setForm({ name: cat.name, parentId: cat.parentId || "", description: "" });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setError("");
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        parentId: form.parentId || null,
        description: form.description || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      return;
    }
    setDialogOpen(false);
    toast.success(editId ? "Category updated" : "Category created");
    fetchCategories();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Cannot delete category");
      return;
    }
    toast.success("Category deleted");
    fetchCategories();
  }

  const totalCategories = flatCategories.length;
  const topLevel = categories.length;
  const subCategories = totalCategories - topLevel;

  const filteredCategories = searchQuery
    ? categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.children?.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;

  return (
    <AppShell title="Categories">

      {/* ── Premium Header ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary/15 to-tertiary/5 flex items-center justify-center ring-1 ring-tertiary/20 shrink-0">
              <Tags className="w-5 h-5 text-tertiary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Categories</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Organize ingredients into trackable groups
              </p>
            </div>
          </div>
          <Button
            onClick={() => openCreate()}
            className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl h-9 px-4 text-sm font-medium shrink-0 "
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Category
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-xl p-4 border border-outline-variant/15 ">
            <p className="text-2xl font-bold text-on-surface tracking-tight">{totalCategories}</p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Total Categories</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-outline-variant/15 ">
            <p className="text-2xl font-bold text-tertiary tracking-tight">{topLevel}</p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Top-level Groups</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-outline-variant/15 ">
            <p className="text-2xl font-bold text-on-surface tracking-tight">{subCategories}</p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Sub-categories</p>
          </div>
        </div>
      </div>

      {/* ── Tabs + Search ── */}
      <Tabs defaultValue="tree">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <TabsList variant="default">
            <TabsTrigger value="tree">
              <Network className="w-3.5 h-3.5" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <AlignJustify className="w-3.5 h-3.5" />
              List
            </TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-surface-container border-0 text-sm"
            />
          </div>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
          </div>

        /* ── Empty ── */
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-4">
              <Tags className="w-8 h-8 text-tertiary" />
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-1">
              {searchQuery ? "No matches found" : "No categories yet"}
            </h3>
            <p className="text-sm text-on-surface-variant mb-5">
              {searchQuery ? "Try a different search term" : "Create your first category to start organizing"}
            </p>
            {!searchQuery && (
              <Button onClick={() => openCreate()} className="bg-tertiary text-white rounded-xl h-9 ">
                <Plus className="w-4 h-4 mr-1.5" /> Create Category
              </Button>
            )}
          </div>

        ) : (
          <>
            {/* ── Tree View ── */}
            <TabsContent value="tree">
              <div className="space-y-1">
                {filteredCategories.map((cat, i) => (
                  <MindMapBranch
                    key={cat.id}
                    category={cat}
                    colorIndex={i}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAddChild={openCreate}
                    isRoot
                  />
                ))}
              </div>
            </TabsContent>

            {/* ── Grid View ── */}
            <TabsContent value="grid">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat, i) => (
                  <CategoryGridCard
                    key={cat.id}
                    category={cat}
                    colorIndex={i}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onAddChild={openCreate}
                  />
                ))}
              </div>
            </TabsContent>

            {/* ── List View ── */}
            <TabsContent value="list">
              <CategoryListView
                categories={filteredCategories}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddChild={openCreate}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md border border-outline-variant/20 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-on-surface text-lg font-semibold">
              {editId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dairy, Meat, Vegetables..."
                required
                className="rounded-xl h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">Parent Category</Label>
              <Select value={form.parentId || "NONE"} onValueChange={(v) => setForm(f => ({ ...f, parentId: v === "NONE" ? "" : (v ?? "") }))}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue placeholder="None (top-level)">
                    {form.parentId
                      ? (flatCategories.find(c => c.id === form.parentId)?.name ?? "None (top-level)")
                      : "None (top-level)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (top-level)</SelectItem>
                  {flatCategories.filter(c => c.id !== editId).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">
                Description <span className="text-on-surface-variant/50 font-normal">(optional)</span>
              </Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                className="rounded-xl h-9"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-tertiary hover:bg-tertiary/90 text-white rounded-xl h-9 mt-2 "
            >
              {editId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ── Grid Card ────────────────────────────────────────────────────── */

function CategoryGridCard({
  category,
  colorIndex,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  colorIndex: number;
  onEdit: (cat: FlatCategory) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const color = getColor(colorIndex);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-outline-variant/15 transition-colors duration-200 overflow-hidden hover:border-tertiary/30">
      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center ring-4 shrink-0",
            color.bg, color.ring
          )}>
            <Tags className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-on-surface leading-snug truncate">
              {category.name}
            </h3>
            <p className={cn("text-xs font-medium mt-0.5", color.text)}>
              {hasChildren ? `${category.children.length} subcategories` : "No subcategories"}
            </p>
          </div>
        </div>

        {/* Subcategory chips */}
        <div className="flex flex-wrap gap-1.5 flex-1 mb-4 min-h-[28px]">
          {hasChildren ? (
            <>
              {category.children.slice(0, 5).map((child) => (
                <span
                  key={child.id}
                  className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium", color.light, color.text)}
                >
                  {child.name}
                </span>
              ))}
              {category.children.length > 5 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-surface-container text-on-surface-variant">
                  +{category.children.length - 5}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-on-surface-variant/40 italic">Empty group</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/10">
          <button
            onClick={() => onAddChild(category.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-all",
              color.light, color.text, "hover:opacity-75"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Sub
          </button>
          <button
            onClick={() => onEdit(category)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-on-surface-variant/50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── List View ────────────────────────────────────────────────────── */

function CategoryListView({
  categories,
  onEdit,
  onDelete,
  onAddChild,
}: {
  categories: Category[];
  onEdit: (cat: FlatCategory) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/15  overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-surface-container/50 border-b border-outline-variant/10">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Category</span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-20 text-center">Children</span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-24 text-right">Actions</span>
      </div>

      {categories.map((cat, i) => (
        <div key={cat.id}>
          {/* Root row */}
          <ListRow
            label={cat.name}
            childCount={cat.children?.length ?? 0}
            colorIndex={i}
            indent={0}
            onEdit={() => onEdit(cat)}
            onDelete={() => onDelete(cat.id)}
            onAddChild={() => onAddChild(cat.id)}
            isLast={false}
          />

          {/* Child rows */}
          {cat.children?.map((child, j) => (
            <ListRow
              key={child.id}
              label={child.name}
              parentName={cat.name}
              childCount={child.children?.length ?? 0}
              colorIndex={i}
              indent={1}
              onEdit={() => onEdit(child)}
              onDelete={() => onDelete(child.id)}
              onAddChild={() => onAddChild(child.id)}
              isLast={j === cat.children.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListRow({
  label,
  parentName,
  childCount,
  colorIndex,
  indent,
  onEdit,
  onDelete,
  onAddChild,
}: {
  label: string;
  parentName?: string;
  childCount: number;
  colorIndex: number;
  indent: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  isLast: boolean;
}) {
  const color = getColor(colorIndex);
  return (
    <div className={cn(
      "grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-outline-variant/10 last:border-0 group items-center",
      "hover:bg-surface-container/40 transition-colors",
      indent === 1 && "bg-surface-container/20"
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        {indent === 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-4 h-px bg-outline-variant/30" />
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", color.bg)} />
          </div>
        )}
        {indent === 0 && (
          <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", color.bg)} />
        )}
        <div className="min-w-0">
          <span className={cn(
            "font-medium truncate block",
            indent === 0 ? "text-[14px] text-on-surface" : "text-sm text-on-surface-variant"
          )}>
            {label}
          </span>
          {parentName && (
            <span className="text-xs text-on-surface-variant/50">in {parentName}</span>
          )}
        </div>
      </div>

      <div className="w-20 flex justify-center">
        {childCount > 0 ? (
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", color.light, color.text)}>
            {childCount}
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant/30">—</span>
        )}
      </div>

      <div className="w-24 flex justify-end items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onAddChild}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-tertiary/10 text-on-surface-variant/40 hover:text-tertiary transition-colors"
          title="Add sub-category"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-container text-on-surface-variant/40 hover:text-on-surface transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-on-surface-variant/40 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Mind Map Branch (Tree View) ──────────────────────────────────── */

function MindMapBranch({
  category,
  colorIndex,
  onEdit,
  onDelete,
  onAddChild,
  isRoot = false,
  depth = 0,
}: {
  category: Category;
  colorIndex: number;
  onEdit: (cat: FlatCategory) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  isRoot?: boolean;
  depth?: number;
}) {
  const color = getColor(colorIndex);
  const hasChildren = category.children && category.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn("relative", isRoot && "mb-2")}>
      {/* Node Row */}
      <div
        className="flex items-center group"
        style={{ paddingLeft: isRoot ? 0 : `${depth * 32 + 24}px` }}
      >
        {/* Connector line from parent */}
        {!isRoot && (
          <div className="absolute" style={{ left: `${depth * 32 + 8}px` }}>
            <div className={cn("w-4 h-px", color.line)} />
          </div>
        )}

        {/* Node icon */}
        <div className="relative z-10 mr-3 shrink-0">
          {isRoot ? (
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center ring-4 ",
              color.bg, color.ring
            )}>
              <Tags className="w-4 h-4 text-white" />
            </div>
          ) : hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center ring-2 transition-all hover:scale-110",
                color.light, color.ring
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", color.bg)} />
            </button>
          ) : (
            <div className={cn("w-2.5 h-2.5 rounded-full ring-2", color.bg, color.ring)} />
          )}
        </div>

        {/* Node content */}
        <div className={cn(
          "flex items-center gap-3 py-2 px-3 rounded-xl transition-all flex-1 min-w-0",
          isRoot
            ? "bg-white  border border-outline-variant/15 hover:shadow-md"
            : "hover:bg-surface-container/50"
        )}>
          <div className="flex-1 min-w-0">
            <span className={cn(
              "font-medium leading-tight",
              isRoot ? "text-[15px] text-on-surface" : "text-sm text-on-surface-variant"
            )}>
              {category.name}
            </span>
            {isRoot && hasChildren && (
              <span className={cn("ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-md", color.light, color.text)}>
                {category.children.length}
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-tertiary/10 text-on-surface-variant/40 hover:text-tertiary transition-colors"
              onClick={() => onAddChild(category.id)}
              title="Add sub-category"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-container text-on-surface-variant/40 hover:text-on-surface transition-colors"
              onClick={() => onEdit(category)}
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-on-surface-variant/40 hover:text-red-500 transition-colors"
              onClick={() => onDelete(category.id)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expand toggle for root */}
          {isRoot && hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-container text-on-surface-variant/40 transition-colors"
            >
              <svg
                className={cn("w-4 h-4 transition-transform duration-200", expanded && "rotate-90")}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Vertical connector */}
      {hasChildren && expanded && (
        <div
          className={cn("absolute w-px", color.line)}
          style={{
            left: isRoot ? "18px" : `${depth * 32 + 36}px`,
            top: isRoot ? "44px" : "32px",
            height: "calc(100% - 44px)",
          }}
        />
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <MindMapBranch
              key={child.id}
              category={child}
              colorIndex={colorIndex}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
