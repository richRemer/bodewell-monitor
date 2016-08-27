```js
var fs = require("fs"),
    monitor = require("bodewell-monitor"),
    path_monitor;

// hypothetical file path monitor
path_monitor = monitor(function(opts) {
    var interval = opts.interval,   // number of seconds between checks
        path = opts.path,           // path to file
        mtime = undefined;

    setInterval(() => {
        fs.stat(path, (err, stats) => {
            // when the monitor sees something wrong, it should call its
            // fail() method; if the monitor is not currently in a failed
            // state, this will trigger an alert
            if (err) return this.fail(err);

            // when monitor is no longer in a failed state, it should call
            // its clear() method to exit failed state
            else this.clear();

            if (!mtime || mtime.getTime() !== stats.mtime.getTime()) {
                mtime = stats.mtime;

                // monitor can trigger alerts directly using its alert()
                // method
                this.alert(mtime);
            }
        })
    }, interval * 1000);
});

// check /var/lib/data.foo for changes every 30 seconds
path_monitor({path: "/var/lib/data.foo", interval: 30})
    // monitor will emit alert events when file is changed
    .on("alert", mtime => {
        console.log("file updated at:", mtime.toISOString());

        // ... do whatever needs to be done when file is updated
    });
```
