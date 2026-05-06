/**
 * Runs a test function with a fixed system date, then restores real timers.
 * Use this to make date-dependent tests deterministic.
 * 
 * @param {Date|string} date - The date to fix the system time to
 * @param {Function} fn - The test function to run
 */
const withFixedDate = async (date, fn) => {
    const fixedDate = new Date(date);
    const RealDate = Date;

    // replace Date constructor with one that returns fixed date
    global.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(fixedDate);
            } else {
                super(...args);
            }
        }

        static now() {
            return fixedDate.getTime();
        }
    };

    try {
        await fn();
    } finally {
        // restore real Date
        global.Date = RealDate;
    }
};

module.exports = withFixedDate;