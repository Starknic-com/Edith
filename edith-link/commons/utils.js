function sleep(m) {
    const p = new Promise(resolve => {
        setTimeout(() => {
            resolve(m);
        }, m);
    });
    return p;
}

function errored(err) {
    const p = new Promise((resolve, reject) => {
        reject(err);
    });
    return p;
}

module.exports = {
    sleep,
    errored
}