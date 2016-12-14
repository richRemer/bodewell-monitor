const Resource = require("bodewell-resource");
const Loop = require("bodewell-loop");
const assign = Object.assign;

const service$priv = Symbol("Monitor.service");
const resource$priv = Symbol("Monitor.resource");
const threshold$priv = Symbol("Monitor.threshold");
const description$priv = Symbol("Monitor.description");
const loop$priv = Symbol("Monitor.loop");
const samples$priv = Symbol("Monitor.samples");
const triggered$priv = Symbol("Monitor.triggered");

/**
 * Bodewell system monitor object.
 * @constructor
 * @param {Service} service
 */
function Monitor(service) {
    this[service$priv] = service;
    this[samples$priv] = [];
    this[loop$priv] = new Loop(() => this.sample());
}

Monitor.prototype[service$priv] = null;
Monitor.prototype[resource$priv] = null;
Monitor.prototype[threshold$priv] = 1
Monitor.prototype[description$priv] = "";
Monitor.prototype[loop$priv] = null;
Monitor.prototype[samples$priv] = null;
Monitor.prototype[triggered$priv] = false;

/**
 * Start monitoring the resource.
 */
Monitor.prototype.start = function() {
    if (!this[loop$priv].started) {
        this[loop$priv].start();
        this.service.trace("started monitor", this);
    }
};

/**
 * Stop monitoring the resource.
 */
Monitor.prototype.stop = function() {
    if (this[loop$priv].started) {
        this[loop$priv].stop();
        this.service.trace("stopped monitor", this);
    }
};

/**
 * Configure monitor.  Unspecified options will be reset to default.
 * @param {object} opts
 * @param {string} opts.resource
 * @param {number} [opts.threshold]
 * @param {number} [opts.interval]
 * @param {string} [opts.description]
 */
Monitor.prototype.configure = function(opts) {
    var interval = (opts.interval || 60) * 1000;

    this[resource$priv] = opts.resource;
    this[threshold$priv] = opts.threshold || 1;
    this[description$priv] = opts.description || "";

    if (interval !== this[loop$priv].interval) {
        this[loop$priv].changeInterval(interval);
    } else if (this[loop$priv].started) {
        this[loop$priv].now();
    }
};

/**
 * Take a sample.
 */
Monitor.prototype.sample = function(sync) {
    var res = this.service.resource(this.resource);
        sample = Number(res);

    this[samples$priv].push([new Date(), sample]);
    this.service.trace("sampled", this);

    if (isNaN(sample) || sample < this.threshold) {
        this.trigger();
    } else {
        this.release();
    }
};

/**
 * Engage triggered.
 */
Monitor.prototype.trigger = function() {
    if (!this.triggered) {
        this.service.trace("triggering", this);
        this[triggered$priv] = true;
        this.service.trigger(this);
    }
};

/**
 * Release triggered state.
 */
Monitor.prototype.release = function() {
    if (this.triggered) {
        this.service.trace("releasing", this);
        this[triggered$priv] = false;
        this.service.release(this);
    }
};

Object.defineProperties(Monitor.prototype, {
    /**
     * Bodewell service to which monitor reports.
     * @name Monitor#service
     * @type {Service}
     * @readonly
     */
    service: {
        configurable: true,
        enumerable: true,
        get: function() {return this[service$priv];}
    },

    /**
     * Resource path to monitor.
     * @name Monitor#resource
     * @type {string}
     * @readonly
     */
    resource: {
        configurable: true,
        enumerable: true,
        get: function() {return this[resource$priv];}
    },

    /**
     * Threshold for successful monitor.
     * @name Monitor#threshold
     * @type {number}
     * @readonly
     */
    threshold: {
        configurable: true,
        enumerable: true,
        get: function() {return this[threshold$priv];}
    },

    /**
     * Seconds between resource checks.
     * @name Monitor#interval
     * @type {number}
     * @readonly
     */
    interval: {
        configurable: true,
        enumerable: true,
        get: function() {return this[loop$priv].interval / 1000;}
    },

    /**
     * Monitor description.
     * @name Monitor#description
     * @type {string}
     * @readonly
     */
    description: {
        configurable: true,
        enumerable: true,
        get: function() {return this[description$priv];}
    },

    /**
     * True when monitor has been triggered.
     * @name Monitor#triggered
     * @type {boolean}
     * @readonly
     */
    triggered: {
        configurable: true,
        enumerable: true,
        get: function() {return this[triggered$priv];}
    }
});

module.exports = Monitor;
