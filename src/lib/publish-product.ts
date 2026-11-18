import { api } from "@/lib/api";
import {
    initialProduct,
    productPayload,
    validateProductStep,
} from "@/lib/product-form";
import type { Product } from "@/types/marketplace";

export function getProductPublishIssue(product: Product): string {
    const form = initialProduct(product);
    for (const step of [0, 1, 2]) {
        const issue = validateProductStep(form, step);
        if (issue) return issue;
    }
    return "";
}

export async function publishProductDraft(
    product: Product,
    idempotencyKey: string,
): Promise<Product> {
    const issue = getProductPublishIssue(product);
    if (issue) throw new Error(issue);
    return api<Product>(`/seller/products/${encodeURIComponent(product.id)}`, {
        method: "PUT",
        body: JSON.stringify(
            productPayload(initialProduct(product), true, product),
        ),
        headers: { "Idempotency-Key": idempotencyKey },
    });
}
