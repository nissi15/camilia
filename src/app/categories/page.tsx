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
import { Plus, Trash2, Pencil, Tags, Search } from "lucide-react";
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

const NODE_COLORS = [
  { bg: "bg-blue-500", ring: "ring-blue-200", line: "bg-blue-300", light: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-emerald-500", ring: "ring-emerald-200", line: "bg-emerald-300", light: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-500", ring: "ring-amber-200", line: "bg-amber-300", light: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-violet-500", ring: "ring-violet-200", line: "bg-violet-300", light: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-rose-500", ring: "ring-rose-200", line: "bg-rose-300", light: "bg-rose-50", text: "text-rose-700" },
  { bg: "bg-cyan-500", ring: "ring-cyan-200", line: "bg-cyan-300", light: "bg-cyan-50", text: "text-cyan-700" },
  { bg: "bg-orange-500", ring: "ring-orange-200", line: "bg-orange-300", light: "bg-orange-50", text: "text-orange-700" },
  { bg: "bg-indigo-500", ring: "ring-indigo-200", line: "bg-indigo-300", light: "bg-indigo-50", text: "text-indigo-700" },
];

function getColor(index: number) {
  return NODE_COLORS[index % NODE_COLORS.length];
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

  const filteredCategories = searchQuery
    ? categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.children?.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;

  return (
    <AppShell title="Categories">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Categories</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Organize your ingredients into categories for easy tracking
            </p>
          </div>
          <Button
            onClick={() => openCreate()}
            className="bg-tertiary hover:bg-tertiary/90 text-white rounded-lg h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Category
          </Button>
        </div>

        {/* Stats + Search */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-semibold text-on-surface">{totalCategories}</p>
              <p className="text-xs text-on-surface-variant font-medium">Total</p>
            </div>
            <div className="w-px bg-outline-variant/20" />
            <div>
              <p className="text-2xl font-semibold text-on-surface">{topLevel}</p>
              <p className="text-xs text-on-surface-variant font-medium">Groups</p>
            </div>
            <div className="w-px bg-outline-variant/20" />
            <div>
              <p className="text-2xl font-semibold text-on-surface">{subCategories}</p>
              <p className="text-xs text-on-surface-variant font-medium">Sub-items</p>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-surface-container border-0 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Mind Map */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-4">
            <Tags className="w-8 h-8 text-tertiary" />
          </div>
          <h3 className="text-base font-semibold text-on-surface mb-1">
            {searchQuery ? "No matches found" : "No categories yet"}
          </h3>
          <p className="text-sm text-on-surface-variant mb-4">
            {searchQuery ? "Try a different search term" : "Create your first category to start organizing"}
          </p>
          {!searchQuery && (
            <Button onClick={() => openCreate()} className="bg-tertiary text-white rounded-lg h-9">
              <Plus className="w-4 h-4 mr-1.5" /> Create Category
            </Button>
          )}
        </div>
      ) : (
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
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-xl sm:max-w-md border border-outline-variant/20">
          <DialogHeader>
            <DialogTitle className="text-on-surface text-lg font-semibold">
              {editId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
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
                className="rounded-lg h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">Parent Category</Label>
              <Select value={form.parentId} onValueChange={(v) => setForm(f => ({ ...f, parentId: v === "NONE" ? "" : (v ?? "") }))}>
                <SelectTrigger className="rounded-lg h-9">
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
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">
                Description <span className="text-on-surface-variant/50 font-normal">(optional)</span>
              </Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                className="rounded-lg h-9"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-tertiary hover:bg-tertiary/90 text-white rounded-lg h-9 mt-2"
            >
              {editId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ── Mind Map Branch ─────────────────────────────────────────────── */

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
          <div className="absolute left-0" style={{ left: `${depth * 32 + 8}px` }}>
            <div className={cn("w-4 h-px", color.line)} style={{ marginTop: '1px' }} />
          </div>
        )}

        {/* Node dot */}
        <div className="relative z-10 mr-3 shrink-0">
          {isRoot ? (
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center ring-4 shadow-sm",
              color.bg, color.ring
            )}>
              <Tags className="w-4 h-4 text-white" />
            </div>
          ) : hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center ring-2 transition-all",
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
          "flex items-center gap-3 py-2 px-3 rounded-lg transition-all flex-1 min-w-0",
          isRoot
            ? "bg-white shadow-sm border border-outline-variant/15 hover:shadow-md"
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
              <span className={cn("ml-2 text-xs font-medium px-1.5 py-0.5 rounded-md", color.light, color.text)}>
                {category.children.length}
              </span>
            )}
          </div>

          {/* Actions */}
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

          {/* Expand/collapse for root */}
          {isRoot && hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-container text-on-surface-variant/40 transition-colors"
            >
              <svg className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Vertical connector line for children */}
      {hasChildren && expanded && (
        <div
          className={cn("absolute w-px", color.line)}
          style={{
            left: isRoot ? '18px' : `${depth * 32 + 36}px`,
            top: isRoot ? '44px' : '32px',
            height: 'calc(100% - 44px)',
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
