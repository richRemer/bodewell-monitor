var EventEmitter = require("events").EventEmitter,
    Datum = require("bodewell-datum");

/**
 * System monitor object.
 * @constructor
 */
function Monitor() {
    if (!(this instanceof Monitor)) {
        return new Monitor();
    }

    EventEmitter.call(this);

    this.data = [];
}

Monitor.unknown = Symbol("unknown");
Monitor.triggered = Symbol("triggered");
Monitor.ok = Symbol("ok");

/**
 * Create a new Monitor type.
 * @param {function} init
 * @returns {function}
 */
Monitor.type = function(init) {
    function MonitorType(opts) {
        if (!(this instanceof MonitorType)) {
            return new MonitorType(opts);
        }

        Monitor.call(this);
        init.call(this, opts);
    }

    MonitorType.prototype = Object.create(Monitor.prototype);
    MonitorType.prototype.constructor = MonitorType;

    return MonitorType;
};

Monitor.prototype = Object.create(EventEmitter.prototype);
Monitor.prototype.constructor = Monitor;

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
