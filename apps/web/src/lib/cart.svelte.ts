import { TAX_RATE } from "./money";

export interface CartProduct {
	_id: string;
	name: string;
	price: number;
	stock: number;
}

export interface CartLine {
	productId: string;
	name: string;
	price: number;
	qty: number;
	stock: number;
}

class Cart {
	lines = $state<CartLine[]>([]);
	discount = $state(0);

	get count(): number {
		return this.lines.reduce((sum, l) => sum + l.qty, 0);
	}

	get subtotal(): number {
		return this.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
	}

	get taxable(): number {
		return Math.max(0, this.subtotal - this.discount);
	}

	get tax(): number {
		return Math.round(this.taxable * TAX_RATE);
	}

	get total(): number {
		return this.taxable + this.tax;
	}

	add(product: CartProduct): boolean {
		const line = this.lines.find((l) => l.productId === product._id);
		if (line) {
			if (line.qty >= product.stock) return false;
			line.qty += 1;
		} else {
			if (product.stock < 1) return false;
			this.lines.push({
				productId: product._id,
				name: product.name,
				price: product.price,
				qty: 1,
				stock: product.stock,
			});
		}
		return true;
	}

	setQty(productId: string, qty: number) {
		const line = this.lines.find((l) => l.productId === productId);
		if (!line) return;
		line.qty = Math.max(0, Math.min(qty, line.stock));
		if (line.qty === 0) this.remove(productId);
	}

	remove(productId: string) {
		this.lines = this.lines.filter((l) => l.productId !== productId);
	}

	clear() {
		this.lines = [];
		this.discount = 0;
	}
}

export const cart = new Cart();
