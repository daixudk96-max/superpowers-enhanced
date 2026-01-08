export function processPayment(amount: number) {
    if (amount <= 0) {
        throw new Error("Invalid amount");
    }
    return { success: true, id: "pay_" + Date.now() };
}