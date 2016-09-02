Example
-------
```js
var fs = require("fs"),
    Monitor = require("bodewell-monitor"),
    PathMonitor;

// hypothetical file path monitor
PathMonitor = Monitor((opts) => {
    var interval = opts.interval,   // number of seconds between checks
        path = opts.path,           // path to file
        mtime = undefined;

    setInterval(() => {
        fs.stat(path, (err, stats) => {
            // when the monitor sees something wrong, it should call its
            // trigger() method; if the monitor is not currently in a triggered
            // state, this will emit an event
            if (err) return this.trigger();

            // when monitor is no longer failing, it should call its ok() method
            // to exit triggered state
            else this.ok();

            if (!mtime || mtime.getTime() !== stats.mtime.getTime()) {
                mtime = stats.mtime;

                // monitor can also emit one-time incidents directly using its
                // incident() method
                this.incident(mtime);
            }
        })
    }, interval * 1000);
});

// check /var/lib/data.foo for changes every 30 seconds
PathMonitor({path: "/var/lib/data.foo", interval: 30})
    // monitor will emit incident events when file is changed
    .on("incident", mtime => {
        console.log("file updated at:", mtime.toISOString());

        // ... do whatever needs to be done when file is updated
    });
```

