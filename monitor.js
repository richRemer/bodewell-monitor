const Resource = require("bodewell-resource");
const assign = Object.assign;

const service$priv = Symbol("Monitor.service");
const resource$priv = Symbol("Monitor.resource");
const threshold$priv = Symbol("Monitor.threshold");
const interval$priv = Symbol("Monitor.interval");
const description$priv = Symbol("Monitor.description");
const loop$priv = Symbol("Monitor.loop");
const samples$priv = Symbol("Monitor.samples");

/**
 * Bodewell system monitor object.
 * @constructor
 * @param {Service} service
 */
function Monitor(service) {
    this[service$priv] = service;
    this[samples$priv] = [];
}

Monitor.prototype[service$priv] = null;
Monitor.prototype[resource$priv] = null;
Monitor.prototype[threshold$priv] = 1
Monitor.prototype[interval$priv] = 60;
Monitor.prototype[description$priv] = "";
Monitor.prototype[loop$priv] = null;
Monitor.prototype[samples$priv] = null;

/**
 * Start monitoring the resource.
 */
Monitor.prototype.start = function() {
    var delay;

    if (!this[loop$priv]) {
        delay = this.interval * 1000;
        this[loop$priv] = setInterval(() => this.sample(false), delay);
        this.service.info(`started '${this.description}'`, this);
    }
};

/**
 * Stop monitoring the resource.
 */
Monitor.prototype.stop = function() {
    if (this[loop$priv]) {
        clearInterval(this[loop$priv]);
        this[loop$priv] = null;
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
    var interval = this.interval;

    this[resource$priv] = opts.resource;
    this[threshold$priv] = opts.threshold || 1;
    this[interval$priv] = opts.interval || 60;
    this[description$priv] = opts.description || "";

    if (this[loop$priv]) {
        this.stop();
        this.start();
    }
};

/**
 * Take a sample immediately.  Sampler loop is re-synced unless sync is false.
 * @param {boolean} [sync=true]
 */
Monitor.prototype.sample = function(sync) {
    sync = sync !== false;

    var res = this.service.resource(this.resource),
        sample;

    this.service.info("sampling", this);

    if (res instanceof Resource) {
        sample = assign({}, res);
        sample.value = Number(res);
        sample.valueOf = function() {return this.value;}
    } else if (typeof res === "boolean") {
        sample = Number(res);
    } else {
        sample = undefined;
    }

    this[samples$priv].push([new Date(), sample]);

    this.service.info(sample, this);

    if (isNaN(Number(sample)) || Number(sample) < this.threshold) {
        this.trigger();
    } else {
        this.clear();
    }

    // re-sync sampler if started
    if (this[loop$priv] && sync) {
        this.stop();
        this.start();
    }
};

/**
 * Trigger failure.
 */
Monitor.prototype.trigger = function() {
    this.service.trigger(this);
};

/**
 * Clear failure.
 */
Monitor.prototype.clear = function() {
    this.service.clear(this);
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
     * Interval between resource checks.
     * @name Monitor#interval
     * @type {number}
     * @readonly
     */
    interval: {
        configurable: true,
        enumerable: true,
        get: function() {return this[interval$priv];}
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
    }
});

module.exports = Monitor;
