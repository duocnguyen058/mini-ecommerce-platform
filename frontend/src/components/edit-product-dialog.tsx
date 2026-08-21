import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { adminProductApi, brandApi } from "@/lib/api";
import type { Product, ProductStatus, Brand } from "@/lib/types";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import { toast } from "@/lib/toast";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STATUS_OPTIONS: ProductStatus[] = ["ACTIVE", "INACTIVE", "DRAFT"];

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Product) => void;
}

export function EditProductDialog({ product, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");
  const [brandId, setBrandId] = useState<string>("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    brandApi.list().then((res) => setBrands(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  // Reset form khi mở dialog / đổi product.
   
  useEffect(() => {
    if (open && product) {
      setName(product.name);
      setSlug(product.slug);
      setDescription(product.description ?? "");
      setPrice(String(product.price));
      setStatus(product.status);
      setBrandId(product.brandId ?? "");
    }
  }, [open, product]);
   

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (!name.trim() || !slug.trim() || !price.trim()) {
      toast.error({ title: "Vui lòng điền đủ tên, slug, giá" });
      return;
    }
    if (!SLUG_PATTERN.test(slug.trim())) {
      toast.error({
        title: "Slug không hợp lệ",
        description: "Slug chỉ chứa chữ thường, số và dấu gạch ngang.",
      });
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error({ title: "Giá phải là số không âm" });
      return;
    }

    setSubmitting(true);
    adminProductApi
      .update(product.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        price: priceNum,
        status,
        brandId: brandId || undefined,
      })
      .then((updated) => {
        toast.success({ title: `Đã cập nhật "${updated.name}"` });
        onSaved(updated);
        onOpenChange(false);
      })
      .catch((err) =>
        toast.error({
          title: "Lỗi khi cập nhật sản phẩm",
          description:
            err instanceof Error ? err.message : "Lỗi không xác định",
        }),
      )
      .finally(() => setSubmitting(false));
  }


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.CloseIconButton />
          <Dialog.Header>
            <Dialog.Title>Sửa sản phẩm</Dialog.Title>
            <Dialog.Description>
              SKU và danh mục là định danh — không thể thay đổi.
            </Dialog.Description>
          </Dialog.Header>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Tên</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-desc">Mô tả</Label>
              <textarea
                id="edit-desc"
                className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-price">Giá (VND)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-brand">Thương hiệu</Label>
                <select
                  id="edit-brand"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">-- Không có thương hiệu --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.country || "Chính hãng"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-status">Trạng thái</Label>
                <select
                  id="edit-status"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {PRODUCT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            <Dialog.Footer className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-1.5 size-4" />
                {submitting ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </Dialog.Footer>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
