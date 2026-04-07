export function rupiah(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

export function generateOrderId(lastId) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = `NB${dd}${mm}${yy}`;

    let seq = 1;
    if (lastId && lastId.startsWith(prefix)) {
        const parts = lastId.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(3, '0')}`;
}
