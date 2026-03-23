"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Tags, FolderOpen, ChevronDown, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CATEGORY_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-500/20" },
  { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20" },
  { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-500/20" },
  { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
  { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20" },
];

function getColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

function countAllChildren(cat: Category): number {
  let count = cat.children?.length || 0;
  cat.children?.forEach(c => { count += countAllChildren(c); });
  return count;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", parentId: "", description: "" });
  const [error, setError] = useState("");

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
    fetchCategories();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Cannot delete");
      return;
    }
    fetchCategories();
  }

  const totalCategories = flatCategories.length;
  const topLevel = categories.length;
  const subCategories = totalCategories - topLevel;

  return (
    <AppShell title="Categories">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Categories</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Organize your ingredients into categories for easy tracking
            </p>
          </div>
          <Button
            onClick={() => openCreate()}
            className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl h-10 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container">
              <Tags className="w-3.5 h-3.5 text-tertiary" />
              <span className="text-xs font-medium text-on-surface">{totalCategories} total</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container">
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-on-surface">{topLevel} groups</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-on-surface">{subCategories} sub-items</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container" />
                    <div className="h-4 w-24 bg-surface-container rounded" />
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded" />
                  <div className="h-3 w-2/3 bg-surface-container rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-4">
              <Tags className="w-8 h-8 text-tertiary" />
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-1">No categories yet</h3>
            <p className="text-sm text-on-surface-variant mb-4">Create your first category to start organizing ingredients</p>
            <Button
              onClick={() => openCreate()}
              className="bg-tertiary hover:bg-tertiary/90 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              colorIndex={i}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddChild={openCreate}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-on-surface text-lg">
              {editId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dairy, Meat, Vegetables..."
                required
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Parent Category
              </Label>
              <Select value={form.parentId} onValueChange={(v) => setForm(f => ({ ...f, parentId: v === "NONE" ? "" : (v ?? "") }))}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (top-level)</SelectItem>
                  {flatCategories.filter(c => c.id !== editId).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Description <span className="text-on-surface-variant/50 normal-case">(optional)</span>
              </Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                className="rounded-xl h-10"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-tertiary hover:bg-tertiary/90 text-white rounded-xl h-10 mt-2"
            >
              {editId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ── Category Card ─────────────────────────────────────────────── */

function CategoryCard({
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
  const totalChildren = countAllChildren(category);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.bg)}>
              <Tags className={cn("w-5 h-5", color.text)} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-on-surface leading-tight">
                {category.name}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {totalChildren === 0
                  ? "No sub-categories"
                  : `${totalChildren} sub-categor${totalChildren === 1 ? "y" : "ies"}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg hover:bg-tertiary/10 hover:text-tertiary"
              onClick={() => onAddChild(category.id)}
              title="Add sub-category"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg hover:bg-surface-container"
              onClick={() => onEdit(category)}
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 hover:text-red-500"
              onClick={() => onDelete(category.id)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Children list */}
        {hasChildren && (
          <div className="mt-3 pt-3 border-t border-outline-variant/10">
            <div className="space-y-0.5">
              {category.children.map((child) => (
                <SubCategoryRow
                  key={child.id}
                  category={child}
                  depth={0}
                  colorIndex={colorIndex}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Sub-Category Row (recursive) ──────────────────────────────── */

function SubCategoryRow({
  category,
  depth,
  colorIndex,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  depth: number;
  colorIndex: number;
  onEdit: (cat: FlatCategory) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const color = getColor(colorIndex);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-container/50 group/row transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="w-4 h-4 flex items-center justify-center shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant/60" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/60" />
            )
          ) : (
            <div className={cn("w-1.5 h-1.5 rounded-full", color.bg)} />
          )}
        </button>

        {/* Name */}
        <span className={cn(
          "flex-1 text-[13px]",
          hasChildren ? "font-medium text-on-surface" : "text-on-surface-variant"
        )}>
          {category.name}
        </span>

        {/* Child count badge */}
        {hasChildren && (
          <span className="text-[10px] font-medium text-on-surface-variant/50 mr-1">
            {category.children.length}
          </span>
        )}

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-tertiary/10 hover:text-tertiary text-on-surface-variant/50"
            onClick={() => onAddChild(category.id)}
            title="Add sub-category"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant/50"
            onClick={() => onEdit(category)}
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-500 text-on-surface-variant/50"
            onClick={() => onDelete(category.id)}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Nested children */}
      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <SubCategoryRow
              key={child.id}
              category={child}
              depth={depth + 1}
              colorIndex={colorIndex}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
