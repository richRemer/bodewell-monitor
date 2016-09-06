var EventEmitter = require("events").EventEmitter,
    Datum = require("bodewell-datum"),
    keyed = require("bodewell-keyed"),
    Monitor;

/**
 * Define a new monitor or monitor type.
 * @param {string} key
 * @param {object} opts
 */
Monitor = keyed(function(opts) {
    if (!this[Monitor.constructed]) {
        this[Monitor.constructed] = true;
        EventEmitter.call(this);
        this.data = [];
    }
}, EventEmitter.prototype);

Monitor.unknown = Symbol("unknown");
Monitor.triggered = Symbol("triggered");
Monitor.ok = Symbol("ok");
Monitor.constructed = Symbol("constructed");

/**
 * Create a new Monitor type.
 * @param {function} config
 * @returns {function}
 */
Monitor.type = function(config) {
    function MonitorType(key, opts) {
        var monitor;

        if (Monitor.loaded(key)) {
            monitor = Monitor(key);
            if (!monitor[MonitorType.implementation]) {
                throw new Error("cannot change monitor type");
            }
            Monitor.call(monitor, key, opts);
            monitor[MonitorType.implementation](opts);
        } else {
            Monitor.assign(key, Object.create(MonitorType.prototype));
            Monitor(key, opts);
            Monitor(key)[MonitorType.implementation](opts);
        }

        return Monitor(key);
    }

    MonitorType.implementation = Symbol("implementation");

    MonitorType.prototype = Object.create(Monitor.prototype);
    MonitorType.prototype.constructor = MonitorType;
    MonitorType.prototype[MonitorType.implementation] = config;

    return MonitorType;
};

Monitor.prototype = Object.create(EventEmitter.prototype);
Monitor.prototype.constructor = Monitor;
Monitor.prototype[Monitor.constructed] = false;

/**
 * @name Monitor#state
 * @type {Symbol}
 * @readonly
 */
Monitor.prototype.state = Monitor.unknown;

/**
 * @name Monitor#data
 * @type {Datum[]}
 * @readonly
 */
Monitor.prototype.data = null;

/**
 * Configure the monitor.
 */
Monitor.prototype.configure = function() {
    // base implementation does nothing
};

/**
 * Record data point.
 * @param {number|Datum} value
 */
Monitor.prototype.record = function(value) {
    var datum = value instanceof Datum
        ? value
        : Datum(new Date(), value);

    this.data.push(datum);
    this.emit("data", datum);
};

/**
 * Erase all recorded data.
 */
Monitor.prototype.erase = function() {
    this.data.splice(0);
};

/**
 * Trigger the monitor.
 */
Monitor.prototype.trigger = function() {
    var emit = this.state === Monitor.ok;
    this.state = Monitor.triggered;
    if (emit) this.emit("triggered")
};

/**
 * Reset triggered monitor.
 */
Monitor.prototype.ok = function() {
    var emit = this.state === Monitor.triggered;
    this.state = Monitor.ok;
    if (emit) this.emit("ok");
};

/**
 * Report an incident.
 * @param {*} incident
 */
Monitor.prototype.incident = function(incident) {
    this.emit("incident", incident);
};

module.exports = Monitor;
