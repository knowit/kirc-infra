function processTimestamp(timestampAsString) {
    let date;
    const TOLERATEDTIMEDIFFERENCE = 2;
    try {
        date = new Date(timestampAsString)
        const currentDate = new Date();
        if (Math.abs(currentDate.getTime() - date.getTime()) > 1000 * 60 * TOLERATEDTIMEDIFFERENCE) {
            console.error("Invalid date, using current date");
            throw new Error("Invalid date");
        }
    } catch (err) {
        date = new Date();
    }
    return date.toISOString()
}

console.log(processTimestamp((new Date()).toISOString()));

const d = new Date(2021, 4, 9);
console.log(processTimestamp(d.toISOString()));

const d2 = new Date();
d2.setMinutes(d2.getMinutes() + 6);
console.log(processTimestamp(d2.toISOString()));