export function money(cents: number) {
    const [whole, fraction] = (cents / 100).toFixed(2).split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `R ${grouped}.${fraction}`;
}
