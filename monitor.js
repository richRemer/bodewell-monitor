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
function Monitor(service, resource) {
    this[service$priv] = service;
    this[samples$priv] = [];
    this.configure({resource: resource});
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
    if (!this[loop$priv]) {
        this[loop$priv] = setInterval(() => this.sample(false), this.interval);
        this.service.info(`monitor started ${this.description}`);
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
 * @param {string} resource
 * @param {number} [threshold]
 * @param {number} [interval]
 * @param {string} [description]
 */
Monitor.prototype.configure = function(opts) {
    this[resource$priv] = opts.resource;
    this[threshold$priv] = opts.threshold || 1;
    this[interval$priv] = opts.interval || 60;
    this[description$priv] = opts.description || "";
};

/**
 * Take a sample immediately.  Optionally re-sync the sampler loop.
 * @param {boolean} [sync=true]
 */
Monitor.prototype.sample = function(sync) {
    if (arguments.length === 0) sync = true;

    var res = this.service.resource(this.resource),
        sample;

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

    if (isNaN(Number(sample) || Number(sample) < this.threshold) {
        this.fail(sample);
    } else {
        this.success(sample);
    }

    // re-sync sampler if started
    if (this[loop$priv] && sync) {
        this.stop();
        this.start();
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
        get: function() {return this[resouce$priv];}
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
