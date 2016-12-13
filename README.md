Bodewell Monitor
================
This package exports the Bodewell `Monitor` class used by the Bodewell server
and related plugins.

```js
const Service = require("bodewell-service");
const Monitor = require("bodewell-monitor");

var service = new Service(),
    monitor;

service.foo = 13;
monitor = new Monitor(Service, "foo");

monitor.configure({
    threshold: 10,
    interval: 10
});

monitor.start();
service.value = 8;  // should cause monitor to trigger failure
```
